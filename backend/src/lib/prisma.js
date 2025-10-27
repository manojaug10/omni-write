const { PrismaClient } = require('../generated/prisma');

/**
 * Prisma Client Singleton
 * Prevents multiple instances in serverless environments
 * and handles connection pooling properly
 */

let prisma;

if (process.env.NODE_ENV === 'production') {
  // Production: Create new instance with optimized settings
  prisma = new PrismaClient({
    log: ['error', 'warn'],
    // Disable prepared statements for connection pooling compatibility
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
} else {
  // Development: Use global to prevent multiple instances during hot reload
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
