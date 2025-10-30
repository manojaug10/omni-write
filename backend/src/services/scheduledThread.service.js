const prisma = require('../lib/prisma');

async function createScheduledThread(userId, tweets, scheduledAt) {
  if (!userId || !tweets || !scheduledAt) {
    throw new Error('userId, tweets and scheduledAt are required');
  }
  if (!Array.isArray(tweets) || tweets.length === 0) {
    throw new Error('tweets must be a non-empty array');
  }
  return prisma.scheduledThread.create({
    data: {
      userId,
      tweets,
      scheduledAt: new Date(scheduledAt),
    },
  });
}

async function listScheduledThreadsForUser(userId, limit = 20) {
  if (!userId) throw new Error('userId is required');
  return prisma.scheduledThread.findMany({
    where: { userId },
    orderBy: { scheduledAt: 'asc' },
    take: limit,
  });
}

async function cancelScheduledThread(userId, id) {
  if (!userId || !id) throw new Error('userId and id are required');
  return prisma.scheduledThread.updateMany({
    where: { id, userId, status: 'QUEUED' },
    data: { status: 'CANCELLED' },
  });
}

async function findDueThreads(now = new Date()) {
  return prisma.scheduledThread.findMany({
    where: {
      status: 'QUEUED',
      scheduledAt: { lte: now },
    },
    orderBy: { scheduledAt: 'asc' },
    take: 50,
  });
}

async function markAsPosted(id, threadId, tweetIds) {
  return prisma.scheduledThread.update({
    where: { id },
    data: {
      status: 'POSTED',
      postedThreadId: threadId || null,
      postedTweetIds: tweetIds || [],
    },
  });
}

async function markAsFailed(id, errorMessage) {
  return prisma.scheduledThread.update({
    where: { id },
    data: { status: 'FAILED', errorMessage },
  });
}

module.exports = {
  createScheduledThread,
  listScheduledThreadsForUser,
  cancelScheduledThread,
  findDueThreads,
  markAsPosted,
  markAsFailed,
};
