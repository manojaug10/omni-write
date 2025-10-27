const prisma = require('../lib/prisma');

async function createScheduledTweet(userId, text, scheduledAt) {
  if (!userId || !text || !scheduledAt) {
    throw new Error('userId, text and scheduledAt are required');
  }
  return prisma.scheduledTweet.create({
    data: {
      userId,
      text,
      scheduledAt: new Date(scheduledAt),
    },
  });
}

async function listScheduledTweetsForUser(userId, limit = 20) {
  if (!userId) throw new Error('userId is required');
  return prisma.scheduledTweet.findMany({
    where: { userId },
    orderBy: { scheduledAt: 'asc' },
    take: limit,
  });
}

async function cancelScheduledTweet(userId, id) {
  if (!userId || !id) throw new Error('userId and id are required');
  return prisma.scheduledTweet.updateMany({
    where: { id, userId, status: 'QUEUED' },
    data: { status: 'CANCELLED' },
  });
}

async function findDueTweets(now = new Date()) {
  return prisma.scheduledTweet.findMany({
    where: {
      status: 'QUEUED',
      scheduledAt: { lte: now },
    },
    orderBy: { scheduledAt: 'asc' },
    take: 50,
  });
}

async function markAsPosted(id, tweetId) {
  return prisma.scheduledTweet.update({
    where: { id },
    data: { status: 'POSTED', postedTweetId: tweetId || null },
  });
}

async function markAsFailed(id, errorMessage) {
  return prisma.scheduledTweet.update({
    where: { id },
    data: { status: 'FAILED', errorMessage },
  });
}

module.exports = {
  createScheduledTweet,
  listScheduledTweetsForUser,
  cancelScheduledTweet,
  findDueTweets,
  markAsPosted,
  markAsFailed,
};


