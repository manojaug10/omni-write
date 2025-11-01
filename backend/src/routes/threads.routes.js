const express = require('express');
const userService = require('../services/user.service');
const { PROVIDERS, upsertConnection, getConnectionByUserId } = require('../services/socialConnection.service');
const threadsService = require('../services/threads.service');
const { createState, consumeState } = require('../utils/oauthStateStore');
const scheduledService = require('../services/scheduledTweet.service');

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

// GET /api/auth/threads - start OAuth
router.get('/auth/threads', requireAuth, (req, res) => {
  try {
    const state = createState({
      clerkUserId: req.auth.userId,
      redirect: req.query.redirect,
    });

    const authorizationUrl = threadsService.buildAuthorizationUrl({
      state,
      scope: req.query.scope,
    });

    const wantsJson = req.query.mode === 'json' || (req.headers['accept'] || '').includes('application/json');
    if (wantsJson) {
      return res.status(200).json({ authorizationUrl });
    }
    res.redirect(authorizationUrl);
  } catch (error) {
    console.error('Threads OAuth redirect error:', error);
    res.status(500).json({ error: 'ThreadsOAuthRedirectFailed', message: error.message });
  }
});

// GET /api/auth/threads/callback - OAuth callback (no auth; validate via state)
router.get('/auth/threads/callback', async (req, res) => {
  const { code, state, error, error_description: errorDescription } = req.query;

  if (error) {
    console.error('Threads OAuth callback error:', error, errorDescription);
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

    const dbUser = await userService.findUserByClerkId(statePayload.clerkUserId);
    if (!dbUser) {
      throw new Error('Application user not found for authenticated Clerk user');
    }

    const tokenResponse = await threadsService.exchangeCodeForTokens({ code });
    const accessToken = tokenResponse.access_token;
    const expiresIn = tokenResponse.expires_in || null;

    // Fetch user profile (id/username) to store providerUserId
    const me = await threadsService.getMe(accessToken);
    const providerUserId = me && me.data && me.data.id;
    const username = me && me.data && me.data.username;
    if (!providerUserId) {
      throw new Error('Unable to fetch Threads user profile');
    }

    const accessTokenExpiresAt = typeof expiresIn === 'number' ? new Date(Date.now() + expiresIn * 1000) : null;

    let connection;
    try {
      connection = await upsertConnection({
        userId: dbUser.id,
        provider: PROVIDERS.THREADS,
        providerUserId,
        accessToken,
        accessTokenExpiresAt,
        refreshToken: null, // Instagram uses long-lived tokens, no separate refresh token
        username: username || null,
      });
    } catch (e) {
      // Unique constraint violation: this Threads account is already linked to a different Omni Write user
      if (e && (e.code === 'P2002' || (e.meta && Array.isArray(e.meta.target) && e.meta.target.includes('provider') && e.meta.target.includes('providerUserId')))) {
        return handleCallbackRedirect(res, {
          success: false,
          message: 'This Threads account is already connected to another Omni Write user.',
          redirect: statePayload.redirect,
          statusCode: 409,
        });
      }
      throw e;
    }

    return handleCallbackRedirect(res, {
      success: true,
      redirect: statePayload.redirect,
      data: { connectionId: connection.id },
    });
  } catch (callbackError) {
    console.error('Threads OAuth callback processing error:', callbackError);
    return handleCallbackRedirect(res, { success: false, message: callbackError.message });
  }
});

