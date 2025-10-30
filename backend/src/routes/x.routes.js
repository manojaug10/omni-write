const express = require('express');
const userService = require('../services/user.service');
const { PROVIDERS, upsertConnection, getConnectionByUserId } = require('../services/socialConnection.service');
const xService = require('../services/x.service');
const { createState, consumeState } = require('../utils/oauthStateStore');
const scheduledService = require('../services/scheduledTweet.service');
const scheduledThreadService = require('../services/scheduledThread.service');

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

    let connection;
    try {
      connection = await upsertConnection({
        userId: dbUser.id,
        provider: PROVIDERS.X,
        providerUserId,
        accessToken,
        accessTokenExpiresAt,
        refreshToken,
        username: username || null,
      });
    } catch (e) {
      // Unique constraint violation: this X account is already linked to a different Omni Write user
      if (e && (e.code === 'P2002' || (e.meta && Array.isArray(e.meta.target) && e.meta.target.includes('provider') && e.meta.target.includes('providerUserId')))) {
        return handleCallbackRedirect(res, { success: false, message: 'This X account is already connected to another Omni Write user.', redirect: statePayload.redirect, statusCode: 409 });
      }
      throw e;
    }

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

// GET /api/x/connection - fetch connection summary from DB
router.get('/x/connection', requireAuth, async (req, res) => {
  try {
    const dbUser = await userService.findUserByClerkId(req.auth.userId);
    if (!dbUser) return res.status(404).json({ error: 'UserNotFound' });
    const connection = await getConnectionByUserId(dbUser.id, PROVIDERS.X);
    if (!connection) return res.status(404).json({ error: 'XConnectionNotFound' });
    return res.status(200).json({
      connection: {
        id: connection.id,
        provider: connection.provider,
        username: connection.username,
        providerUserId: connection.providerUserId,
        accessTokenExpiresAt: connection.accessTokenExpiresAt,
        createdAt: connection.createdAt,
        updatedAt: connection.updatedAt,
      },
    });
  } catch (e) {
    console.error('X connection fetch error:', e);
    return res.status(500).json({ error: 'XConnectionFetchFailed', message: e.message });
  }
});

