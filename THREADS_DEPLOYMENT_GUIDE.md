# Threads Integration - Deployment Guide

## 🎯 **Your Updated Credentials**

**Meta Developer Account (New):**
- **App ID**: `1143862700714291`
- **App Secret**: `921d136be4e3602edb0fa73713201b5d`

---

## ✅ **Step-by-Step Deployment**

### **Step 1: Configure Meta Developer Dashboard** (5 minutes)

Go to https://developers.facebook.com and configure your Threads app:

#### **1.1 Basic Settings**
Navigate to: **Settings** → **Basic**

- ✅ **App Name**: Set a name (e.g., "Omni Writes")
- ✅ **Privacy Policy URL**: `https://omni-write.vercel.app/privacy`
- ✅ **Terms of Service URL**: `https://omni-write.vercel.app/terms`
- ✅ **App Domains**: Add both:
  - `omni-write-production.up.railway.app`
  - `omni-write.vercel.app`

**Click "Save Changes"**

#### **1.2 Add Website Platform**
Scroll down to **"+ Add Platform"** section:

- Click **"+ Add Platform"**
- Select **"Website"**
- **Site URL**: `https://omni-write.vercel.app`
- Click **"Save Changes"**

#### **1.3 Configure Threads Use Case**
Navigate to: **Use Cases** → **Access the Threads API** → **Settings**

Add these settings:
- **Threads Display Name**: `omniwrites` (or your preferred name)
- **Redirect Callback URLs**:
  ```
  https://omni-write-production.up.railway.app/api/auth/threads/callback
  ```

**Click "Save"**

#### **1.4 Enable Permissions**
Navigate to: **Use Cases** → **Access the Threads API** → **Permissions and features**

Ensure these are enabled and show "Ready for testing":
- ✅ **threads_basic**
- ✅ **threads_content_publish**

---

### **Step 2: Add Environment Variables to Railway** (3 minutes)

Option A: **Via Railway CLI** (Recommended)
```bash
railway variables set THREADS_APP_ID=1143862700714291
railway variables set THREADS_APP_SECRET=921d136be4e3602edb0fa73713201b5d
railway variables set THREADS_REDIRECT_URI=https://omni-write-production.up.railway.app/api/auth/threads/callback
railway variables set THREADS_SUCCESS_REDIRECT_URI=https://omni-write.vercel.app/profile
railway variables set THREADS_FAILURE_REDIRECT_URI=https://omni-write.vercel.app/profile?error=threads_oauth_failed
railway variables set THREADS_DEFAULT_SCOPES=threads_basic,threads_content_publish
```

Option B: **Via Railway Dashboard**
1. Go to https://railway.app
2. Select your project: **omni-write**
3. Click **"Variables"** tab
4. Add each variable:

| Variable Name | Value |
|---------------|-------|
| `THREADS_APP_ID` | `1143862700714291` |
| `THREADS_APP_SECRET` | `921d136be4e3602edb0fa73713201b5d` |
| `THREADS_REDIRECT_URI` | `https://omni-write-production.up.railway.app/api/auth/threads/callback` |
| `THREADS_SUCCESS_REDIRECT_URI` | `https://omni-write.vercel.app/profile` |
| `THREADS_FAILURE_REDIRECT_URI` | `https://omni-write.vercel.app/profile?error=threads_oauth_failed` |
| `THREADS_DEFAULT_SCOPES` | `threads_basic,threads_content_publish` |

---

### **Step 3: Update Local Environment (Optional - for testing)**

Add to `backend/.env`:
```bash
# Threads (Meta) OAuth
THREADS_APP_ID=1143862700714291
THREADS_APP_SECRET=921d136be4e3602edb0fa73713201b5d
THREADS_REDIRECT_URI=http://localhost:3000/api/auth/threads/callback
THREADS_SUCCESS_REDIRECT_URI=http://localhost:5173/profile
THREADS_FAILURE_REDIRECT_URI=http://localhost:5173/profile?error=threads_oauth_failed
THREADS_DEFAULT_SCOPES=threads_basic,threads_content_publish
```

**Note:** For local testing, also add this redirect URI to Meta Developer Dashboard:
```
http://localhost:3000/api/auth/threads/callback
```

---

### **Step 4: Deploy Code to Production** (2 minutes)

```bash
# Make sure you're on the threads branch
git checkout threads

# Add all changes
git add .

# Commit changes
git commit -m "feat: Add Threads integration with OAuth, posting, scheduling, and auto token refresh"

# Push to GitHub
git push origin threads

# Railway will automatically deploy
```

**Verify deployment:**
1. Go to Railway Dashboard
2. Check deployment logs
3. Wait for "Build successful" message
4. Verify server is running

---

### **Step 5: Test the Integration** (5 minutes)

#### **5.1 Test OAuth Flow**

1. **Visit the OAuth endpoint:**
   ```
   https://omni-write-production.up.railway.app/api/auth/threads
   ```

2. **You should be redirected to Threads login**
   - Log in with your Threads account
   - Grant permissions to "omniwrites"

3. **After authorization, you'll be redirected to:**
   ```
   https://omni-write.vercel.app/profile?threads_oauth=success&connection_id=...
   ```

