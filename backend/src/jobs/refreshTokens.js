const prisma = require('../lib/prisma');
const threadsService = require('../services/threads.service');
const { PROVIDERS, upsertConnection } = require('../services/socialConnection.service');

/**
 * Refresh Threads tokens that are expiring soon (within 7 days)
 * Should run daily to ensure tokens don't expire
 */
async function refreshExpiringThreadsTokens() {
  try {
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();

    // Find all Threads connections expiring in < 7 days
    const expiringConnections = await prisma.socialConnection.findMany({
      where: {
        provider: PROVIDERS.THREADS,
        accessTokenExpiresAt: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
    });

    console.log(`Found ${expiringConnections.length} Threads tokens expiring within 7 days`);

    let successCount = 0;
    let failureCount = 0;

    for (const conn of expiringConnections) {
      try {
        console.log(`Refreshing Threads token for user ${conn.userId} (expires: ${conn.accessTokenExpiresAt})`);

        const refreshed = await threadsService.refreshAccessToken(conn.accessToken);

        await upsertConnection({
          userId: conn.userId,
          provider: PROVIDERS.THREADS,
          providerUserId: conn.providerUserId,
          accessToken: refreshed.access_token,
          accessTokenExpiresAt: new Date(Date.now() + (refreshed.expires_in * 1000)),
          refreshToken: null, // Threads uses long-lived tokens, no refresh token
          username: conn.username,
        });

        successCount++;
        console.log(`✓ Successfully refreshed token for user ${conn.userId}`);
      } catch (error) {
        failureCount++;
        console.error(`✗ Failed to refresh token for user ${conn.userId}:`, error.message);
        // Continue with other tokens even if one fails
      }
    }

    console.log(`Token refresh completed: ${successCount} success, ${failureCount} failures`);
  } catch (error) {
    console.error('Error in refreshExpiringThreadsTokens:', error);
  }
}

/**
 * Clean up expired tokens (already expired, not refreshable)
 * Marks them as disconnected in logs but keeps the record for audit
 */
async function cleanupExpiredTokens() {
  try {
    const now = new Date();

    // Find all expired Threads connections
    const expiredConnections = await prisma.socialConnection.findMany({
      where: {
        provider: PROVIDERS.THREADS,
        accessTokenExpiresAt: {
          lt: now,
        },
      },
    });

    if (expiredConnections.length > 0) {
      console.log(`Found ${expiredConnections.length} expired Threads tokens`);
      for (const conn of expiredConnections) {
        console.log(`⚠️  User ${conn.userId} has an expired Threads token (expired: ${conn.accessTokenExpiresAt})`);
        // Note: We keep the record but log it. User will need to reconnect manually.
      }
    }
  } catch (error) {
    console.error('Error in cleanupExpiredTokens:', error);
  }
}

module.exports = {
  refreshExpiringThreadsTokens,
  cleanupExpiredTokens,
};