// DELETE /api/x/connection - disconnect (delete) the connection
router.delete('/x/connection', requireAuth, async (req, res) => {
  try {
    const dbUser = await userService.findUserByClerkId(req.auth.userId);
    if (!dbUser) return res.status(404).json({ error: 'UserNotFound' });
    const existing = await getConnectionByUserId(dbUser.id, PROVIDERS.X);
    if (!existing) return res.status(404).json({ error: 'XConnectionNotFound' });
    await require('../services/socialConnection.service').deleteConnection(dbUser.id, PROVIDERS.X);
    return res.status(200).json({ status: 'ok' });
  } catch (e) {
    console.error('X disconnect error:', e);
    return res.status(500).json({ error: 'XDisconnectFailed', message: e.message });
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

// POST /api/x/thread - post a thread
router.post('/x/thread', requireAuth, async (req, res) => {
  try {
    const { tweets } = req.body || {};
    if (!Array.isArray(tweets) || tweets.length === 0) {
      return res.status(400).json({ error: 'MissingTweets', message: 'tweets array is required and must not be empty' });
    }
    // Validate that all tweets are strings
    for (let i = 0; i < tweets.length; i++) {
      if (typeof tweets[i] !== 'string' || !tweets[i].trim()) {
        return res.status(400).json({ error: 'InvalidTweet', message: `Tweet at index ${i} must be a non-empty string` });
      }
    }
    const dbUser = await userService.findUserByClerkId(req.auth.userId);
    if (!dbUser) return res.status(404).json({ error: 'UserNotFound' });
    const connection = await getConnectionByUserId(dbUser.id, PROVIDERS.X);
    if (!connection) return res.status(404).json({ error: 'XConnectionNotFound' });
    const result = await xService.postThread(connection.accessToken, tweets);
    return res.status(201).json(result);
  } catch (e) {
    console.error('X post thread error:', e);
    return res.status(500).json({ error: 'XThreadPostFailed', message: e.message });
  }
});

// DELETE /api/x/tweet/:id - delete a tweet by id
router.delete('/x/tweet/:id', requireAuth, async (req, res) => {
  try {
    const tweetId = req.params.id;
    if (!tweetId) return res.status(400).json({ error: 'MissingTweetId' });
    const dbUser = await userService.findUserByClerkId(req.auth.userId);
    if (!dbUser) return res.status(404).json({ error: 'UserNotFound' });
    const connection = await getConnectionByUserId(dbUser.id, PROVIDERS.X);
    if (!connection) return res.status(404).json({ error: 'XConnectionNotFound' });
    const result = await xService.deleteTweet(connection.accessToken, tweetId);
    return res.status(200).json(result);
  } catch (e) {
    console.error('X delete tweet error:', e);
    return res.status(500).json({ error: 'XDeleteFailed', message: e.message });
  }
});

// POST /api/x/tweet/schedule - schedule a tweet
router.post('/x/tweet/schedule', requireAuth, async (req, res) => {
  try {
    const { text, scheduledAt } = req.body || {};
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'MissingText' });
    if (!scheduledAt) return res.status(400).json({ error: 'MissingScheduledAt' });
    const dbUser = await userService.findUserByClerkId(req.auth.userId);
    if (!dbUser) return res.status(404).json({ error: 'UserNotFound' });
    const st = await scheduledService.createScheduledTweet(dbUser.id, text, scheduledAt);
    return res.status(201).json({ scheduled: st });
  } catch (e) {
    console.error('X schedule tweet error:', e);
    return res.status(500).json({ error: 'XScheduleFailed', message: e.message });
  }
});

// GET /api/x/tweet/schedule - list scheduled tweets for current user
router.get('/x/tweet/schedule', requireAuth, async (req, res) => {
  try {
    const dbUser = await userService.findUserByClerkId(req.auth.userId);
    if (!dbUser) return res.status(404).json({ error: 'UserNotFound' });
    const items = await scheduledService.listScheduledTweetsForUser(dbUser.id, 50);
    return res.status(200).json({ scheduled: items });
  } catch (e) {
    console.error('X list scheduled error:', e);
    return res.status(500).json({ error: 'XListScheduledFailed', message: e.message });
  }
});

// DELETE /api/x/tweet/schedule/:id - cancel
router.delete('/x/tweet/schedule/:id', requireAuth, async (req, res) => {
  try {
    const dbUser = await userService.findUserByClerkId(req.auth.userId);
    if (!dbUser) return res.status(404).json({ error: 'UserNotFound' });
    const id = req.params.id;
    const result = await scheduledService.cancelScheduledTweet(dbUser.id, id);
    if (result.count === 0) return res.status(404).json({ error: 'NotFound' });
    return res.status(200).json({ status: 'ok' });
  } catch (e) {
    console.error('X cancel scheduled error:', e);
    return res.status(500).json({ error: 'XCancelScheduledFailed', message: e.message });
  }
});

// POST /api/x/thread/schedule - schedule a thread
router.post('/x/thread/schedule', requireAuth, async (req, res) => {
  try {
    const { tweets, scheduledAt } = req.body || {};
    if (!Array.isArray(tweets) || tweets.length === 0) {
      return res.status(400).json({ error: 'MissingTweets', message: 'tweets array is required and must not be empty' });
    }
    // Validate that all tweets are strings
    for (let i = 0; i < tweets.length; i++) {
      if (typeof tweets[i] !== 'string' || !tweets[i].trim()) {
        return res.status(400).json({ error: 'InvalidTweet', message: `Tweet at index ${i} must be a non-empty string` });
      }
    }
    if (!scheduledAt) return res.status(400).json({ error: 'MissingScheduledAt' });
    const dbUser = await userService.findUserByClerkId(req.auth.userId);
    if (!dbUser) return res.status(404).json({ error: 'UserNotFound' });
    const st = await scheduledThreadService.createScheduledThread(dbUser.id, tweets, scheduledAt);
    return res.status(201).json({ scheduled: st });
  } catch (e) {
    console.error('X schedule thread error:', e);
    return res.status(500).json({ error: 'XScheduleThreadFailed', message: e.message });
  }
});

// GET /api/x/thread/schedule - list scheduled threads for current user
router.get('/x/thread/schedule', requireAuth, async (req, res) => {
  try {
    const dbUser = await userService.findUserByClerkId(req.auth.userId);
    if (!dbUser) return res.status(404).json({ error: 'UserNotFound' });
    const items = await scheduledThreadService.listScheduledThreadsForUser(dbUser.id, 50);
    return res.status(200).json({ scheduled: items });
  } catch (e) {
    console.error('X list scheduled threads error:', e);
    return res.status(500).json({ error: 'XListScheduledThreadsFailed', message: e.message });
  }
});

// DELETE /api/x/thread/schedule/:id - cancel scheduled thread
router.delete('/x/thread/schedule/:id', requireAuth, async (req, res) => {
  try {
    const dbUser = await userService.findUserByClerkId(req.auth.userId);
    if (!dbUser) return res.status(404).json({ error: 'UserNotFound' });
    const id = req.params.id;
    const result = await scheduledThreadService.cancelScheduledThread(dbUser.id, id);
    if (result.count === 0) return res.status(404).json({ error: 'NotFound' });
    return res.status(200).json({ status: 'ok' });
  } catch (e) {
    console.error('X cancel scheduled thread error:', e);
    return res.status(500).json({ error: 'XCancelScheduledThreadFailed', message: e.message });
  }
});

function handleCallbackRedirect(res, { success, message, redirect, data, statusCode }) {
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
  return res.status(statusCode || 400).json({ status: 'error', message: message || 'X OAuth failed' });
}

module.exports = router;


