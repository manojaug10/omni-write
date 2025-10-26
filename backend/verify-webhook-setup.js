/**
 * Webhook Setup Verification Script
 *
 * This script checks if your webhook is properly configured
 *
 * Usage: node verify-webhook-setup.js
 */

const WEBHOOK_URL = 'https://omni-write-production.up.railway.app/api/webhooks/clerk';

console.log('🔍 Webhook Setup Verification\n');
console.log('=' .repeat(60));

async function checkWebhookEndpoint() {
  console.log('\n1️⃣ Checking if webhook endpoint is accessible...\n');

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'payload' })
    });

    const body = await response.text();

    if (response.status === 400 && body.includes('Missing svix headers')) {
      console.log('   ✅ Webhook endpoint is LIVE and working!');
      console.log(`   📍 URL: ${WEBHOOK_URL}`);
      console.log('   ℹ️  Response: "Missing svix headers" (expected)\n');
      return true;
    } else if (response.status === 404) {
      console.log('   ❌ Webhook endpoint NOT FOUND (404)');
      console.log('   ⚠️  The webhook route is not deployed\n');
      return false;
    } else {
      console.log(`   ⚠️  Unexpected response: ${response.status}`);
      console.log(`   Body: ${body}\n`);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Failed to reach webhook endpoint');
    console.log(`   Error: ${error.message}\n`);
    return false;
  }
}

function printNextSteps(webhookOk) {
  console.log('=' .repeat(60));
  console.log('\n📋 NEXT STEPS:\n');

  if (webhookOk) {
    console.log('✅ Your webhook endpoint is ready!\n');
    console.log('Now you need to:');
    console.log('');
    console.log('1️⃣  Configure webhook in Clerk Dashboard:');
    console.log('   • Go to https://dashboard.clerk.com');
    console.log('   • Navigate to "Webhooks"');
    console.log('   • Click "Add Endpoint"');
    console.log('   • URL: ' + WEBHOOK_URL);
    console.log('   • Subscribe to: user.created, user.updated, user.deleted');
    console.log('   • Save and copy the webhook secret (whsec_...)');
    console.log('');
    console.log('2️⃣  Add webhook secret to Railway:');
    console.log('   • Go to Railway Dashboard');
    console.log('   • Navigate to your project variables');
    console.log('   • Add: CLERK_WEBHOOK_SECRET=whsec_...');
    console.log('   • Railway will auto-redeploy');
    console.log('');
    console.log('3️⃣  Test with a real signup:');
    console.log('   • Go to https://omni-write.vercel.app');
    console.log('   • Sign out if signed in');
    console.log('   • Create a new test account');
    console.log('   • Check Supabase User table for new user');
    console.log('   • Check Profile page for database sync');
    console.log('');
    console.log('📖 Full guide: See WEBHOOK_FIX_GUIDE.md');
  } else {
    console.log('❌ Webhook endpoint is not accessible.\n');
    console.log('Action items:');
    console.log('');
    console.log('1️⃣  Verify code is pushed to main branch:');
    console.log('   git status');
    console.log('   git push origin main');
    console.log('');
    console.log('2️⃣  Check Railway deployment:');
    console.log('   • Go to Railway Dashboard');
    console.log('   • Check latest deployment status');
    console.log('   • Review build logs for errors');
    console.log('');
    console.log('3️⃣  Verify server.js includes webhook routes:');
    console.log('   • Check backend/src/server.js line 14');
    console.log('   • Should have: app.use(\'/api/webhooks\', ...)');
    console.log('');
  }

  console.log('=' .repeat(60));
}

async function main() {
  const webhookOk = await checkWebhookEndpoint();
  printNextSteps(webhookOk);
}

main();
