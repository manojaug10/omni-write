const express = require('express');
const userService = require('../services/user.service');
const { PROVIDERS, upsertConnection, getConnectionByUserId } = require('../services/socialConnection.service');
const xService = require('../services/x.service');
const { createState, consumeState } = require('../utils/oauthStateStore');

const router = express.Router();

function requireAuth(req, res, next) {
  try {
    const clerkUserId = req.auth && req.auth.userId;
    if (!clerkUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// GET /api/auth/x - start OAuth
router.get('/auth/x', requireAuth, (req, res) => {
  try {
    const state = createState({ clerkUserId: req.auth.userId, redirect: req.query.redirect });
    const codeVerifier = xService.generateCodeVerifier();
    const codeChallenge = xService.generateCodeChallenge(codeVerifier);

    // Persist the verifier in-memory mapped to state
    const stateWithVerifier = createState({
      clerkUserId: req.auth.userId,
      codeVerifier,
      redirect: req.query.redirect,
    });

    const authorizationUrl = xService.buildAuthorizationUrl({ state: stateWithVerifier, codeChallenge, scope: req.query.scope });
    const wantsJson = req.query.mode === 'json' || (req.headers['accept'] || '').includes('application/json');
    if (wantsJson) {
      return res.status(200).json({ authorizationUrl });
    }
    res.redirect(authorizationUrl);
  } catch (error) {
    console.error('X OAuth redirect error:', error);
    res.status(500).json({ error: 'XOAuthRedirectFailed', message: error.message });
  }
});

// GET /api/auth/x/callback - OAuth callback (no auth; validate via state)
router.get('/auth/x/callback', async (req, res) => {
  const { code, state, error, error_description: errorDescription } = req.query;

  if (error) {
    console.error('X OAuth callback error:', error, errorDescription);
    return handleCallbackRedirect(res, { success: false, message: errorDescription || error });
  }

  if (!code || !state) {
    return handleCallbackRedirect(res, { success: false, message: 'Missing OAuth code or state.' });
  }

  try {
    const statePayload = consumeState(state);
    if (!statePayload || !statePayload.clerkUserId) {
      throw new Error('Invalid or expired OAuth state');
    }

    const codeVerifier = statePayload.codeVerifier;
    if (!codeVerifier) {
      throw new Error('Missing PKCE code verifier');
    }

    const dbUser = await userService.findUserByClerkId(statePayload.clerkUserId);
    if (!dbUser) {
      throw new Error('Application user not found for authenticated Clerk user');
    }

    const tokenResponse = await xService.exchangeCodeForTokens({ code, codeVerifier });
    const accessToken = tokenResponse.access_token;
    const refreshToken = tokenResponse.refresh_token || null;
    const expiresIn = tokenResponse.expires_in;

    // Fetch user profile (id/username) to store providerUserId
    const me = await xService.getMe(accessToken);
    const providerUserId = me && me.data && me.data.id;
    const username = me && me.data && (me.data.username || me.data.name);
    if (!providerUserId) {
      throw new Error('Unable to fetch X user profile');
    }

    const accessTokenExpiresAt = typeof expiresIn === 'number' ? new Date(Date.now() + expiresIn * 1000) : null;

    const connection = await upsertConnection({
      userId: dbUser.id,
      provider: PROVIDERS.X,
      providerUserId,
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
      username: username || null,
    });

    return handleCallbackRedirect(res, { success: true, redirect: statePayload.redirect, data: { connectionId: connection.id } });
  } catch (callbackError) {
    console.error('X OAuth callback processing error:', callbackError);
    return handleCallbackRedirect(res, { success: false, message: callbackError.message });
  }
});

// POST /api/x/refresh - refresh token
router.post('/x/refresh', requireAuth, async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    const dbUser = await userService.findUserByClerkId(clerkUserId);
    if (!dbUser) {
      return res.status(404).json({ error: 'UserNotFound' });
    }
    const connection = await getConnectionByUserId(dbUser.id, PROVIDERS.X);
    if (!connection || !connection.refreshToken) {
      return res.status(404).json({ error: 'XConnectionNotFound' });
    }

    const refreshed = await xService.refreshAccessToken(connection.refreshToken);
    const accessTokenExpiresAt = typeof refreshed.expires_in === 'number' ? new Date(Date.now() + refreshed.expires_in * 1000) : null;

    const updated = await upsertConnection({
      userId: dbUser.id,
      provider: PROVIDERS.X,
      providerUserId: connection.providerUserId,
      accessToken: refreshed.access_token,
      accessTokenExpiresAt,
      refreshToken: refreshed.refresh_token || connection.refreshToken,
      username: connection.username,
    });

    return res.status(200).json({ connection: { id: updated.id, provider: updated.provider, username: updated.username, accessTokenExpiresAt: updated.accessTokenExpiresAt, updatedAt: updated.updatedAt } });
  } catch (refreshError) {
    console.error('X token refresh error:', refreshError);
    return res.status(500).json({ error: 'XRefreshFailed', message: refreshError.message });
  }
});

// GET /api/x/me - proxy to fetch current X profile
router.get('/x/me', requireAuth, async (req, res) => {
  try {
    const dbUser = await userService.findUserByClerkId(req.auth.userId);
    if (!dbUser) return res.status(404).json({ error: 'UserNotFound' });
    const connection = await getConnectionByUserId(dbUser.id, PROVIDERS.X);
    if (!connection) return res.status(404).json({ error: 'XConnectionNotFound' });
    const me = await xService.getMe(connection.accessToken);
    return res.status(200).json(me);
  } catch (e) {
    console.error('X /me error:', e);
    return res.status(500).json({ error: 'XMeFailed', message: e.message });
  }
});

// POST /api/x/tweet - post text
router.post('/x/tweet', requireAuth, async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'MissingText' });
    const dbUser = await userService.findUserByClerkId(req.auth.userId);
    if (!dbUser) return res.status(404).json({ error: 'UserNotFound' });
    const connection = await getConnectionByUserId(dbUser.id, PROVIDERS.X);
    if (!connection) return res.status(404).json({ error: 'XConnectionNotFound' });
    const result = await xService.postTweet(connection.accessToken, text);
    return res.status(201).json(result);
  } catch (e) {
    console.error('X post tweet error:', e);
    return res.status(500).json({ error: 'XPostFailed', message: e.message });
  }
});

function handleCallbackRedirect(res, { success, message, redirect, data }) {
  // Reuse Threads redirect URIs if desired; fallback to root
  const successRedirectUri = process.env.X_SUCCESS_REDIRECT_URI || process.env.THREADS_SUCCESS_REDIRECT_URI;
  const failureRedirectUri = process.env.X_FAILURE_REDIRECT_URI || process.env.THREADS_FAILURE_REDIRECT_URI;
  const baseRedirect = redirect || (success ? successRedirectUri : failureRedirectUri) || '/';

  if (baseRedirect) {
    const url = new URL(baseRedirect);
    url.searchParams.set('x_oauth', success ? 'success' : 'error');
    if (message) url.searchParams.set('message', message);
    if (data && typeof data.connectionId === 'string') url.searchParams.set('connection_id', data.connectionId);
    return res.redirect(url.toString());
  }

  if (success) return res.status(200).json({ status: 'ok', message: message || 'X account connected', data });
  return res.status(400).json({ status: 'error', message: message || 'X OAuth failed' });
}

module.exports = router;


