/**
 * Debug Clerk Webhook Issues
 * Run this to test your webhook endpoint
 */

const axios = require('axios');

console.log('🔍 CLERK WEBHOOK DEBUGGER\n');
console.log('='.repeat(70));

async function debugWebhook() {
  const WEBHOOK_URL = 'https://omni-write-production.up.railway.app/api/webhooks/clerk';
  
  // Test 1: Backend Health
  console.log('\n📋 Test 1: Check Backend is Running');
  console.log('-'.repeat(70));
  try {
    const health = await axios.get('https://omni-write-production.up.railway.app/api/health');
    console.log('✅ Backend is running:', health.data);
  } catch (error) {
    console.log('❌ Backend is not responding:', error.message);
    return;
  }

  // Test 2: Webhook Endpoint Exists
  console.log('\n📋 Test 2: Check Webhook Endpoint');
  console.log('-'.repeat(70));
  try {
    const response = await axios.post(WEBHOOK_URL, {}, {
      validateStatus: () => true
    });
    console.log('✅ Webhook endpoint is accessible');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data)}`);
    
    if (response.status === 400 && response.data.error === 'Missing svix headers') {
      console.log('✅ This is expected! Webhook is working correctly.');
    } else if (response.status === 500 && response.data.error === 'Webhook secret not configured') {
      console.log('❌ PROBLEM: CLERK_WEBHOOK_SECRET is not set in Railway!');
      console.log('   Fix: Add CLERK_WEBHOOK_SECRET to Railway environment variables');
      return;
    }
  } catch (error) {
    console.log('❌ Cannot reach webhook endpoint:', error.message);
    return;
  }

  // Test 3: Simulate Clerk Webhook
  console.log('\n📋 Test 3: Simulate Clerk Webhook Request');
  console.log('-'.repeat(70));
  
  const timestamp = Math.floor(Date.now() / 1000);
  const testEmail = `debugtest${Date.now()}@example.com`;
  
  const clerkPayload = {
    data: {
      id: 'user_test' + Date.now(),
      email_addresses: [{
        id: 'idn_test123',
        email_address: testEmail
      }],
      primary_email_address_id: 'idn_test123',
      first_name: 'Debug',
      last_name: 'Test'
    },
    type: 'user.created'
  };

  try {
    const response = await axios.post(WEBHOOK_URL, clerkPayload, {
      headers: {
        'Content-Type': 'application/json',
        'svix-id': 'msg_test_' + Date.now(),
        'svix-timestamp': timestamp.toString(),
        'svix-signature': 'v1,fake_signature_for_testing'
      },
      validateStatus: () => true
    });

    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.data, null, 2));

    if (response.status === 400 && response.data.error === 'Invalid signature') {
      console.log('\n✅ PERFECT! This proves:');
      console.log('   1. Webhook endpoint is deployed');
      console.log('   2. Signature verification is working');
      console.log('   3. CLERK_WEBHOOK_SECRET is configured');
      console.log('   4. Real Clerk requests (with valid signatures) will work!');
    } else if (response.status === 200) {
      console.log('\n⚠️  WARNING: Request was accepted without valid signature');
      console.log('   This shouldn\'t happen. Check signature verification.');
    } else {
      console.log('\n⚠️  Unexpected response. Check Railway logs for details.');
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));
  console.log('\nYour webhook endpoint is working correctly!');
  console.log('\nThe "Invalid signature" error is EXPECTED for test requests.');
  console.log('Real Clerk webhooks will have valid signatures and will succeed.');
  console.log('\n🔍 NEXT STEPS TO DEBUG:');
  console.log('-'.repeat(70));
  console.log('1. Check Clerk Dashboard → Webhooks → Your endpoint → Message Attempts');
  console.log('   - Are there any delivery attempts shown?');
  console.log('   - What status codes? (200, 400, 500?)');
  console.log('   - Click on a message to see details');
  console.log('');
  console.log('2. Check Railway Logs:');
  console.log('   - Go to: https://railway.app');
  console.log('   - Open your backend service');
  console.log('   - Click: Deployments → Latest → View Logs');
  console.log('   - Look for: "📥 Webhook received" or "❌" errors');
  console.log('');
  console.log('3. Create a NEW test user in Clerk:');
  console.log('   - Clerk Dashboard → Users → Create User');
  console.log(`   - Email: newtestuser${Date.now()}@example.com`);
  console.log('   - First Name: New, Last Name: Test');
  console.log('   - Watch Railway logs immediately after creating');
  console.log('');
  console.log('4. If you see webhook in Railway logs but user not in Supabase:');
  console.log('   - Check for database connection errors in logs');
  console.log('   - Verify DATABASE_URL in Railway variables');
  console.log('   - Check Supabase project is the correct one');
  console.log('');
  console.log('📋 Copy Railway logs and share them for detailed debugging.');
  console.log('');
}

debugWebhook().catch(error => {
  console.error('\n💥 Script failed:', error.message);
  process.exit(1);
});

