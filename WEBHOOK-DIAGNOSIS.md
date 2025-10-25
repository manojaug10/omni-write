# 🔍 Clerk Webhook Diagnosis Report

**Generated:** October 25, 2025  
**Issue:** Users signing up in Clerk are not being saved to Supabase database

---

## ✅ COMPONENT STATUS CHECK

### 1. Prisma Schema ✅
**File:** `backend/prisma/schema.prisma`

```prisma
model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Status:** ✅ **CORRECT** - All required fields are present

---

### 2. Webhook Route Handler ✅
**File:** `backend/src/routes/webhook.routes.js`

**Features:**
- ✅ Svix webhook signature verification
- ✅ Handles `user.created` event
- ✅ Handles `user.updated` event
- ✅ Handles `user.deleted` event
- ✅ Comprehensive error logging
- ✅ Raw body parsing configured

**Status:** ✅ **IMPLEMENTED** - Complete webhook handler exists

---

### 3. User Service Layer ✅
**File:** `backend/src/services/user.service.js`

**Functions:**
- ✅ `createUser()` - Creates user in database
- ✅ `updateUser()` - Updates existing user
- ✅ `deleteUser()` - Removes user
- ✅ `findUserByClerkId()` - Query by Clerk ID
- ✅ `findUserByEmail()` - Query by email

**Status:** ✅ **IMPLEMENTED** - Full CRUD operations available

---

### 4. Server Configuration ✅
**File:** `backend/src/server.js`

**Configuration:**
- ✅ Webhook routes registered at `/api/webhooks`
- ✅ Raw body parsing middleware for webhooks
- ✅ Proper route ordering (webhooks before JSON middleware)

**Status:** ✅ **CONFIGURED** - Server setup is correct

---

### 5. Railway Deployment ✅
**URL:** `https://omni-write-production.up.railway.app`

**Tests:**
```bash
# Health check
curl https://omni-write-production.up.railway.app/api/health
# Response: {"status":"ok"} ✅

# Webhook endpoint
curl -X POST https://omni-write-production.up.railway.app/api/webhooks/clerk
# Response: {"error":"Missing svix headers"} ✅ (Expected)
```

**Status:** ✅ **DEPLOYED** - Backend is live and responding

---

## ❓ POTENTIAL ISSUES

### 1. Railway Environment Variables ⚠️

**Required Variables:**
- `DATABASE_URL` - PostgreSQL connection string (Supabase)
- `CLERK_WEBHOOK_SECRET` - Webhook signing secret (from Clerk)
- `CLERK_SECRET_KEY` - Clerk API key

**How to Check:**
1. Go to https://railway.app
2. Open "omni-write" backend project
3. Click "Variables" tab
4. Verify all three variables are set

**Webhook Secret from Checklist:**
```
CLERK_WEBHOOK_SECRET=whsec_4+YmmLn0u6vWUt/Ug3jtlYHm+A1ns3YI
```

### 2. Clerk Dashboard Webhook Configuration ⚠️

**Required Setup:**
1. Go to https://dashboard.clerk.com
2. Navigate to Webhooks section
3. Check if endpoint exists with:
   - **URL:** `https://omni-write-production.up.railway.app/api/webhooks/clerk`
   - **Status:** Active (not disabled)
   - **Events:** `user.created`, `user.updated`, `user.deleted`

**If webhook doesn't exist:**
- Click "Add Endpoint"
- Paste URL above
- Select events
- Click "Create"

### 3. Database Connection ⚠️

**Local Test Failed:**
```
Error: bad certificate format
```

**Cause:** TLS certificate issue with local connection to Supabase

**Impact:** This affects local development only, NOT production

**Solutions:**
- Option A: Use Railway for testing (production environment)
- Option B: Fix DATABASE_URL in local `.env` file
- Option C: Check Supabase connection pooler settings

---

## 🧪 DIAGNOSTIC TESTS

### Run Automated Diagnostics
```bash
cd backend
node diagnose-webhook.js
```

This will test:
1. ✅ Backend health endpoint
2. ✅ Webhook endpoint accessibility
3. ✅ Signature verification setup
4. ✅ Environment variable configuration

### Check Users in Database

**Option 1: Using Railway (Production)**
1. Access Railway dashboard
2. Open database plugin
3. Run query:
   ```sql
   SELECT * FROM "User" ORDER BY "createdAt" DESC;
   ```

**Option 2: Using Prisma Studio (If local DB works)**
```bash
cd backend
npx prisma studio
```
Open http://localhost:5555 and check User table

