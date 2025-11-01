const axios = require('axios');

// Threads API endpoints (NOT Instagram)
const THREADS_AUTH_BASE = process.env.THREADS_AUTH_BASE || 'https://threads.net/oauth/authorize';
const THREADS_TOKEN_URL = process.env.THREADS_TOKEN_URL || 'https://graph.threads.net/oauth/access_token';
const THREADS_GRAPH_API_BASE = process.env.THREADS_GRAPH_API_BASE || 'https://graph.threads.net';

function getConfig() {
  const {
    THREADS_APP_ID: appId,
    THREADS_APP_SECRET: appSecret,
    THREADS_REDIRECT_URI: redirectUri,
    THREADS_DEFAULT_SCOPES: scope = 'threads_basic,threads_content_publish',
  } = process.env;

  if (!appId || !appSecret || !redirectUri) {
    throw new Error('Threads API env missing (THREADS_APP_ID, THREADS_APP_SECRET, THREADS_REDIRECT_URI)');
  }

  return { appId, appSecret, redirectUri, scope };
}

function buildAuthorizationUrl({ state, scope }) {
  const { appId, redirectUri, scope: defaultScope } = getConfig();
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: scope || defaultScope,
    response_type: 'code',
    state: state || '',
  });
  return `${THREADS_AUTH_BASE}?${params.toString()}`;
}

async function exchangeCodeForTokens({ code }) {
  const { appId, appSecret, redirectUri } = getConfig();

  // Step 1: Exchange code for short-lived token (1 hour)
  const body = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code,
  });

  const response = await axios.post(THREADS_TOKEN_URL, body.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    validateStatus: () => true,
  });

  if (response.status !== 200) {
    const errInfo = (response.data && (response.data.error_description || response.data.error_message)) || response.statusText;
    throw new Error(`Threads token exchange failed: ${errInfo}`);
  }

  const shortLivedToken = response.data.access_token;
  const userId = response.data.user_id;

  // Step 2: Immediately exchange short-lived token for long-lived token (60 days)
  try {
    const longLivedToken = await exchangeForLongLivedToken(shortLivedToken);
    return {
      access_token: longLivedToken.access_token,
      expires_in: longLivedToken.expires_in || 5184000, // 60 days in seconds
      user_id: userId,
    };
  } catch (error) {
    console.warn('Failed to exchange for long-lived token, using short-lived token:', error.message);
    // Fallback to short-lived token if exchange fails
    return {
      access_token: shortLivedToken,
      expires_in: 3600, // 1 hour
      user_id: userId,
    };
  }
}

async function exchangeForLongLivedToken(shortLivedToken) {
  const { appSecret } = getConfig();

  const url = `${THREADS_GRAPH_API_BASE}/access_token`;
  const params = new URLSearchParams({
    grant_type: 'th_exchange_token',
    client_secret: appSecret,
    access_token: shortLivedToken,
  });

  const response = await axios.get(`${url}?${params.toString()}`, {
    validateStatus: () => true,
  });

  if (response.status !== 200) {
    const errInfo = (response.data && (response.data.error?.message || response.data.error_message)) || response.statusText;
    throw new Error(`Threads long-lived token exchange failed: ${errInfo}`);
  }

  return {
    access_token: response.data.access_token,
    expires_in: response.data.expires_in || 5184000, // 60 days
    token_type: 'bearer',
  };
}

async function refreshAccessToken(accessToken) {
  // Threads uses long-lived tokens (60 days)
  // To refresh before expiry, use th_refresh_token grant type
  const url = `${THREADS_GRAPH_API_BASE}/access_token`;
  const params = new URLSearchParams({
    grant_type: 'th_refresh_token',
    access_token: accessToken,
  });

  const response = await axios.get(`${url}?${params.toString()}`, {
    validateStatus: () => true,
  });

  if (response.status !== 200) {
    const errInfo = (response.data && (response.data.error?.message || response.data.error_message)) || response.statusText;
    throw new Error(`Threads token refresh failed: ${errInfo}`);
  }

  return {
    access_token: response.data.access_token,
    expires_in: response.data.expires_in || 5184000, // 60 days in seconds
    token_type: 'bearer',
  };
}

function authHeaders(accessToken) {
  return { Authorization: `Bearer ${accessToken}` };
}

