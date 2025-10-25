/**
 * Comprehensive Webhook Diagnostic Tool
 * Tests all components of the Clerk → Prisma → Supabase sync workflow
 */

const axios = require('axios');

const RAILWAY_URL = 'https://omni-write-production.up.railway.app';
const WEBHOOK_ENDPOINT = `${RAILWAY_URL}/api/webhooks/clerk`;

console.log('🔍 OMNI WRITE WEBHOOK DIAGNOSTICS\n');
console.log('=' .repeat(60));

async function runDiagnostics() {
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0
  };

  // Test 1: Backend Health Check
  console.log('\n📋 Test 1: Backend Health Check');
  console.log('-'.repeat(60));
  try {
    const response = await axios.get(`${RAILWAY_URL}/api/health`, { timeout: 5000 });
    if (response.status === 200 && response.data.status === 'ok') {
      console.log('✅ PASS: Backend is running on Railway');
      console.log(`   Response: ${JSON.stringify(response.data)}`);
      results.passed++;
    } else {
      console.log('❌ FAIL: Unexpected response from backend');
      console.log(`   Response: ${JSON.stringify(response.data)}`);
      results.failed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Cannot reach backend');
    console.log(`   Error: ${error.message}`);
    results.failed++;
  }

  // Test 2: Webhook Endpoint Exists
  console.log('\n📋 Test 2: Webhook Endpoint Accessibility');
  console.log('-'.repeat(60));
  try {
    const response = await axios.post(
      WEBHOOK_ENDPOINT,
      { test: 'ping' },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
        validateStatus: () => true // Accept any status
      }
    );
    
    if (response.status === 400 && response.data.error === 'Missing svix headers') {
      console.log('✅ PASS: Webhook endpoint is deployed and responding');
      console.log('   Expected 400 error (missing svix headers is correct)');
      results.passed++;
    } else if (response.status === 500 && response.data.error === 'Webhook secret not configured') {
      console.log('❌ FAIL: CLERK_WEBHOOK_SECRET is not set in Railway');
      console.log('   Action needed: Add CLERK_WEBHOOK_SECRET to Railway environment variables');
      results.failed++;
    } else {
      console.log('⚠️  WARNING: Unexpected response from webhook endpoint');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data)}`);
      results.warnings++;
    }
  } catch (error) {
    console.log('❌ FAIL: Cannot reach webhook endpoint');
    console.log(`   Error: ${error.message}`);
    results.failed++;
  }

  // Test 3: Test with Clerk-like Webhook Structure
  console.log('\n📋 Test 3: Webhook with Mock Clerk Data');
  console.log('-'.repeat(60));
  try {
    const mockClerkEvent = {
      type: 'user.created',
      data: {
        id: 'test_user_' + Date.now(),
        email_addresses: [{
          id: 'email_test_123',
          email_address: `test${Date.now()}@example.com`
        }],
        primary_email_address_id: 'email_test_123',
        first_name: 'Test',
        last_name: 'User'
      }
    };

    const response = await axios.post(
      WEBHOOK_ENDPOINT,
      mockClerkEvent,
      {
        headers: {
          'Content-Type': 'application/json',
          // Mock Svix headers (will fail signature verification, but that's expected)
          'svix-id': 'msg_test',
          'svix-timestamp': Math.floor(Date.now() / 1000).toString(),
          'svix-signature': 'v1,fake_signature_for_testing'
        },
        timeout: 5000,
        validateStatus: () => true
      }
    );

    if (response.status === 400 && response.data.error === 'Invalid signature') {
      console.log('✅ PASS: Webhook signature verification is working');
      console.log('   Expected 400 error (invalid signature is correct for unsigned test)');
      results.passed++;
    } else if (response.status === 500 && response.data.error === 'Webhook secret not configured') {
      console.log('❌ FAIL: CLERK_WEBHOOK_SECRET is not set in Railway');
      console.log('   Action needed: Add CLERK_WEBHOOK_SECRET to Railway environment variables');
      results.failed++;
    } else {
      console.log('⚠️  WARNING: Unexpected response');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data)}`);
      results.warnings++;
    }
  } catch (error) {
    console.log('❌ FAIL: Error during mock webhook test');
    console.log(`   Error: ${error.message}`);
    results.failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed:  ${results.passed}`);
  console.log(`❌ Failed:  ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);

  // Final Recommendations
  console.log('\n💡 NEXT STEPS:');
  console.log('-'.repeat(60));

  if (results.failed === 0) {
    console.log('1. ✅ All basic checks passed!');
    console.log('2. 📋 Check Clerk Dashboard → Webhooks');
    console.log('3. 🔗 Ensure webhook is configured with:');
    console.log(`   URL: ${WEBHOOK_ENDPOINT}`);
    console.log('   Events: user.created, user.updated, user.deleted');
    console.log('4. 🧪 Test with real signup or Clerk "Send Example"');
    console.log('5. 📊 Check Railway logs for webhook activity');
  } else {
    console.log('❌ Some tests failed. Fix these issues first:');
    console.log('\n1. Check Railway environment variables:');
    console.log('   - CLERK_WEBHOOK_SECRET (from Clerk Dashboard)');
    console.log('   - DATABASE_URL (from Supabase)');
    console.log('   - CLERK_SECRET_KEY (from Clerk Dashboard)');
    console.log('\n2. Verify latest code is deployed to Railway');
    console.log('   Run: git push origin main');
    console.log('\n3. Check Railway deployment logs for errors');
  }

  console.log('\n📚 Documentation:');
  console.log('   - WEBHOOK-SETUP-CHECKLIST.md');
  console.log('   - Railway Dashboard: https://railway.app');
  console.log('   - Clerk Dashboard: https://dashboard.clerk.com');
  console.log('');
}

runDiagnostics().catch(error => {
  console.error('\n💥 Diagnostic script failed:', error.message);
  process.exit(1);
});

