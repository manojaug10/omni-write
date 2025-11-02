# Threads OAuth Fix Guide

## Problem
The Connect Accounts page shows error: **"Failed to initiate Threads OAuth"**

## Root Cause
Environment variable naming mismatch:
- **Local `.env` file had:** `THREADS_CLIENT_ID` and `THREADS_CLIENT_SECRET`
- **Code expects:** `THREADS_APP_ID` and `THREADS_APP_SECRET`

Meta's Instagram/Threads API uses "app_id" and "app_secret" (not "client_id" and "client_secret").

## Fix Applied (Local)

### Updated `/backend/.env`:
```bash
# OLD (incorrect)
THREADS_CLIENT_ID=3195015087317536
THREADS_CLIENT_SECRET=8404570e83ab394733c960621b6fe062
THREADS_OAUTH_SCOPE=threads_basic

# NEW (correct)
THREADS_APP_ID=3195015087317536
THREADS_APP_SECRET=8404570e83ab394733c960621b6fe062
THREADS_DEFAULT_SCOPES=threads_basic,threads_content_publish
```

## Required Action: Update Railway Environment Variables

You must update the environment variables in your Railway deployment:

### Step 1: Access Railway Dashboard
1. Go to [railway.app](https://railway.app)
2. Select your `omni-write` project
3. Click on your backend service
4. Click **"Variables"** tab

### Step 2: Remove Old Variables
Delete or rename these variables:
- ❌ `THREADS_CLIENT_ID`
- ❌ `THREADS_CLIENT_SECRET`
- ❌ `THREADS_OAUTH_SCOPE`

### Step 3: Add New Variables
Add these variables with your actual values:

```bash
THREADS_APP_ID=3195015087317536
THREADS_APP_SECRET=8404570e83ab394733c960621b6fe062
THREADS_REDIRECT_URI=https://omni-write-production.up.railway.app/api/auth/threads/callback
THREADS_DEFAULT_SCOPES=threads_basic,threads_content_publish
THREADS_SUCCESS_REDIRECT_URI=https://omni-write.vercel.app/connect-accounts
THREADS_FAILURE_REDIRECT_URI=https://omni-write.vercel.app/connect-accounts
```

### Step 4: Deploy
Railway will automatically redeploy your backend with the new environment variables.

## Verification

### Local Testing (Already Working)
1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm run dev`
3. Navigate to `/connect-accounts`
4. Click "Threads" button
5. Should redirect to Threads OAuth (no error)

### Production Testing (After Railway Update)
1. Go to https://omni-write.vercel.app/connect-accounts
2. Click "Threads" button
3. Should redirect to Threads OAuth authorization page
4. Authorize the app
5. Should redirect back with success message

## Technical Details

### Code Location
File: `/backend/src/services/threads.service.js`

```javascript
function getConfig() {
  const {
    THREADS_APP_ID: appId,          // ← Expects THREADS_APP_ID
    THREADS_APP_SECRET: appSecret,   // ← Expects THREADS_APP_SECRET
    THREADS_REDIRECT_URI: redirectUri,
    THREADS_DEFAULT_SCOPES: scope = 'threads_basic,threads_content_publish',
  } = process.env;

  if (!appId || !appSecret || !redirectUri) {
    throw new Error('Threads API env missing (THREADS_APP_ID, THREADS_APP_SECRET, THREADS_REDIRECT_URI)');
  }

  return { appId, appSecret, redirectUri, scope };
}
```

### Error Thrown
When environment variables are incorrect, this error is thrown:
```
Error: Threads API env missing (THREADS_APP_ID, THREADS_APP_SECRET, THREADS_REDIRECT_URI)
```

This gets caught by the frontend and displayed as:
```
Failed to initiate Threads OAuth
```

## Status
- ✅ **Local environment:** Fixed
- ⏳ **Production (Railway):** Requires manual update (see Step 1-4 above)

## Notes
- X (Twitter) OAuth uses `X_CLIENT_ID` and `X_CLIENT_SECRET` (OAuth 2.0 standard)
- Threads OAuth uses `THREADS_APP_ID` and `THREADS_APP_SECRET` (Meta/Instagram API standard)
- This is correct and intentional - different providers use different naming conventions
