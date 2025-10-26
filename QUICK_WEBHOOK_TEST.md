# Quick Webhook Test - Do It Yourself

## Test 1: Verify Endpoint is Accessible (30 seconds)

Open your terminal and run this command:

```bash
curl -X POST https://omni-write-production.up.railway.app/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Expected Result:
```json
{"error":"Missing svix headers"}
```

### What This Means:
- ✅ **If you see "Missing svix headers"** → Endpoint is WORKING! This is the correct response.
- ❌ **If you see "Cannot POST" or 404** → Endpoint not deployed (but our tests show it is)
- ❌ **If connection fails** → Railway might be down

---

## Test 2: Use the Verification Script (15 seconds)

We created a script that does the testing for you:

```bash
cd /Users/manoj/omni-write
node backend/verify-webhook-setup.js
```

### Expected Output:
```
🔍 Webhook Setup Verification
============================================================

1️⃣ Checking if webhook endpoint is accessible...

   ✅ Webhook endpoint is LIVE and working!
   📍 URL: https://omni-write-production.up.railway.app/api/webhooks/clerk
   ℹ️  Response: "Missing svix headers" (expected)

============================================================

📋 NEXT STEPS:
...
```

### What This Means:
- ✅ **If you see "✅ Webhook endpoint is LIVE"** → Everything is deployed correctly!
- ❌ **If you see "❌ Endpoint NOT found"** → Need to redeploy (unlikely based on our tests)

---

## Test 3: Check Railway Logs (1 minute)

This will show you if the webhook endpoint is being registered:

1. **Go to Railway Dashboard:**
   - Visit https://railway.app
   - Log in and find your `omni-write-production` project

2. **View Logs:**
   - Click on your service
   - Click "Deployments" tab
   - Click on the latest deployment
   - View the logs

3. **Look for these lines:**
   ```
   Server is running on 0.0.0.0:3000
   Environment: production
   Clerk authentication enabled
   ```

### What to Check:
- ✅ **Server started successfully** → Good!
- ✅ **No errors about missing files** → Good!
- ❌ **Errors about webhook.routes.js** → Need to investigate

---

## Test 4: Test Webhook with Clerk Dashboard (2 minutes)

**IMPORTANT:** This requires you to configure the webhook in Clerk first. If you haven't done that, this test will fail.

### Step 1: Configure Webhook in Clerk Dashboard

1. Go to https://dashboard.clerk.com
2. Click "Webhooks" in the left sidebar
3. Click "Add Endpoint"
4. Enter:
   - **Endpoint URL:** `https://omni-write-production.up.railway.app/api/webhooks/clerk`
   - **Description:** User sync to database
5. Subscribe to these events:
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`
6. Click "Create"
7. **Copy the signing secret** (starts with `whsec_`)

### Step 2: Add Secret to Railway

1. Go to Railway Dashboard
2. Select your project
3. Click "Variables" tab
4. Add new variable:
   - **Name:** `CLERK_WEBHOOK_SECRET`
   - **Value:** `whsec_...` (paste the secret from Clerk)
5. Railway will automatically redeploy (wait 1-2 minutes)

### Step 3: Send Test Event from Clerk

1. Go back to Clerk Dashboard → Webhooks
2. Click on your webhook endpoint
3. Click "Testing" tab
4. Click "Send Example" for `user.created`
5. Check the response

### Expected Response:
```
Status: 200 OK
```

**Note:** The test event might fail with an error about "No email addresses" - this is normal! Clerk's test events have incomplete data. The real test is in Step 4.

---

## Test 5: Real User Signup Test (2 minutes)

**This is the BEST test** - Create a real user and see if it syncs to the database.

### Prerequisites:
- ✅ Webhook configured in Clerk Dashboard (Test 4, Step 1)
- ✅ Webhook secret added to Railway (Test 4, Step 2)
- ✅ Railway redeployed (wait 1-2 minutes after adding secret)

### Steps:

1. **Sign out of your app:**
   - Go to https://omni-write.vercel.app
   - Sign out if you're signed in

2. **Create a new test account:**
   - Click "Sign Up"
   - Use a unique email (e.g., `webhooktest123@gmail.com`)
   - Complete the signup

3. **Check Railway Logs immediately:**
   - Go to Railway Dashboard → Logs
   - Look for these lines:
   ```
   📥 Webhook received - Headers: { svix_id, svix_timestamp }
   ✅ Webhook signature verified
   📨 Webhook event: user.created for user user_xxxxx
   🔄 Creating user user_xxxxx...
   ✅ User created successfully: user_xxxxx
   ```

4. **Check Supabase Database:**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Click "Table Editor"
   - Click "User" table
   - You should see the new user with:
     - clerkId: `user_xxxxx`
     - email: `webhooktest123@gmail.com`
     - createdAt timestamp

5. **Check Profile Page:**
   - Go to https://omni-write.vercel.app/profile
   - Scroll to "Database Profile" section
   - You should see:
     - ✅ Database ID
     - ✅ Clerk ID
     - ✅ Created/Updated timestamps
     - **NOT** an error message

---

## Quick Decision Tree

### If Test 1 or Test 2 shows "✅ Endpoint is LIVE":
→ **Webhook code is deployed correctly!**
→ Proceed to Test 4 to configure Clerk Dashboard
→ Then do Test 5 to verify end-to-end

### If Test 1 or Test 2 shows "❌ Endpoint NOT found":
→ **Need to investigate deployment** (unlikely based on our verification)
→ Check Railway logs (Test 3)
→ Verify code is pushed to main branch
→ Check if Railway is auto-deploying from the correct branch

### If Test 5 fails (no database sync):
→ Check Railway logs for webhook events
→ Verify webhook secret is correct in Railway
→ Verify webhook is configured in Clerk Dashboard
→ Try deleting and recreating the webhook in Clerk

---

## Summary

**Start with Test 2** (the easiest):
```bash
node backend/verify-webhook-setup.js
```

If that shows ✅, then you know the webhook endpoint is working, and you just need to:
1. Configure it in Clerk Dashboard (Test 4)
2. Test with a real signup (Test 5)

**Total time:** About 5 minutes to get everything working!

---

## Need Help?

If any test fails, share:
1. Which test failed
2. What error message you saw
3. Screenshot of Railway logs (if applicable)

I'll help you debug it!
