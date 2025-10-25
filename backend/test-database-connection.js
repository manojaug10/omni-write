/**
 * Test Database Connection
 * This will verify if your DATABASE_URL is working
 */

const { PrismaClient } = require('./src/generated/prisma');

// Test with the CORRECTED URL
const correctDatabaseUrl = 'postgresql://postgres:D0%7B%60wq%3E2K4%7EmK%5E%3F%7E%3Ap%24W@db.jesvkdkkkbbxocvyaidn.supabase.co:5432/postgres';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: correctDatabaseUrl
    }
  }
});

async function testConnection() {
  console.log('🔍 TESTING DATABASE CONNECTION\n');
  console.log('='.repeat(70));
  
  console.log('\n📋 Database URL (with encoded password):');
  console.log(correctDatabaseUrl.replace(/:[^:@]+@/, ':***HIDDEN***@'));
  
  try {
    console.log('\n⏳ Attempting to connect to database...');
    
    // Try to query the database
    const users = await prisma.user.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('\n✅ SUCCESS! Database connection is working!');
    console.log(`\n📊 Found ${users.length} users in database:`);
    
    if (users.length === 0) {
      console.log('   (No users yet - this is normal if webhook hasn\'t been triggered)');
    } else {
      users.forEach((user, index) => {
        console.log(`\n   ${index + 1}. ${user.email}`);
        console.log(`      Name: ${user.name || 'N/A'}`);
        console.log(`      Clerk ID: ${user.clerkId}`);
        console.log(`      Created: ${user.createdAt.toLocaleString()}`);
      });
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ DATABASE CONNECTION TEST: PASSED');
    console.log('='.repeat(70));
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Update DATABASE_URL in Railway with the encoded version');
    console.log('2. Wait 30 seconds for Railway to redeploy');
    console.log('3. Create a test user in Clerk Dashboard');
    console.log('4. User should appear in Supabase!');
    console.log('');
    
  } catch (error) {
    console.log('\n❌ DATABASE CONNECTION FAILED!');
    console.log('='.repeat(70));
    console.log('\nError:', error.message);
    console.log('\n🔧 PROBLEM IDENTIFIED:');
    
    if (error.message.includes('Can\'t reach database server')) {
      console.log('   - Cannot reach database server');
      console.log('   - This might be a network issue or incorrect host');
    } else if (error.message.includes('authentication failed') || error.message.includes('password')) {
      console.log('   - Authentication failed');
      console.log('   - Password encoding might still be incorrect');
    } else if (error.message.includes('TLS') || error.message.includes('certificate')) {
      console.log('   - TLS/SSL connection issue');
      console.log('   - Add ?sslmode=require to the end of DATABASE_URL');
    } else {
      console.log('   - Unexpected error:', error.message);
    }
    
    console.log('\n📋 Make sure to update Railway DATABASE_URL with the encoded version!');
    console.log('');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

