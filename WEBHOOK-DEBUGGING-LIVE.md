# 🐛 WEBHOOK DEBUGGING - Live Issue

**Situation:** Webhook configured in Clerk, test user created, but NOT in Supabase

---

## 🔍 STEP 1: Check Clerk Webhook Delivery Logs

### Do this NOW:

1. Go to: https://dashboard.clerk.com
2. Click: **"Webhooks"** in left sidebar
3. Click: **Your webhook endpoint** (the one you just created)
4. Click: **"Message Attempts"** tab (or "Deliveries")

### What to look for:

**Scenario A: No messages/deliveries shown**
- ❌ **Problem:** Webhook wasn't triggered at all
- **Why:** User creation might not have fired the event
- **Fix:** See "Force Trigger Webhook" below

**Scenario B: Messages shown with RED X or error status**
- ❌ **Problem:** Webhook failed
- **Action:** Click on the failed message to see error details
- **Look for:** Status code (400, 500, etc.) and error message

**Scenario C: Messages shown with GREEN checkmark (200 OK)**
- ✅ **Good:** Webhook was delivered successfully
- **But:** Still need to check why user isn't in database
- **Action:** Check Railway logs next

---

## 🔍 STEP 2: Check Railway Logs (CRITICAL)

### Do this NOW:

1. Go to: https://railway.app
2. Open: Your backend service
3. Click: **"Deployments"** tab
4. Click: **Latest deployment**
5. Look at the logs (they auto-refresh)

### Search for these patterns:

**Pattern 1: "📥 Webhook received"**
```
📥 Webhook received - Headers: { svix_id: '...', ... }
```
- ✅ **Found:** Webhook reached your backend
- ❌ **Not found:** Webhook never arrived (check Clerk delivery logs)

**Pattern 2: "✅ Webhook signature verified"**
```
✅ Webhook signature verified
```
- ✅ **Found:** Signature validation passed
- ❌ **Not found but webhook received:** Check for signature error below

**Pattern 3: "📨 Webhook event: user.created"**
```
📨 Webhook event: user.created for user user_xxxxx
```
- ✅ **Found:** Event type identified correctly
- ❌ **Not found:** Different event type might have been sent

**Pattern 4: ERROR MESSAGES (Look for ❌)**

Search for any of these:
```
❌ Error verifying webhook signature
❌ Missing CLERK_WEBHOOK_SECRET
❌ No email addresses provided
❌ Error creating user
❌ Error in handleUserCreated
```

**Pattern 5: "✅ User created successfully"**
```
✅ User created successfully: user_xxxxx
```
- ✅ **Found:** User WAS created! Check Supabase again
- ❌ **Not found:** User creation failed (look for error above this)

---

## 🔍 STEP 3: Tell Me What You See

### Copy and paste the Railway logs here

Look for the most recent logs (last 5-10 minutes) and paste them.

**Specifically looking for:**
- Any lines with 📥 (webhook received)
- Any lines with ❌ (errors)
- Any lines with ✅ (success)
- Any lines mentioning "user" or "webhook"

---

## 🔧 COMMON ISSUES & FIXES

### Issue 1: Webhook Shows 400 "Invalid signature" in Clerk

**Problem:** CLERK_WEBHOOK_SECRET mismatch

**Fix:**
1. In Clerk Dashboard → Webhooks → Your endpoint
2. Look for "Signing Secret" section
3. Copy the webhook secret (starts with `whsec_`)
4. Go to Railway → Your backend → Variables
5. Find `CLERK_WEBHOOK_SECRET` variable
6. Update with the correct value from Clerk
7. Wait 30 seconds for Railway to redeploy

---

### Issue 2: Railway Logs Show "No email addresses provided"

**Problem:** Clerk's "Send Example" doesn't include real data

**Fix:**
1. Don't use "Send Example" - it has incomplete data
2. Instead, create REAL user in Clerk:
   - Clerk Dashboard → Users → Create User
   - Fill in actual email and name
   - Click Create

---

### Issue 3: No Webhook Logs in Railway at All

**Problem:** Webhook isn't reaching Railway

**Check:**
1. Clerk webhook URL is EXACTLY: 
   ```
   https://omni-write-production.up.railway.app/api/webhooks/clerk
   ```
2. Webhook is **Active** (green status in Clerk)
3. Event `user.created` is checked
4. Message was actually sent (check Clerk delivery logs)

---

### Issue 4: Railway Shows 500 Error

**Problem:** Backend error during processing

**Check Railway logs for:**
- Database connection errors
- Prisma errors
- Missing environment variables

---

## 🧪 FORCE TRIGGER WEBHOOK (Try This)

### Option 1: Create Brand New User

1. Clerk Dashboard → **Users**
2. Click **"Create User"**
3. Fill in:
   - **Email:** `forcetest@example.com`
   - **First Name:** `Force`
   - **Last Name:** `Test`
   - **Password:** Any password
4. Click **"Create"**
5. **IMMEDIATELY** check Railway logs
6. Then check Supabase

### Option 2: Update Existing User

1. Clerk Dashboard → Users
2. Click on any existing user
3. Edit their first name or last name
4. Save changes
5. This should trigger `user.updated` event
6. Check Railway logs

### Option 3: Use Webhook Testing

1. Clerk Dashboard → Webhooks → Your endpoint
2. Click **"Testing"** tab
3. Find **"user.created"** event
4. Click **"Send Example"**
5. Check response code and Railway logs

⚠️ **Note:** "Send Example" may fail with "No email addresses" - that's okay, it confirms webhook is working!

---

## 📊 QUICK CHECKLIST

Run through this with me:

### Clerk Dashboard:
- [ ] Webhook endpoint exists?
- [ ] Webhook URL is correct?
- [ ] Webhook status is "Active" (green)?
- [ ] Events `user.created`, `user.updated`, `user.deleted` are checked?
- [ ] "Message Attempts" shows delivery attempts?
- [ ] What status code do deliveries show? (200, 400, 500?)

### Railway:
- [ ] Backend is deployed and running?
- [ ] Latest deployment is from today?
- [ ] Environment variables exist (DATABASE_URL, CLERK_WEBHOOK_SECRET)?
- [ ] Logs show any webhook activity?
- [ ] Any error messages in logs?

### Supabase:
- [ ] You're looking at the correct project?
- [ ] Table name is exactly "User" (capital U)?
- [ ] Checked in last 10 minutes?

---

## 🎯 NEXT STEPS

**Please do these in order and tell me the results:**

1. **Check Clerk Webhook Delivery Logs**
   - Are there any deliveries shown?
   - What status codes?
   - Any error messages?

2. **Check Railway Logs**
   - Do you see "📥 Webhook received"?
   - Do you see any ❌ errors?
   - Copy/paste recent logs here

3. **Try Creating Another Test User**
   - Clerk Dashboard → Users → Create User
   - Email: `debug@example.com`
   - Watch Railway logs in real-time
   - What appears in logs?

4. **Check Supabase Again**
   - Go to Table Editor → User table
   - Refresh the page
   - How many users do you see?

---

**Tell me what you find and I'll help you fix it!** 🔧

