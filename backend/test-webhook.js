/**
 * Test script to verify Clerk webhook endpoint is working
 * 
 * Usage:
 *   node test-webhook.js
 * 
 * This sends a test request to your deployed webhook endpoint
 */

const WEBHOOK_URL = 'https://omni-write-production.up.railway.app/api/webhooks/clerk';

async function testWebhookEndpoint() {
  console.log('🔍 Testing Clerk webhook endpoint...\n');
  console.log(`URL: ${WEBHOOK_URL}\n`);

  try {
    // Test 1: Check if endpoint exists (will fail without proper headers, but that's OK)
    console.log('Test 1: Checking if endpoint is accessible...');
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: 'payload' })
    });

    const text = await response.text();
    
    if (response.status === 400) {
      console.log('✅ Endpoint is live! (Got 400 - missing Svix headers, which is expected)');
      console.log(`   Response: ${text}\n`);
      
      console.log('✅ WEBHOOK ENDPOINT IS DEPLOYED AND WORKING!');
      console.log('\n📋 Next steps:');
      console.log('   1. Add CLERK_WEBHOOK_SECRET to Railway variables');
      console.log('   2. Configure webhook in Clerk Dashboard');
      console.log('   3. Test with real signup or Clerk test feature');
      
    } else if (response.status === 404 || text.includes('Cannot POST')) {
      console.log('❌ Endpoint NOT found (404)');
      console.log('   The webhook route is not deployed yet.');
      console.log('\n📋 Action needed:');
      console.log('   1. Make sure you pushed the code: git push origin features/auth-and-ui');
      console.log('   2. Wait 2-3 minutes for Railway to rebuild');
      console.log('   3. Run this script again');
      
    } else if (response.status === 500) {
      console.log('⚠️  Endpoint found but returning 500 error');
      console.log('   Check Railway logs for details');
      
    } else {
      console.log(`⚠️  Unexpected response: ${response.status}`);
      console.log(`   Body: ${text}`);
    }

  } catch (error) {
    console.log('❌ Failed to reach endpoint');
    console.log(`   Error: ${error.message}`);
    console.log('\n📋 Possible issues:');
    console.log('   1. Backend not deployed to Railway');
    console.log('   2. Railway URL is incorrect');
    console.log('   3. Network connectivity issue');
  }
}

// Run the test
testWebhookEndpoint();

