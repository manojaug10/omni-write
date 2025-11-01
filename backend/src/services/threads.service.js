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

/**
 * Create a single post on Threads
 * @param {string} accessToken - User's access token
 * @param {Object} options - Post options
 * @param {string} options.text - Text content (required for TEXT, optional for IMAGE/VIDEO)
 * @param {string} [options.mediaUrl] - URL to image or video
 * @param {string} [options.mediaType='TEXT'] - Media type: TEXT, IMAGE, or VIDEO
 * @param {string} [options.topicTag] - Topic/hashtag (1-50 chars, no periods or ampersands)
 * @param {string} [options.linkAttachment] - Link URL for preview (TEXT posts only)
 * @param {Object} [options.gifAttachment] - GIF attachment (TEXT posts only)
 * @param {string} options.gifAttachment.gifId - Tenor GIF ID
 * @param {string} [options.gifAttachment.provider='TENOR'] - GIF provider (currently only TENOR)
 * @returns {Promise<Object>} Published post data
 */
async function createPost(accessToken, options) {
  // Support legacy signature: createPost(accessToken, text, mediaUrl, mediaType)
  if (typeof options === 'string') {
    const [text, mediaUrl, mediaType] = [options, arguments[2], arguments[3]];
    options = { text, mediaUrl, mediaType };
  }

  const {
    text,
    mediaUrl = null,
    mediaType = 'TEXT',
    topicTag = null,
    linkAttachment = null,
    gifAttachment = null,
  } = options;

  // First, get the Threads user ID
  const me = await getMe(accessToken);
  const userId = me.data.id;

  if (!userId) {
    throw new Error('Unable to get Threads user ID');
  }

  // Validate TEXT-only features
  if (mediaType !== 'TEXT') {
    if (linkAttachment) {
      throw new Error('Link attachments are only available for TEXT posts');
    }
    if (gifAttachment) {
      throw new Error('GIF attachments are only available for TEXT posts');
    }
  }

  // Validate topic tag
  if (topicTag) {
    if (topicTag.length < 1 || topicTag.length > 50) {
      throw new Error('Topic tag must be 1-50 characters');
    }
    if (topicTag.includes('.') || topicTag.includes('&')) {
      throw new Error('Topic tag cannot contain periods (.) or ampersands (&)');
    }
  }

  // Step 1: Create media container (Threads post)
  const createMediaUrl = `${THREADS_GRAPH_API_BASE}/v1.0/${userId}/threads`;

  const mediaParams = {
    media_type: mediaType,
    access_token: accessToken,
  };

  // Add text if provided
  if (text) {
    mediaParams.text = text;
  }

  // Add media URL based on type
  if (mediaUrl) {
    if (mediaType === 'IMAGE') {
      mediaParams.image_url = mediaUrl;
    } else if (mediaType === 'VIDEO') {
      mediaParams.video_url = mediaUrl;
    }
  }

  // Add optional features
  if (topicTag) {
    mediaParams.topic_tag = topicTag;
  }

  if (linkAttachment) {
    mediaParams.link_attachment = linkAttachment;
  }

  if (gifAttachment) {
    const gifProvider = gifAttachment.provider || 'TENOR';
    mediaParams.gif_attachment = JSON.stringify({
      gif_id: gifAttachment.gifId,
      provider: gifProvider,
    });
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

/**
 * Create a carousel post (thread) on Threads
 * @param {string} accessToken - User's access token
 * @param {Array<Object>} items - Array of carousel items
 * @param {string} items[].text - Text content for the item
 * @param {string} [items[].mediaUrl] - Optional media URL (image or video)
 * @param {string} [items[].mediaType] - Media type: 'IMAGE' or 'VIDEO' (TEXT not allowed for carousel items)
 * @param {Object} [options] - Optional carousel options
 * @param {string} [options.text] - Optional text for the entire carousel
 * @param {string} [options.topicTag] - Topic/hashtag for the carousel (1-50 chars)
 * @returns {Promise<Object>} Published carousel post data
 *
 * Note: Threads carousels can have 2-20 items. All items are published together as a single post.
 */
async function createCarousel(accessToken, items, options = {}) {
  if (!Array.isArray(items) || items.length < 2) {
    throw new Error('Carousel requires at least 2 items');
  }

  if (items.length > 20) {
    throw new Error('Carousel can have maximum 20 items');
  }

  const { text: carouselText, topicTag } = options;

  // Validate topic tag if provided
  if (topicTag) {
    if (topicTag.length < 1 || topicTag.length > 50) {
      throw new Error('Topic tag must be 1-50 characters');
    }
    if (topicTag.includes('.') || topicTag.includes('&')) {
      throw new Error('Topic tag cannot contain periods (.) or ampersands (&)');
    }
  }

  // First, get the Threads user ID
  const me = await getMe(accessToken);
  const userId = me.data.id;

  if (!userId) {
    throw new Error('Unable to get Threads user ID');
  }

  const childMediaIds = [];

  // Step 1: Create media containers for each carousel item
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const mediaType = item.mediaType || 'IMAGE';

    // Carousel items must have media (IMAGE or VIDEO)
    if (mediaType === 'TEXT') {
      throw new Error(`Carousel item ${i + 1}: TEXT media type not allowed. Use IMAGE or VIDEO.`);
    }

    if (!item.mediaUrl) {
      throw new Error(`Carousel item ${i + 1}: mediaUrl is required for ${mediaType} posts`);
    }

    const createMediaUrl = `${THREADS_GRAPH_API_BASE}/v1.0/${userId}/threads`;

    const mediaParams = {
      media_type: mediaType,
      access_token: accessToken,
      is_carousel_item: true, // Mark as carousel item
    };

    // Add text if provided (optional for carousel items)
    if (item.text) {
      mediaParams.text = item.text;
    }

    // Add media URL based on type
    if (mediaType === 'IMAGE') {
      mediaParams.image_url = item.mediaUrl;
    } else if (mediaType === 'VIDEO') {
      mediaParams.video_url = item.mediaUrl;
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
      throw new Error(`Rate limited by Threads API at item ${i + 1} (retry after: ${retryAfter})`);
    }

    if (mediaResponse.status !== 200) {
      const errInfo = (mediaResponse.data && mediaResponse.data.error?.message) || mediaResponse.statusText;
      throw new Error(`Threads carousel item ${i + 1} creation failed: ${mediaResponse.status} - ${errInfo}`);
    }

    const creationId = mediaResponse.data.id;
    if (!creationId) {
      throw new Error(`Failed to get creation ID for carousel item ${i + 1}`);
    }

    childMediaIds.push(creationId);
  }

  // Step 2: Create carousel container with all child media IDs
  const carouselUrl = `${THREADS_GRAPH_API_BASE}/v1.0/${userId}/threads`;
  const carouselParams = {
    media_type: 'CAROUSEL',
    children: childMediaIds.join(','), // Comma-separated list of creation IDs
    access_token: accessToken,
  };

  // Add optional text for the carousel
  if (carouselText) {
    carouselParams.text = carouselText;
  }

  // Add optional topic tag
  if (topicTag) {
    carouselParams.topic_tag = topicTag;
  }

  const carouselResponse = await axios.post(carouselUrl, null, {
    params: carouselParams,
    headers: {
      'Content-Type': 'application/json',
    },
    validateStatus: () => true,
  });

  if (carouselResponse.status === 429) {
    const retryAfter = carouselResponse.headers['retry-after'] || carouselResponse.headers['x-ratelimit-reset'];
    throw new Error(`Rate limited by Threads API (retry after: ${retryAfter})`);
  }

  if (carouselResponse.status !== 200) {
    const errInfo = (carouselResponse.data && carouselResponse.data.error?.message) || carouselResponse.statusText;
    throw new Error(`Threads carousel container creation failed: ${carouselResponse.status} - ${errInfo}`);
  }

  const carouselCreationId = carouselResponse.data.id;
  if (!carouselCreationId) {
    throw new Error('Failed to get carousel creation ID');
  }

  // Step 3: Publish the carousel
  const publishUrl = `${THREADS_GRAPH_API_BASE}/v1.0/${userId}/threads_publish`;
  const publishParams = {
    creation_id: carouselCreationId,
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
    throw new Error(`Threads carousel publish failed: ${publishResponse.status} - ${errInfo}`);
  }

  return {
    success: true,
    data: {
      id: publishResponse.data.id,
      carousel_creation_id: carouselCreationId,
      child_media_ids: childMediaIds,
      item_count: items.length,
    },
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
  createCarousel,
  deletePost,
  authHeaders,
};

