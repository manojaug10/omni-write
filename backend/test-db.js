// Quick database connection test
const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');

    // Try to query the database
    const userCount = await prisma.user.count();
    console.log('✅ Database connected successfully!');
    console.log(`Current user count: ${userCount}`);

    // List all users
    const users = await prisma.user.findMany();
    console.log('\nUsers in database:');
    console.log(users);

  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
