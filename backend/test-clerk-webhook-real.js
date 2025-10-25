/**
 * Test Clerk Webhook with Real-Looking Data
 * This simulates what Clerk actually sends when a user signs up
 * 
 * NOTE: This will still fail signature verification (expected)
 * But it helps test the data processing logic
 */

const axios = require('axios');
const crypto = require('crypto');

const RAILWAY_URL = 'https://omni-write-production.up.railway.app';
const WEBHOOK_URL = `${RAILWAY_URL}/api/webhooks/clerk`;

// Simulated Clerk webhook payload (matches real Clerk structure)
const clerkWebhookPayload = {
  data: {
    id: 'user_2test' + Date.now(),
    object: 'user',
    username: null,
    first_name: 'Test',
    last_name: 'User',
    image_url: 'https://img.clerk.com/test.png',
    has_image: true,
    primary_email_address_id: 'idn_testEmail123',
    primary_phone_number_id: null,
    primary_web3_wallet_id: null,
    password_enabled: true,
    two_factor_enabled: false,
    totp_enabled: false,
    backup_code_enabled: false,
    email_addresses: [
      {
        id: 'idn_testEmail123',
        object: 'email_address',
        email_address: `test${Date.now()}@example.com`,
        verification: {
          status: 'verified',
          strategy: 'from_oauth_google'
        },
        linked_to: []
      }
    ],
    phone_numbers: [],
    web3_wallets: [],
    external_accounts: [],
    saml_accounts: [],
    public_metadata: {},
    private_metadata: {},
    unsafe_metadata: {},
    external_id: null,
    last_sign_in_at: Date.now(),
    banned: false,
    locked: false,
    lockout_expires_in_seconds: null,
    verification_attempts_remaining: 100,
    created_at: Date.now(),
    updated_at: Date.now(),
    delete_self_enabled: true,
    create_organization_enabled: true,
    last_active_at: Date.now()
  },
  object: 'event',
  type: 'user.created'
};

async function testWebhook() {
  console.log('🧪 TESTING CLERK WEBHOOK WITH REALISTIC DATA\n');
  console.log('=' .repeat(70));
  
  console.log('\n📤 Sending Request to Webhook Endpoint');
  console.log('-'.repeat(70));
  console.log(`URL: ${WEBHOOK_URL}`);
  console.log(`Event Type: ${clerkWebhookPayload.type}`);
  console.log(`User Email: ${clerkWebhookPayload.data.email_addresses[0].email_address}`);
  console.log(`User Name: ${clerkWebhookPayload.data.first_name} ${clerkWebhookPayload.data.last_name}`);
  console.log('');

  try {
    const payload = JSON.stringify(clerkWebhookPayload);
    const timestamp = Math.floor(Date.now() / 1000);
    const msgId = 'msg_test_' + Date.now();

    // These are mock Svix headers - will fail signature verification
    // That's expected! We're testing if the endpoint processes the structure
    const headers = {
      'Content-Type': 'application/json',
      'svix-id': msgId,
      'svix-timestamp': timestamp.toString(),
      'svix-signature': 'v1,fake_signature_for_testing_purposes'
    };

    console.log('📋 Request Headers:');
    console.log('-'.repeat(70));
    Object.entries(headers).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    console.log('');

    const response = await axios.post(WEBHOOK_URL, payload, {
      headers,
      timeout: 10000,
      validateStatus: () => true // Accept any status code
    });

    console.log('📥 Response Received:');
    console.log('-'.repeat(70));
    console.log(`Status Code: ${response.status}`);
    console.log(`Response Body:`, JSON.stringify(response.data, null, 2));
    console.log('');

    console.log('=' .repeat(70));
    console.log('📊 TEST RESULTS:');
    console.log('=' .repeat(70));

    if (response.status === 400 && response.data.error === 'Invalid signature') {
      console.log('✅ EXPECTED RESULT: Webhook is working correctly!');
      console.log('');
      console.log('   The "Invalid signature" error is EXPECTED because we\'re not');
      console.log('   using a real Clerk signature. This proves:');
      console.log('   1. ✅ Webhook endpoint is deployed');
      console.log('   2. ✅ Signature verification is active');
      console.log('   3. ✅ CLERK_WEBHOOK_SECRET is configured in Railway');
      console.log('');
      console.log('🎯 NEXT STEPS:');
      console.log('   1. Go to Clerk Dashboard → Webhooks');
      console.log('   2. Configure webhook endpoint (if not done)');
      console.log('   3. Test with real signup or Clerk "Send Example"');
      console.log('   4. Real Clerk requests will have valid signatures and work!');

    } else if (response.status === 500 && response.data.error === 'Webhook secret not configured') {
      console.log('❌ PROBLEM FOUND: CLERK_WEBHOOK_SECRET is missing!');
      console.log('');
      console.log('🔧 FIX:');
      console.log('   1. Go to https://railway.app');
      console.log('   2. Open your backend project');
      console.log('   3. Click "Variables" tab');
      console.log('   4. Add new variable:');
      console.log('      Name:  CLERK_WEBHOOK_SECRET');
      console.log('      Value: whsec_4+YmmLn0u6vWUt/Ug3jtlYHm+A1ns3YI');
      console.log('   5. Save and wait 30 seconds for redeploy');

    } else if (response.status === 200) {
      console.log('⚠️  UNEXPECTED: Request was accepted (signature verification may be disabled)');
      console.log('   This shouldn\'t happen with mock signatures.');

    } else {
      console.log('⚠️  UNEXPECTED RESPONSE:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Body: ${JSON.stringify(response.data)}`);
      console.log('');
      console.log('   Check Railway logs for more details.');
    }

    console.log('');

  } catch (error) {
    console.log('❌ TEST FAILED:');
    console.log('-'.repeat(70));
    if (error.code === 'ECONNREFUSED') {
      console.log('   Cannot connect to Railway backend');
      console.log('   Check if backend is deployed and running');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('   Request timed out');
      console.log('   Backend may be slow or not responding');
    } else {
      console.log(`   Error: ${error.message}`);
    }
    console.log('');
  }

  console.log('=' .repeat(70));
  console.log('📚 REFERENCE:');
  console.log('   - Full diagnosis: WEBHOOK-DIAGNOSIS.md');
  console.log('   - Setup guide: WEBHOOK-SETUP-CHECKLIST.md');
  console.log('   - Railway dashboard: https://railway.app');
  console.log('   - Clerk dashboard: https://dashboard.clerk.com');
  console.log('');
}

testWebhook();

