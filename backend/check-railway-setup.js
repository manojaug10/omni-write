/**
 * Railway Setup Verification Checklist
 * This script provides step-by-step instructions to verify your Railway configuration
 */

console.log('🔍 RAILWAY CONFIGURATION CHECKLIST\n');
console.log('=' .repeat(70));

console.log('\n📋 STEP 1: Check Environment Variables in Railway');
console.log('-'.repeat(70));
console.log('1. Open: https://railway.app');
console.log('2. Navigate to your "omni-write" backend project');
console.log('3. Click the "Variables" tab');
console.log('4. Verify these variables exist:\n');

const requiredVars = [
  {
    name: 'DATABASE_URL',
    description: 'PostgreSQL connection string from Supabase',
    example: 'postgresql://postgres:[YOUR-PASSWORD]@db.jesvkdkkkbbxocvyaidn.supabase.co:5432/postgres',
    checkFor: 'Should start with "postgresql://"'
  },
  {
    name: 'CLERK_WEBHOOK_SECRET',
    description: 'Webhook signing secret from Clerk Dashboard',
    example: 'whsec_4+YmmLn0u6vWUt/Ug3jtlYHm+A1ns3YI',
    checkFor: 'Should start with "whsec_"'
  },
  {
    name: 'CLERK_SECRET_KEY',
    description: 'Clerk API secret key',
    example: 'sk_test_XXXXXXXXXXXXXXXXXXXXXXX',
    checkFor: 'Should start with "sk_test_" or "sk_live_"'
  }
];

requiredVars.forEach((varConfig, index) => {
  console.log(`   ${index + 1}. ${varConfig.name}`);
  console.log(`      Purpose: ${varConfig.description}`);
  console.log(`      Check: ${varConfig.checkFor}`);
  console.log('');
});

console.log('❗ If CLERK_WEBHOOK_SECRET is missing:');
console.log('   1. Click "+ New Variable" in Railway');
console.log('   2. Name: CLERK_WEBHOOK_SECRET');
console.log('   3. Value: whsec_4+YmmLn0u6vWUt/Ug3jtlYHm+A1ns3YI');
console.log('   4. Click "Add"');
console.log('   5. Wait 30 seconds for auto-redeploy\n');

console.log('\n📋 STEP 2: Verify Latest Code is Deployed');
console.log('-'.repeat(70));
console.log('1. Check your latest commit:');
console.log('   Run: cd /Users/manoj/omni-write && git log --oneline -1');
console.log('');
console.log('2. In Railway dashboard:');
console.log('   - Click "Deployments" tab');
console.log('   - Check "Latest Deployment" timestamp');
console.log('   - Verify it matches your latest git push');
console.log('');
console.log('3. If code is outdated:');
console.log('   Run: git push origin main');
console.log('');

console.log('\n📋 STEP 3: Configure Clerk Dashboard Webhook');
console.log('-'.repeat(70));
console.log('1. Open: https://dashboard.clerk.com');
console.log('2. Select your "Omni Write" application');
console.log('3. Click "Webhooks" in the left sidebar');
console.log('4. Check if endpoint exists:\n');
console.log('   URL: https://omni-write-production.up.railway.app/api/webhooks/clerk');
console.log('   Status: Active (green checkmark)');
console.log('   Events: user.created, user.updated, user.deleted\n');

console.log('❗ If webhook endpoint doesn\'t exist:');
console.log('   1. Click "Add Endpoint" button');
console.log('   2. Paste this URL: https://omni-write-production.up.railway.app/api/webhooks/clerk');
console.log('   3. Add description: "Sync users to Supabase"');
console.log('   4. Subscribe to events:');
console.log('      ☑️ user.created');
console.log('      ☑️ user.updated');
console.log('      ☑️ user.deleted');
console.log('   5. Click "Create"');
console.log('');

console.log('\n📋 STEP 4: Test Webhook from Clerk Dashboard');
console.log('-'.repeat(70));
console.log('1. In Clerk Dashboard → Webhooks');
console.log('2. Click on your webhook endpoint');
console.log('3. Click "Testing" tab');
console.log('4. Click "Send Example" for user.created event');
console.log('5. Expected response: 200 OK or 400 (if using test data)');
console.log('');
console.log('⚠️  NOTE: Clerk\'s "Send Example" may have incomplete data.');
console.log('   Real user signup is the best test method.');
console.log('');