4. **Verify in database:**
   - Check Supabase → `SocialConnection` table
   - You should see a new record with:
     - `provider: "THREADS"`
     - `providerUserId: "your_threads_id"`
     - `accessToken: "..."`
     - `accessTokenExpiresAt: (60 days from now)`

#### **5.2 Test Post Creation**

Using curl or Postman:

```bash
# Get your Clerk token first
# Then test post creation:

curl -X POST https://omni-write-production.up.railway.app/api/threads/post \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello from Omni Write! 🚀 Testing Threads API integration."}'
```

**Expected response:**
```json
{
  "data": {
    "id": "123456789",
    "creation_id": "987654321"
  }
}
```

#### **5.3 Test Scheduled Post**

```bash
curl -X POST https://omni-write-production.up.railway.app/api/threads/post/schedule \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is a scheduled post! ⏰",
    "scheduledAt": "2025-11-01T20:00:00Z"
  }'
```

**Expected response:**
```json
{
  "scheduled": {
    "id": "abc123",
    "userId": "user_123",
    "provider": "THREADS",
    "text": "This is a scheduled post! ⏰",
    "scheduledAt": "2025-11-01T20:00:00.000Z",
    "status": "QUEUED",
    "createdAt": "2025-11-01T19:30:00.000Z"
  }
}
```

**Wait for scheduled time and verify:**
1. Check Railway logs at scheduled time
2. Post should appear on your Threads profile
3. Database record should update to `status: "POSTED"`

#### **5.4 Verify Background Jobs**

Check Railway logs for:
```
Token refresh completed: X success, Y failures
Scheduled Threads posts processing...
```

---

## 🐛 **Troubleshooting**

### **Issue: OAuth redirect fails**

**Symptoms:** After authorizing, you get an error or blank page

**Solutions:**
1. Verify redirect URI in Meta Dashboard matches exactly:
   ```
   https://omni-write-production.up.railway.app/api/auth/threads/callback
   ```
2. Check Railway logs for errors
3. Verify environment variables are set in Railway

### **Issue: "Invalid OAuth access token"**

**Symptoms:** API calls fail with token error

**Solutions:**
1. Token might have expired (shouldn't happen with long-lived tokens)
2. Check `accessTokenExpiresAt` in database
3. Try refreshing token:
   ```bash
   POST /api/threads/refresh
   ```

### **Issue: "Rate limit exceeded"**

**Symptoms:** Error mentioning 250 posts/24hr limit

**Solutions:**
1. Wait 24 hours or until rate limit resets
2. This is a Threads API limit (shared across all apps)
3. Check response headers for `retry-after` time

### **Issue: Scheduled posts not publishing**

**Symptoms:** Posts stuck in "QUEUED" status

**Solutions:**
1. Check Railway logs for job errors
2. Verify background job is running (should log every 30 seconds)
3. Check if Threads connection still exists in database
4. Verify access token hasn't expired

---

## 📊 **Post-Deployment Verification Checklist**

- [ ] Meta Developer Dashboard configured
  - [ ] Privacy Policy URL set
  - [ ] Website platform added
  - [ ] Redirect URI configured
  - [ ] Permissions enabled
- [ ] Railway environment variables set
  - [ ] THREADS_APP_ID
  - [ ] THREADS_APP_SECRET
  - [ ] THREADS_REDIRECT_URI
  - [ ] THREADS_SUCCESS_REDIRECT_URI
- [ ] Code deployed to Railway
  - [ ] Latest commit pushed
  - [ ] Build successful
  - [ ] Server running
- [ ] OAuth flow tested
  - [ ] Authorization URL works
  - [ ] Callback succeeds
  - [ ] Database record created
- [ ] Post creation tested
  - [ ] Immediate post works
  - [ ] Post appears on Threads
- [ ] Scheduled post tested
  - [ ] Scheduled post created
  - [ ] Background job processes it
  - [ ] Post published on time
- [ ] Background jobs verified
  - [ ] Token refresh job running
  - [ ] Scheduled post job running
  - [ ] No errors in logs

---

## 🎉 **Success Criteria**

Your Threads integration is working when:

1. ✅ You can connect your Threads account via OAuth
2. ✅ You can create posts immediately
3. ✅ You can schedule posts for later
4. ✅ Scheduled posts publish automatically
5. ✅ Token refresh happens automatically (check logs after 24 hours)
6. ✅ No errors in Railway logs

---

## 📝 **Next Steps (Optional Enhancements)**

After successful deployment, consider:

1. **Add Frontend UI** for Threads integration
   - Connect Threads button in profile page
   - Post creation form
   - Scheduled posts list

2. **Add Video Support** (enhanced)
   - Video upload endpoint
   - Processing status polling

3. **Add Carousel Posts**
   - Multi-image/video posts

4. **Add Insights/Analytics**
   - View counts, likes, replies
   - Requires `threads_manage_insights` permission

See [THREADS_ENHANCEMENTS.md](THREADS_ENHANCEMENTS.md) for details.

---

## 🔗 **Useful Links**

- **Meta Developer Dashboard**: https://developers.facebook.com
- **Railway Dashboard**: https://railway.app
- **Frontend**: https://omni-write.vercel.app
- **Backend API**: https://omni-write-production.up.railway.app
- **Threads API Docs**: https://developers.facebook.com/docs/threads

---

**Last Updated:** November 1, 2025
**Status:** Ready for deployment
