const axios = require('axios');
const { generateCodeVerifier, generateCodeChallenge } = require('../utils/pkce');

const X_AUTH_BASE = process.env.X_AUTH_BASE || 'https://twitter.com/i/oauth2/authorize';
const X_TOKEN_URL = process.env.X_TOKEN_URL || 'https://api.twitter.com/2/oauth2/token';
const X_API_BASE = process.env.X_API_BASE || 'https://api.twitter.com/2';

function getConfig() {
  const {
    X_CLIENT_ID: clientId,
    X_CLIENT_SECRET: clientSecret,
    X_REDIRECT_URI: redirectUri,
    X_DEFAULT_SCOPES: scope = 'tweet.read tweet.write users.read offline.access',
  } = process.env;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('X API env missing (X_CLIENT_ID, X_CLIENT_SECRET, X_REDIRECT_URI)');
  }

  return { clientId, clientSecret, redirectUri, scope };
}

function buildAuthorizationUrl({ state, codeChallenge, scope }) {
  const { clientId, redirectUri, scope: defaultScope } = getConfig();
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scope || defaultScope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  return `${X_AUTH_BASE}?${params.toString()}`;
}

async function exchangeCodeForTokens({ code, codeVerifier }) {
  const { clientId, clientSecret, redirectUri } = getConfig();

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,
  });

  const response = await axios.post(X_TOKEN_URL, body.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
    },
    validateStatus: () => true,
  });

  if (response.status !== 200) {
    const errInfo = (response.data && response.data.error_description) || response.statusText;
    throw new Error(`X token exchange failed: ${errInfo}`);
  }

  return response.data; // { token_type, access_token, expires_in, refresh_token, scope }
}

async function refreshAccessToken(refreshToken) {
  const { clientId, clientSecret } = getConfig();
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
  });
  const response = await axios.post(X_TOKEN_URL, body.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
    },
    validateStatus: () => true,
  });
  if (response.status !== 200) {
    const errInfo = (response.data && response.data.error_description) || response.statusText;
    throw new Error(`X token refresh failed: ${errInfo}`);
  }
  return response.data;
}

function authHeaders(accessToken) {
  return { Authorization: `Bearer ${accessToken}` };
}

async function getMe(accessToken) {
  // Request user fields including subscription_type to determine account tier
  const url = `${X_API_BASE}/users/me?user.fields=id,name,username,subscription_type`;
  const response = await axios.get(url, {
    headers: authHeaders(accessToken),
    validateStatus: () => true,
  });
  if (response.status === 429) {
    const limit = response.headers['x-rate-limit-limit'];
    const reset = response.headers['x-rate-limit-reset'];
    throw new Error(`Rate limited by X API (limit=${limit}, reset=${reset})`);
  }
  if (response.status !== 200) {
    throw new Error(`X /users/me failed: ${response.status}`);
  }
  return response.data;
}

async function postTweet(accessToken, text) {
  const url = `${X_API_BASE}/tweets`;
  const response = await axios.post(url, { text }, {
    headers: { ...authHeaders(accessToken), 'Content-Type': 'application/json' },
    validateStatus: () => true,
  });
  if (response.status === 429) {
    const limit = response.headers['x-rate-limit-limit'];
    const reset = response.headers['x-rate-limit-reset'];
    throw new Error(`Rate limited by X API (limit=${limit}, reset=${reset})`);
  }
  if (response.status !== 201) {
    // Extract detailed error information from X API response
    const errorDetail = response.data?.detail || response.data?.title || response.data?.error || JSON.stringify(response.data);
    console.error('X API postTweet error:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      text: text
    });
    throw new Error(`X /tweets failed (${response.status}): ${errorDetail}`);
  }
  return response.data;
}

async function deleteTweet(accessToken, tweetId) {
  const url = `${X_API_BASE}/tweets/${encodeURIComponent(tweetId)}`;
  const response = await axios.delete(url, {
    headers: { ...authHeaders(accessToken) },
    validateStatus: () => true,
  });
  if (response.status === 429) {
    const limit = response.headers['x-rate-limit-limit'];
    const reset = response.headers['x-rate-limit-reset'];
    throw new Error(`Rate limited by X API (limit=${limit}, reset=${reset})`);
  }
  if (response.status !== 200) {
    throw new Error(`X DELETE /tweets/:id failed: ${response.status}`);
  }
  return response.data;
}

async function postThread(accessToken, tweets) {
  if (!Array.isArray(tweets) || tweets.length === 0) {
    throw new Error('Tweets array is required and must not be empty');
  }

  const postedTweets = [];
  let previousTweetId = null;

  for (let i = 0; i < tweets.length; i++) {
    const text = tweets[i];

    // Build request body
    const body = { text };

    // For tweets after the first one, add reply information
    if (previousTweetId) {
      body.reply = {
        in_reply_to_tweet_id: previousTweetId
      };
    }

    const url = `${X_API_BASE}/tweets`;
    const response = await axios.post(url, body, {
      headers: { ...authHeaders(accessToken), 'Content-Type': 'application/json' },
      validateStatus: () => true,
    });

    if (response.status === 429) {
      const limit = response.headers['x-rate-limit-limit'];
      const reset = response.headers['x-rate-limit-reset'];
      throw new Error(`Rate limited by X API at tweet ${i + 1} (limit=${limit}, reset=${reset})`);
    }

    if (response.status !== 201) {
      // Extract detailed error information from X API response
      const errorDetail = response.data?.detail || response.data?.title || response.data?.error || JSON.stringify(response.data);
      console.error(`X API postThread error at tweet ${i + 1}:`, {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        text: text
      });
      throw new Error(`X /tweets failed at tweet ${i + 1} (${response.status}): ${errorDetail}`);
    }

    const tweetData = response.data;
    postedTweets.push(tweetData);

    // Set the previous tweet ID for the next iteration
    if (tweetData && tweetData.data && tweetData.data.id) {
      previousTweetId = tweetData.data.id;
    } else {
      throw new Error(`Failed to get tweet ID from response at tweet ${i + 1}`);
    }
  }

  return {
    success: true,
    tweets: postedTweets,
    threadId: postedTweets[0]?.data?.id, // First tweet ID represents the thread
    count: postedTweets.length
  };
}

module.exports = {
  getConfig,
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  getMe,
  postTweet,
  postThread,
  deleteTweet,
  generateCodeVerifier,
  generateCodeChallenge,
};