async function getMe(accessToken) {
  const url = `${THREADS_GRAPH_API_BASE}/v1.0/me`;
  const params = new URLSearchParams({
    fields: 'id,username,threads_profile_picture_url,threads_biography',
    access_token: accessToken,
  });

  const response = await axios.get(`${url}?${params.toString()}`, {
    validateStatus: () => true,
  });

  if (response.status === 429) {
    const retryAfter = response.headers['retry-after'] || response.headers['x-ratelimit-reset'];
    throw new Error(`Rate limited by Threads API (retry after: ${retryAfter})`);
  }

  if (response.status !== 200) {
    const errInfo = (response.data && response.data.error?.message) || response.statusText;
    throw new Error(`Threads /me failed: ${response.status} - ${errInfo}`);
  }

  return {
    data: {
      id: response.data.id,
      username: response.data.username,
      profile_picture_url: response.data.threads_profile_picture_url,
      biography: response.data.threads_biography,
    },
  };
}

async function createPost(accessToken, text, mediaUrl = null, mediaType = 'TEXT') {
  // First, get the Threads user ID
  const me = await getMe(accessToken);
  const userId = me.data.id;

  if (!userId) {
    throw new Error('Unable to get Threads user ID');
  }

  // Step 1: Create media container (Threads post)
  const createMediaUrl = `${THREADS_GRAPH_API_BASE}/v1.0/${userId}/threads`;
  
  const mediaParams = {
    media_type: mediaType,
    text: text,
    access_token: accessToken,
  };

  // If media URL is provided, add it based on type
  if (mediaUrl) {
    if (mediaType === 'IMAGE') {
      mediaParams.image_url = mediaUrl;
    } else if (mediaType === 'VIDEO') {
      mediaParams.video_url = mediaUrl;
    }
  }

  const mediaResponse = await axios.post(createMediaUrl, null, {
    params: mediaParams,
    headers: {
      'Content-Type': 'application/json',
    },
    validateStatus: () => true,
  });

  if (mediaResponse.status === 429) {
    const retryAfter = mediaResponse.headers['retry-after'] || mediaResponse.headers['x-ratelimit-reset'];
    throw new Error(`Rate limited by Threads API (retry after: ${retryAfter}). Post limit: 250/24h`);
  }

  if (mediaResponse.status !== 200) {
    const errInfo = (mediaResponse.data && mediaResponse.data.error?.message) || mediaResponse.statusText;
    throw new Error(`Threads media creation failed: ${mediaResponse.status} - ${errInfo}`);
  }

  const creationId = mediaResponse.data.id;
  if (!creationId) {
    throw new Error('Failed to get media creation ID');
  }

  // Step 2: Publish the media container
  const publishUrl = `${THREADS_GRAPH_API_BASE}/v1.0/${userId}/threads_publish`;
  const publishParams = {
    creation_id: creationId,
    access_token: accessToken,
  };

  const publishResponse = await axios.post(publishUrl, null, {
    params: publishParams,
    headers: {
      'Content-Type': 'application/json',
    },
    validateStatus: () => true,
  });

  if (publishResponse.status === 429) {
    const retryAfter = publishResponse.headers['retry-after'] || publishResponse.headers['x-ratelimit-reset'];
    throw new Error(`Rate limited by Threads API (retry after: ${retryAfter}). Post limit: 250/24h`);
  }

  if (publishResponse.status !== 200) {
    const errInfo = (publishResponse.data && publishResponse.data.error?.message) || publishResponse.statusText;
    throw new Error(`Threads post publish failed: ${publishResponse.status} - ${errInfo}`);
  }

  return {
    data: {
      id: publishResponse.data.id,
      creation_id: creationId,
    },
  };
}

async function deletePost(accessToken, postId) {
  const url = `${THREADS_GRAPH_API_BASE}/v1.0/${encodeURIComponent(postId)}`;
  const params = new URLSearchParams({
    access_token: accessToken,
  });

  const response = await axios.delete(`${url}?${params.toString()}`, {
    validateStatus: () => true,
  });

  if (response.status === 429) {
    const retryAfter = response.headers['retry-after'] || response.headers['x-ratelimit-reset'];
    throw new Error(`Rate limited by Threads API (retry after: ${retryAfter}). Delete limit: 100/24h`);
  }

  if (response.status !== 200) {
    const errInfo = (response.data && response.data.error?.message) || response.statusText;
    throw new Error(`Threads DELETE /${postId} failed: ${response.status} - ${errInfo}`);
  }

  return {
    success: response.data.success || true,
  };
}

module.exports = {
  getConfig,
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  exchangeForLongLivedToken,
  refreshAccessToken,
  getMe,
  createPost,
  deletePost,
  authHeaders,
};

