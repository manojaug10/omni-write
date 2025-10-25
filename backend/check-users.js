/**
 * Quick script to check how many users are in the database
 */
const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('\n📊 Users in Database:\n');
    console.log(`Total users: ${users.length}\n`);
    
    if (users.length === 0) {
      console.log('❌ No users found in database yet.');
      console.log('\n📋 This means:');
      console.log('   1. Webhook hasn\'t been triggered yet');
      console.log('   2. OR webhook isn\'t working properly');
      console.log('\n💡 Next step: Test the webhook!');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Name: ${user.name || 'N/A'}`);
        console.log(`   Clerk ID: ${user.clerkId}`);
        console.log(`   Created: ${user.createdAt.toLocaleString()}`);
        console.log('');
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkUsers();