// POST /api/threads/refresh - refresh token
router.post('/threads/refresh', requireAuth, async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    const dbUser = await userService.findUserByClerkId(clerkUserId);
    if (!dbUser) {
      return res.status(404).json({ error: 'UserNotFound' });
    }
    const connection = await getConnectionByUserId(dbUser.id, PROVIDERS.THREADS);
    if (!connection || !connection.accessToken) {
      return res.status(404).json({ error: 'ThreadsConnectionNotFound' });
    }

    const refreshed = await threadsService.refreshAccessToken(connection.accessToken);
    const accessTokenExpiresAt =
      typeof refreshed.expires_in === 'number' ? new Date(Date.now() + refreshed.expires_in * 1000) : null;

    const updated = await upsertConnection({
      userId: dbUser.id,
      provider: PROVIDERS.THREADS,
      providerUserId: connection.providerUserId,
      accessToken: refreshed.access_token,
      accessTokenExpiresAt,
      refreshToken: null,
      username: connection.username,
    });

    return res.status(200).json({
      connection: {
        id: updated.id,
        provider: updated.provider,
        username: updated.username,
        accessTokenExpiresAt: updated.accessTokenExpiresAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (refreshError) {
    console.error('Threads token refresh error:', refreshError);
    return res.status(500).json({ error: 'ThreadsRefreshFailed', message: refreshError.message });
  }
});

// GET /api/threads/me - proxy to fetch current Threads profile
router.get('/threads/me', requireAuth, async (req, res) => {
  try {
    const dbUser = await userService.findUserByClerkId(req.auth.userId);
    if (!dbUser) return res.status(404).json({ error: 'UserNotFound' });
    const connection = await getConnectionByUserId(dbUser.id, PROVIDERS.THREADS);
    if (!connection) return res.status(404).json({ error: 'ThreadsConnectionNotFound' });
    const me = await threadsService.getMe(connection.accessToken);
    return res.status(200).json(me);
  } catch (e) {
    console.error('Threads /me error:', e);
    return res.status(500).json({ error: 'ThreadsMeFailed', message: e.message });
  }
});

// GET /api/threads/connection - fetch connection summary from DB
router.get('/threads/connection', requireAuth, async (req, res) => {
  try {
    const dbUser = await userService.findUserByClerkId(req.auth.userId);
    if (!dbUser) return res.status(404).json({ error: 'UserNotFound' });
    const connection = await getConnectionByUserId(dbUser.id, PROVIDERS.THREADS);
    if (!connection) return res.status(404).json({ error: 'ThreadsConnectionNotFound' });
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
    console.error('Threads connection fetch error:', e);
    return res.status(500).json({ error: 'ThreadsConnectionFetchFailed', message: e.message });
  }
});

// DELETE /api/threads/connection - disconnect (delete) the connection
router.delete('/threads/connection', requireAuth, async (req, res) => {
  try {
    const dbUser = await userService.findUserByClerkId(req.auth.userId);
    if (!dbUser) return res.status(404).json({ error: 'UserNotFound' });
    const existing = await getConnectionByUserId(dbUser.id, PROVIDERS.THREADS);
    if (!existing) return res.status(404).json({ error: 'ThreadsConnectionNotFound' });
    await require('../services/socialConnection.service').deleteConnection(dbUser.id, PROVIDERS.THREADS);
    return res.status(200).json({ status: 'ok' });
  } catch (e) {
    console.error('Threads disconnect error:', e);
    return res.status(500).json({ error: 'ThreadsDisconnectFailed', message: e.message });
  }
});

// POST /api/threads/post - create Threads post immediately
router.post('/threads/post', requireAuth, async (req, res) => {
  try {
    const { text, mediaUrl } = req.body || {};
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'MissingText' });
    const dbUser = await userService.findUserByClerkId(req.auth.userId);
    if (!dbUser) return res.status(404).json({ error: 'UserNotFound' });
    const connection = await getConnectionByUserId(dbUser.id, PROVIDERS.THREADS);
    if (!connection) return res.status(404).json({ error: 'ThreadsConnectionNotFound' });
    const result = await threadsService.createPost(connection.accessToken, text, mediaUrl);
    return res.status(201).json(result);
  } catch (e) {
    console.error('Threads create post error:', e);
    return res.status(500).json({ error: 'ThreadsPostFailed', message: e.message });
  }
});

