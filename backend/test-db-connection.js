/**
 * Test Database Connection
 * Run this to verify if the DATABASE_URL is correct
 */

const { PrismaClient } = require('./src/generated/prisma');

async function testConnection() {
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

  console.log('🔍 Testing database connection...\n');
  console.log('DATABASE_URL:', process.env.DATABASE_URL || 'NOT SET');
  console.log('');

  try {
    // Try to connect and query
    console.log('Attempting to connect to database...');
    await prisma.$connect();
    console.log('✅ Connected to database successfully!\n');

    // Try a simple query
    console.log('Testing query: counting users...');
    const userCount = await prisma.user.count();
    console.log(`✅ Query successful! Found ${userCount} users in database.\n`);

    // Disconnect
    await prisma.$disconnect();
    console.log('✅ Test complete - database connection is working!');

  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('Error:', error.message);
    console.error('\nFull error:', error);

    if (error.message.includes('Can\'t reach database server')) {
      console.error('\n⚠️  POSSIBLE ISSUES:');
      console.error('1. Database server is down or paused');
      console.error('2. Wrong host/port in DATABASE_URL');
      console.error('3. Firewall blocking the connection');
      console.error('4. Need to use connection pooling URL (port 6543 instead of 5432)');
    }

    if (error.message.includes('password authentication failed')) {
      console.error('\n⚠️  PASSWORD ISSUE:');
      console.error('1. Wrong password in DATABASE_URL');
      console.error('2. Special characters not properly URL-encoded');
    }

    process.exit(1);
  }
}

testConnection();
