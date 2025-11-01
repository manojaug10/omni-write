const scheduledService = require('../services/scheduledTweet.service');
const scheduledThreadService = require('../services/scheduledThread.service');
const { PROVIDERS, getConnectionByUserId, upsertConnection } = require('../services/socialConnection.service');
const xService = require('../services/x.service');
const threadsService = require('../services/threads.service');
const userService = require('../services/user.service');

/**
 * Helper function to get a valid access token, refreshing if expired
 */
async function getValidAccessToken(connection, provider) {
  const now = new Date();

  // Check if token is expired or will expire in next 5 minutes
  if (connection.accessTokenExpiresAt && connection.accessTokenExpiresAt <= new Date(now.getTime() + 5 * 60 * 1000)) {
    console.log(`Access token expired or expiring soon for ${provider}, refreshing...`);

    if (!connection.refreshToken) {
      throw new Error('Access token expired and no refresh token available. Please reconnect your account.');
    }

    try {
      // Refresh the token based on provider
      let tokenResponse;
      if (provider === PROVIDERS.X) {
        tokenResponse = await xService.refreshAccessToken(connection.refreshToken);
      } else if (provider === PROVIDERS.THREADS) {
        tokenResponse = await threadsService.refreshLongLivedToken(connection.accessToken);
      } else {
        throw new Error(`Unknown provider: ${provider}`);
      }

      const newAccessToken = tokenResponse.access_token;
      const newRefreshToken = tokenResponse.refresh_token || connection.refreshToken;
      const expiresIn = tokenResponse.expires_in;
      const newExpiresAt = expiresIn ? new Date(now.getTime() + expiresIn * 1000) : null;

      // Update the connection with new token
      await upsertConnection({
        userId: connection.userId,
        provider: connection.provider,
        providerUserId: connection.providerUserId,
        accessToken: newAccessToken,
        accessTokenExpiresAt: newExpiresAt,
        refreshToken: newRefreshToken,
        username: connection.username,
        metadata: connection.metadata,
      });

      console.log(`Successfully refreshed ${provider} access token`);
      return newAccessToken;
    } catch (refreshError) {
      console.error(`Failed to refresh ${provider} token:`, refreshError);
      throw new Error(`Failed to refresh access token: ${refreshError.message}`);
    }
  }

  return connection.accessToken;
}

async function processDueTweets() {
  const due = await scheduledService.findDueTweets(new Date());
  for (const item of due) {
    try {
      // Only process X tweets in this function (Threads handled separately)
      if (item.provider !== PROVIDERS.X && item.provider !== 'X') {
        continue;
      }
      const user = await userService.findUserById(item.userId);
      if (!user) throw new Error('User not found');
      const connection = await getConnectionByUserId(user.id, PROVIDERS.X);
      if (!connection) throw new Error('No X connection');

      // Get valid access token (refresh if needed)
      const accessToken = await getValidAccessToken(connection, PROVIDERS.X);

      const result = await xService.postTweet(accessToken, item.text);
      const postedId = result && result.data && result.data.id;
      await scheduledService.markAsPosted(item.id, postedId);
    } catch (e) {
      await scheduledService.markAsFailed(item.id, e.message);
      // Continue processing the rest
    }
  }
}

async function processDueThreadsPosts() {
  const due = await scheduledService.findDueTweets(new Date());
  for (const item of due) {
    try {
      // Only process Threads posts
      if (item.provider !== PROVIDERS.THREADS && item.provider !== 'THREADS') {
        continue;
      }
      const user = await userService.findUserById(item.userId);
      if (!user) throw new Error('User not found');
      const connection = await getConnectionByUserId(user.id, PROVIDERS.THREADS);
      if (!connection) throw new Error('No Threads connection');

      // Get valid access token (refresh if needed)
      const accessToken = await getValidAccessToken(connection, PROVIDERS.THREADS);

      const result = await threadsService.createPost(accessToken, item.text);
      const postedId = result && result.data && result.data.id;
      await scheduledService.markAsPosted(item.id, postedId);
    } catch (e) {
      await scheduledService.markAsFailed(item.id, e.message);
      // Continue processing the rest
    }
  }
}

async function processDueThreads() {
  const due = await scheduledThreadService.findDueThreads(new Date());
  for (const item of due) {
    try {
      const user = await userService.findUserById(item.userId);
      if (!user) throw new Error('User not found');
      const connection = await getConnectionByUserId(user.id, PROVIDERS.X);
      if (!connection) throw new Error('No X connection');

      // Get valid access token (refresh if needed)
      const accessToken = await getValidAccessToken(connection, PROVIDERS.X);

      const result = await xService.postThread(accessToken, item.tweets);
      const threadId = result && result.threadId;
      const tweetIds = result && result.tweets ? result.tweets.map(t => t.data && t.data.id).filter(Boolean) : [];
      await scheduledThreadService.markAsPosted(item.id, threadId, tweetIds);
    } catch (e) {
      await scheduledThreadService.markAsFailed(item.id, e.message);
      // Continue processing the rest
    }
  }
}

module.exports = { processDueTweets, processDueThreads, processDueThreadsPosts };