// DELETE /api/threads/post/:id - delete a Threads post by id
router.delete('/threads/post/:id', requireAuth, async (req, res) => {
  try {
    const postId = req.params.id;
    if (!postId) return res.status(400).json({ error: 'MissingPostId' });
    const dbUser = await userService.findUserByClerkId(req.auth.userId);
    if (!dbUser) return res.status(404).json({ error: 'UserNotFound' });
    const connection = await getConnectionByUserId(dbUser.id, PROVIDERS.THREADS);
    if (!connection) return res.status(404).json({ error: 'ThreadsConnectionNotFound' });
    const result = await threadsService.deletePost(connection.accessToken, postId);
    return res.status(200).json(result);
  } catch (e) {
    console.error('Threads delete post error:', e);
    return res.status(500).json({ error: 'ThreadsDeleteFailed', message: e.message });
  }
});

// POST /api/threads/post/schedule - schedule a Threads post
router.post('/threads/post/schedule', requireAuth, async (req, res) => {
  try {
    const { text, scheduledAt, mediaUrl } = req.body || {};
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'MissingText' });
    if (!scheduledAt) return res.status(400).json({ error: 'MissingScheduledAt' });
    const dbUser = await userService.findUserByClerkId(req.auth.userId);
    if (!dbUser) return res.status(404).json({ error: 'UserNotFound' });
    const st = await scheduledService.createScheduledTweet(dbUser.id, text, scheduledAt, PROVIDERS.THREADS);
    return res.status(201).json({ scheduled: st });
  } catch (e) {
    console.error('Threads schedule post error:', e);
    return res.status(500).json({ error: 'ThreadsScheduleFailed', message: e.message });
  }
});

// GET /api/threads/post/schedule - list scheduled Threads posts for current user
router.get('/threads/post/schedule', requireAuth, async (req, res) => {
  try {
    const dbUser = await userService.findUserByClerkId(req.auth.userId);
    if (!dbUser) return res.status(404).json({ error: 'UserNotFound' });
    const items = await scheduledService.listScheduledTweetsForUser(dbUser.id, 50);
    // Filter to only Threads posts
    const threadsItems = items.filter((item) => item.provider === PROVIDERS.THREADS);
    return res.status(200).json({ scheduled: threadsItems });
  } catch (e) {
    console.error('Threads list scheduled error:', e);
    return res.status(500).json({ error: 'ThreadsListScheduledFailed', message: e.message });
  }
});

// DELETE /api/threads/post/schedule/:id - cancel scheduled Threads post
router.delete('/threads/post/schedule/:id', requireAuth, async (req, res) => {
  try {
    const dbUser = await userService.findUserByClerkId(req.auth.userId);
    if (!dbUser) return res.status(404).json({ error: 'UserNotFound' });
    const id = req.params.id;
    const result = await scheduledService.cancelScheduledTweet(dbUser.id, id);
    if (result.count === 0) return res.status(404).json({ error: 'NotFound' });
    return res.status(200).json({ status: 'ok' });
  } catch (e) {
    console.error('Threads cancel scheduled error:', e);
    return res.status(500).json({ error: 'ThreadsCancelScheduledFailed', message: e.message });
  }
});

function handleCallbackRedirect(res, { success, message, redirect, data, statusCode }) {
  const successRedirectUri = process.env.THREADS_SUCCESS_REDIRECT_URI || process.env.X_SUCCESS_REDIRECT_URI;
  const failureRedirectUri = process.env.THREADS_FAILURE_REDIRECT_URI || process.env.X_FAILURE_REDIRECT_URI;
  const baseRedirect = redirect || (success ? successRedirectUri : failureRedirectUri) || '/';

  if (baseRedirect) {
    const url = new URL(baseRedirect);
    url.searchParams.set('threads_oauth', success ? 'success' : 'error');
    if (message) url.searchParams.set('message', message);
    if (data && typeof data.connectionId === 'string') url.searchParams.set('connection_id', data.connectionId);
    return res.redirect(url.toString());
  }

  if (success) return res.status(200).json({ status: 'ok', message: message || 'Threads account connected', data });
  return res.status(statusCode || 400).json({ status: 'error', message: message || 'Threads OAuth failed' });
}

module.exports = router;

