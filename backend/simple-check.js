/**
 * SIMPLE CHECK - Run this to verify your setup
 * This will test the 3 most critical things
 */

const axios = require('axios');

console.log('\n🔍 SIMPLE WEBHOOK CHECK\n');
console.log('This will test 3 things:\n');
console.log('1. ✅ Is Railway backend running?');
console.log('2. ✅ Is webhook endpoint working?');
console.log('3. ✅ Is CLERK_WEBHOOK_SECRET configured?\n');
console.log('='.repeat(60) + '\n');

async function simpleCheck() {
  let allGood = true;

  // Test 1: Backend health
  console.log('TEST 1: Checking if Railway backend is running...');
  try {
    const response = await axios.get('https://omni-write-production.up.railway.app/api/health', {
      timeout: 5000
    });
    if (response.data.status === 'ok') {
      console.log('✅ PASS - Backend is running!\n');
    } else {
      console.log('❌ FAIL - Backend returned unexpected response\n');
      allGood = false;
    }
  } catch (error) {
    console.log('❌ FAIL - Cannot reach backend:', error.message);
    console.log('   → Check if Railway backend is deployed\n');
    allGood = false;
  }

  // Test 2: Webhook endpoint exists
  console.log('TEST 2: Checking if webhook endpoint exists...');
  try {
    const response = await axios.post(
      'https://omni-write-production.up.railway.app/api/webhooks/clerk',
      {},
      {
        timeout: 5000,
        validateStatus: () => true
      }
    );
    
    if (response.status === 400 && response.data.error === 'Missing svix headers') {
      console.log('✅ PASS - Webhook endpoint is working!\n');
    } else if (response.status === 500) {
      console.log('❌ FAIL - Webhook endpoint returned 500 error');
      console.log('   Response:', response.data);
      console.log('   → Check Railway logs for errors\n');
      allGood = false;
    } else {
      console.log('⚠️  UNEXPECTED - Got status', response.status);
      console.log('   Response:', response.data);
      console.log('   → This might be okay, check Railway logs\n');
    }
  } catch (error) {
    console.log('❌ FAIL - Cannot reach webhook endpoint:', error.message);
    console.log('   → Check if /api/webhooks/clerk route exists\n');
    allGood = false;
  }

  // Test 3: Signature verification (tests if CLERK_WEBHOOK_SECRET is set)
  console.log('TEST 3: Checking if CLERK_WEBHOOK_SECRET is configured...');
  try {
    const response = await axios.post(
      'https://omni-write-production.up.railway.app/api/webhooks/clerk',
      { type: 'user.created', data: { id: 'test' } },
      {
        headers: {
          'Content-Type': 'application/json',
          'svix-id': 'test',
          'svix-timestamp': '1234567890',
          'svix-signature': 'fake'
        },
        timeout: 5000,
        validateStatus: () => true
      }
    );

    if (response.status === 400 && response.data.error === 'Invalid signature') {
      console.log('✅ PASS - CLERK_WEBHOOK_SECRET is configured!\n');
    } else if (response.status === 500 && response.data.error === 'Webhook secret not configured') {
      console.log('❌ FAIL - CLERK_WEBHOOK_SECRET is NOT set in Railway!');
      console.log('   → Go to Railway → Variables → Add CLERK_WEBHOOK_SECRET\n');
      allGood = false;
    } else {
      console.log('⚠️  UNEXPECTED - Got status', response.status);
      console.log('   Response:', response.data, '\n');
    }
  } catch (error) {
    console.log('❌ FAIL - Error testing signature:', error.message, '\n');
    allGood = false;
  }

  // Summary
  console.log('='.repeat(60));
  if (allGood) {
    console.log('\n🎉 ALL TESTS PASSED!\n');
    console.log('Your backend is ready. Now check:\n');
    console.log('1. Clerk Dashboard → Webhooks');
    console.log('   - Is webhook endpoint configured?');
    console.log('   - URL: https://omni-write-production.up.railway.app/api/webhooks/clerk');
    console.log('   - Status: Active (green checkmark)?');
    console.log('');
    console.log('2. Railway → Variables');
    console.log('   - DATABASE_URL has % symbols? (URL-encoded password)');
    console.log('   - All 3 variables exist? (DATABASE_URL, CLERK_WEBHOOK_SECRET, CLERK_SECRET_KEY)');
    console.log('');
    console.log('3. Try creating a test user in Clerk Dashboard');
    console.log('   - Then check Railway logs immediately');
    console.log('   - Look for "📥 Webhook received" and "✅ User created"');
    console.log('');
  } else {
    console.log('\n❌ SOME TESTS FAILED\n');
    console.log('Fix the issues above, then:\n');
    console.log('1. Wait for Railway to redeploy (if you made changes)');
    console.log('2. Run this script again: node backend/simple-check.js');
    console.log('');
  }
}

simpleCheck().catch(error => {
  console.error('\n💥 Script error:', error.message);
  process.exit(1);
});

