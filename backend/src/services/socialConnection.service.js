const prisma = require('../lib/prisma');

const PROVIDERS = {
  X: 'X',
};

/**
 * Upserts a social connection for the given user/provider combo.
 */
async function upsertConnection({
  userId,
  provider,
  providerUserId,
  accessToken,
  accessTokenExpiresAt,
  refreshToken = null,
  username = null,
}) {
  if (!userId || !provider || !providerUserId || !accessToken) {
    throw new Error('Missing required fields to upsert social connection');
  }

  return prisma.socialConnection.upsert({
    where: {
      provider_userId: {
        provider,
        userId,
      },
    },
    create: {
      provider,
      providerUserId,
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
      username,
      user: {
        connect: { id: userId },
      },
    },
    update: {
      providerUserId,
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
      username,
    },
  });
}

async function getConnectionByUserId(userId, provider) {
  if (!userId || !provider) {
    throw new Error('userId and provider are required to fetch a social connection');
  }
  return prisma.socialConnection.findUnique({
    where: {
      provider_userId: {
        provider,
        userId,
      },
    },
  });
}

async function deleteConnection(userId, provider) {
  if (!userId || !provider) {
    throw new Error('userId and provider are required to delete a social connection');
  }
  return prisma.socialConnection.delete({
    where: {
      provider_userId: {
        provider,
        userId,
      },
    },
  });
}

module.exports = {
  PROVIDERS,
  upsertConnection,
  getConnectionByUserId,
  deleteConnection,
};