console.log('\n📋 STEP 5: Test with Real User Signup (RECOMMENDED)');
console.log('-'.repeat(70));
console.log('1. If you have frontend deployed:');
console.log('   - Open your app in incognito/private browser');
console.log('   - Sign up with a NEW email (e.g., test123@example.com)');
console.log('   - Complete signup process');
console.log('');
console.log('2. If frontend not deployed yet:');
console.log('   - Go to Clerk Dashboard → Users');
console.log('   - Click "Create User" button');
console.log('   - Fill in email and name');
console.log('   - Click "Create"');
console.log('');

console.log('\n📋 STEP 6: Verify User in Database');
console.log('-'.repeat(70));
console.log('Option A - Supabase Table Editor:');
console.log('   1. Go to: https://supabase.com/dashboard');
console.log('   2. Open your project');
console.log('   3. Click "Table Editor" in sidebar');
console.log('   4. Select "User" table');
console.log('   5. Look for your new user');
console.log('');
console.log('Option B - SQL Query:');
console.log('   1. In Supabase dashboard, go to "SQL Editor"');
console.log('   2. Run this query:');
console.log('      SELECT * FROM "User" ORDER BY "createdAt" DESC LIMIT 10;');
console.log('   3. Check results');
console.log('');

console.log('\n📋 STEP 7: Check Railway Logs for Webhook Activity');
console.log('-'.repeat(70));
console.log('1. Open: https://railway.app');
console.log('2. Navigate to your backend project');
console.log('3. Click "Deployments" tab');
console.log('4. Click on the latest deployment');
console.log('5. Scroll through logs and look for:\n');

const logPatterns = [
  { emoji: '📥', message: 'Webhook received - Headers:', meaning: 'Webhook was triggered by Clerk' },
  { emoji: '✅', message: 'Webhook signature verified', meaning: 'Signature validation passed' },
  { emoji: '📨', message: 'Webhook event: user.created', meaning: 'Event type identified' },
  { emoji: '🔄', message: 'Creating user', meaning: 'Starting user creation' },
  { emoji: '✅', message: 'User created successfully', meaning: 'User saved to database! 🎉' },
  { emoji: '❌', message: 'Error', meaning: 'Something went wrong - read the error message' }
];

logPatterns.forEach((pattern, index) => {
  console.log(`   ${index + 1}. ${pattern.emoji} "${pattern.message}"`);
  console.log(`      → ${pattern.meaning}`);
  console.log('');
});

console.log('\n' + '='.repeat(70));
console.log('✅ EXPECTED SUCCESS FLOW:');
console.log('='.repeat(70));
console.log('1. 📥 Webhook received');
console.log('2. ✅ Signature verified');
console.log('3. 📨 Event: user.created');
console.log('4. 🔄 Creating user...');
console.log('5. ✅ User created successfully: clmt_xxxxx');
console.log('6. 📊 User appears in Supabase "User" table');
console.log('');

console.log('=' .repeat(70));
console.log('🚀 QUICK ACTION CHECKLIST:');
console.log('=' .repeat(70));
console.log('[ ] Railway Variables tab → Verify CLERK_WEBHOOK_SECRET exists');
console.log('[ ] Railway Variables tab → Verify DATABASE_URL exists');
console.log('[ ] Railway Deployments tab → Verify latest code is deployed');
console.log('[ ] Clerk Dashboard → Webhooks → Verify endpoint exists and is Active');
console.log('[ ] Clerk Dashboard → Webhooks → Test with "Send Example"');
console.log('[ ] Railway Logs → Check for webhook activity and errors');
console.log('[ ] Supabase Table Editor → Check User table for new entries');
console.log('');

console.log('💡 MOST COMMON ISSUES:');
console.log('   1. CLERK_WEBHOOK_SECRET not set in Railway → Add it');
console.log('   2. Webhook not configured in Clerk Dashboard → Create it');
console.log('   3. Webhook URL is wrong → Must be exact Railway URL');
console.log('   4. Using "Send Example" with empty fields → Use real signup');
console.log('');

console.log('📞 Need help? Check these files:');
console.log('   - WEBHOOK-DIAGNOSIS.md (this directory)');
console.log('   - WEBHOOK-SETUP-CHECKLIST.md (this directory)');
console.log('   - CLAUDE.md (full project documentation)');
console.log('');

console.log('🎯 Success indicator: Railway logs show "✅ User created successfully"');
console.log('');

