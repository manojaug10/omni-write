# Clerk Webhook Setup Checklist

## 🎯 Goal
Sync users from Clerk to your Supabase database automatically when they sign up.

---

## ✅ Step 1: Push Code to Railway (DO THIS FIRST!)

**In your terminal, run:**
```bash
git push origin features/auth-and-ui
```

**What happens:**
- Railway detects the push
- Automatically rebuilds backend
- Deploys webhook endpoint in ~2-3 minutes

**Verify deployment:**
```bash
curl https://omni-write-production.up.railway.app/api/health
```
Should return: `{"status":"ok"}`

---

## ✅ Step 2: Add CLERK_WEBHOOK_SECRET to Railway

1. **Go to:** https://railway.app
2. **Open:** Your "omni-write" backend project
3. **Click:** "Variables" tab
4. **Click:** "+ New Variable" button
5. **Add:**
   ```
   Name:  CLERK_WEBHOOK_SECRET
   Value: whsec_4+YmmLn0u6vWUt/Ug3jtlYHm+A1ns3YI
   ```
6. **Click:** "Add"
7. **Wait:** ~30 seconds for auto-redeploy

---

## ✅ Step 3: Configure Webhook in Clerk Dashboard

1. **Go to:** https://dashboard.clerk.com
2. **Select:** Your "Omni Write" application
3. **Click:** "Webhooks" in left sidebar
4. **Click:** "Add Endpoint" button

**Configuration:**
```
Endpoint URL:
https://omni-write-production.up.railway.app/api/webhooks/clerk

Description (optional):
Sync users to database

Subscribe to events:
☑️ user.created
☑️ user.updated
☑️ user.deleted
```

5. **Click:** "Create"

---

## ✅ Step 4: Test the Webhook

### Option A: Test with Clerk Dashboard
1. In Clerk Dashboard → Webhooks
2. Click on your new webhook endpoint
3. Click "Testing" tab
4. Click "Send Example" for `user.created`
5. **Expected:** ✅ 200 OK response

### Option B: Test with Real Signup
1. Sign out of your app
2. Sign up with a NEW test email (e.g., `test@example.com`)
3. Go to Prisma Studio:
   ```bash
   cd backend
   npx prisma studio
   ```
4. Check "User" table - new user should appear! 🎉

---

## 🔍 Verify Everything Works

### Check 1: Backend Health
```bash
curl https://omni-write-production.up.railway.app/api/health
```
**Expected:** `{"status":"ok"}`

### Check 2: Webhook Endpoint is Live
In Clerk Dashboard → Webhooks → Your endpoint should show:
- Status: ✅ Active
- Last delivery: Recent timestamp

### Check 3: Users in Database
```bash
cd backend
npx prisma studio
```
Open http://localhost:5555 and check the "User" table.

---

## 🐛 Troubleshooting

### Problem: Webhook returns 500 error
**Check:**
- Is `CLERK_WEBHOOK_SECRET` set in Railway?
- Check Railway logs for detailed error messages (now includes stack traces)
- Look for database connection errors

**How to check Railway logs:**
1. Go to https://railway.app
2. Open your backend project
3. Click "Deployments" tab
4. Click the latest deployment
5. Look for ❌ emoji in logs

### Problem: Webhook returns 400 "Invalid signature"
**Check:**
- Webhook secret in Railway matches the one in Clerk Dashboard
- Railway has redeployed after adding the secret (wait ~30 seconds)
- Clerk webhook is sending the correct headers (svix-id, svix-timestamp, svix-signature)

### Problem: User not appearing in database
**Check:**
1. Webhook delivery in Clerk Dashboard (should show 200 OK)
2. Railway logs - look for "✅ User created successfully" message
3. Database connection: Verify DATABASE_URL in Railway
4. Prisma Client generation: Should happen automatically on Railway deploy

### Problem: Webhook test in Clerk fails
**Detailed logs now show:**
- 📥 Webhook received
- ✅ Signature verified
- 📨 Event type (user.created, etc.)
- 🔄 Processing status
- ✅ Success or ❌ Error with details

**To debug:**
1. Check Railway logs immediately after testing
2. Look for the specific error message
3. Common issues:
   - Missing primary email → Check email_addresses in Clerk user
   - Duplicate email → User already exists in database
   - Database error → Check DATABASE_URL and Prisma setup

### Test Locally Before Deploying
Run the test script to verify your local setup:
```bash
cd backend

# Start the dev server in one terminal
npm run dev

# In another terminal, run the test
node test-webhook-local.js
```

This will check:
- ✅ Server is responding
- ✅ Webhook endpoint rejects unsigned requests
- ✅ Database connection works
- ✅ User table exists

---

## 📊 The Flow After Setup

```
1. User signs up in React app
   ↓
2. Clerk authenticates user ✅
   ↓
3. Clerk sends webhook to Railway ✅
   ↓
4. Railway validates signature (Svix) ✅
   ↓
5. Backend creates user in Supabase ✅
   ↓
6. User appears in Prisma Studio 🎉
```

---

## 📝 What We Built

### Backend Files Created:
- `backend/src/routes/webhook.routes.js` - Webhook handler
- `backend/src/services/user.service.js` - Database operations
- Updated `backend/src/server.js` - Registered routes

### Features:
- ✅ Secure webhook verification (Svix)
- ✅ Handles user.created, user.updated, user.deleted
- ✅ Proper error handling and logging
- ✅ Service layer separation (clean architecture)

---

## 🚀 After This Works

You'll be ready for:
- [ ] Protected routes with Clerk middleware
- [ ] User profile page
- [ ] Document CRUD with user ownership
- [ ] User-specific data queries

---

**Created:** October 25, 2025
**Status:** Ready to deploy! 🚀

