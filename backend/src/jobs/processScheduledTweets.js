const scheduledService = require('../services/scheduledTweet.service');
const scheduledThreadService = require('../services/scheduledThread.service');
const { PROVIDERS, getConnectionByUserId } = require('../services/socialConnection.service');
const xService = require('../services/x.service');
const userService = require('../services/user.service');

async function processDueTweets() {
  const due = await scheduledService.findDueTweets(new Date());
  for (const item of due) {
    try {
      const user = await userService.findUserById(item.userId);
      if (!user) throw new Error('User not found');
      const connection = await getConnectionByUserId(user.id, PROVIDERS.X);
      if (!connection) throw new Error('No X connection');
      const result = await xService.postTweet(connection.accessToken, item.text);
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
      const result = await xService.postThread(connection.accessToken, item.tweets);
      const threadId = result && result.threadId;
      const tweetIds = result && result.tweets ? result.tweets.map(t => t.data && t.data.id).filter(Boolean) : [];
      await scheduledThreadService.markAsPosted(item.id, threadId, tweetIds);
    } catch (e) {
      await scheduledThreadService.markAsFailed(item.id, e.message);
      // Continue processing the rest
    }
  }
}

module.exports = { processDueTweets, processDueThreads };