### Check Railway Logs

**Access logs:**
1. Go to https://railway.app
2. Open your backend project
3. Click "Deployments" tab
4. Select latest deployment
5. View real-time logs

**Look for:**
- `📥 Webhook received` - Webhook was triggered
- `✅ Webhook signature verified` - Signature is valid
- `✅ User created successfully` - User saved to database
- `❌` - Any error messages with stack traces

---

## 🔧 STEP-BY-STEP FIX GUIDE

### Step 1: Verify Railway Environment Variables

```bash
# Check which variables are set (from Railway dashboard)
Required:
1. DATABASE_URL
2. CLERK_WEBHOOK_SECRET
3. CLERK_SECRET_KEY
```

**If missing CLERK_WEBHOOK_SECRET:**
1. Go to Railway dashboard
2. Click "Variables" tab
3. Add new variable:
   - Name: `CLERK_WEBHOOK_SECRET`
   - Value: `whsec_4+YmmLn0u6vWUt/Ug3jtlYHm+A1ns3YI`
4. Wait 30 seconds for auto-redeploy

### Step 2: Configure Clerk Webhook

1. Go to https://dashboard.clerk.com
2. Select your "Omni Write" application
3. Click "Webhooks" in sidebar
4. Click "Add Endpoint"
5. Fill in:
   ```
   Endpoint URL: https://omni-write-production.up.railway.app/api/webhooks/clerk
   Description: Sync users to Supabase
   Subscribe to events:
     ☑️ user.created
     ☑️ user.updated
     ☑️ user.deleted
   ```
6. Click "Create"

### Step 3: Test the Webhook

**Option A: Using Clerk Dashboard Test**
1. Go to Clerk Dashboard → Webhooks
2. Click your webhook endpoint
3. Click "Testing" tab
4. Click "Send Example" for `user.created`
5. Check response:
   - ✅ 200 OK = Success
   - ❌ 400/500 = Check Railway logs

**Option B: Real User Signup (Recommended)**
1. Open your app (if frontend is deployed)
2. Sign up with a NEW email address
3. Check Railway logs immediately
4. Check database for new user

### Step 4: Verify User in Database

**Query Supabase directly:**
1. Go to https://supabase.com/dashboard
2. Open your project
3. Go to Table Editor
4. Select "User" table
5. Look for newly created user

**Or use check-users script:**
```bash
cd backend
node check-users.js
```

---

## 📊 COMMON ERROR PATTERNS

### Error: "Webhook secret not configured"
**Cause:** `CLERK_WEBHOOK_SECRET` not set in Railway  
**Fix:** Add environment variable in Railway dashboard

### Error: "Invalid signature"
**Cause:** Webhook secret mismatch between Railway and Clerk  
**Fix:** Copy correct secret from Clerk webhook settings

### Error: "Can't reach database server"
**Cause:** DATABASE_URL incorrect or database is down  
**Fix:** Verify DATABASE_URL in Railway matches Supabase connection string

### Error: "No email addresses provided"
**Cause:** Using Clerk's "Send Example" test (incomplete data)  
**Fix:** Use real user signup instead of test webhook

### Success: "User created successfully"
**Result:** User is now in Supabase! 🎉  
**Next:** Verify in database and celebrate

---

## 🎯 SUCCESS CRITERIA

When everything works, you should see:

1. ✅ User signs up in frontend
2. ✅ Clerk authenticates user
3. ✅ Clerk sends webhook to Railway
4. ✅ Railway logs show: "📥 Webhook received"
5. ✅ Railway logs show: "✅ User created successfully: [id]"
6. ✅ User appears in Supabase User table
7. ✅ User appears in Prisma Studio

---

## 🚀 AFTER WEBHOOK WORKS

Once user sync is working:

- [ ] Test user.updated event (change name in Clerk)
- [ ] Test user.deleted event (delete user in Clerk)
- [ ] Add Clerk auth middleware to backend
- [ ] Build protected API routes
- [ ] Create user profile page in frontend
- [ ] Implement document ownership

---

## 📞 NEED HELP?

**Check these resources:**
1. `WEBHOOK-SETUP-CHECKLIST.md` - Step-by-step setup guide
2. `CLAUDE.md` - Full project documentation
3. Railway logs - Real-time error messages
4. Clerk Dashboard → Webhooks - Delivery logs

**Run diagnostics:**
```bash
cd backend
node diagnose-webhook.js
```

---

**Last Updated:** October 25, 2025  
**Status:** Diagnosis complete - awaiting Railway/Clerk configuration check

