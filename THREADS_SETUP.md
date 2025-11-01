# Threads Integration Setup Checklist

Quick setup guide to get Threads integration working in Omni Write.

---

## 1. Create Threads App in Meta Developer Console

### Step 1: Go to Meta Developers
- Visit https://developers.facebook.com/
- Log in with your Facebook/Meta account

### Step 2: Create or Select App
- Click "My Apps" → "Create App"
- Select "Business" type
- Enter app details (name, email, etc.)

### Step 3: Add Threads Use Case
- In app dashboard, click "Add Product"
- Find and add **"Threads"** (NOT Instagram)
- Configure Threads settings

### Step 4: Get Credentials
⚠️ **Important:** You'll see TWO sets of credentials (Instagram + Threads)

Use the **THREADS** credentials (not Instagram):
- **Threads App ID** - Copy this
- **Threads App Secret** - Copy this (click "Show" first)

### Step 5: Add Redirect URI
- Go to Threads → Settings → OAuth Settings
- Add your callback URL to **Valid OAuth Redirect URIs**:
  - **Local:** `http://localhost:3000/api/auth/threads/callback`
  - **Production:** `https://your-domain.com/api/auth/threads/callback`

---

## 2. Configure Environment Variables

### Backend `.env` File

Add these to `/backend/.env`:

```bash
# ==========================================
# THREADS API CONFIGURATION
# ==========================================

# Threads OAuth Credentials (from Meta Developer Console)
THREADS_APP_ID=your_threads_app_id_here
THREADS_APP_SECRET=your_threads_app_secret_here

# Redirect URI (must match Meta Developer Console exactly)
THREADS_REDIRECT_URI=http://localhost:3000/api/auth/threads/callback

# Optional: Custom scopes (default: threads_basic,threads_content_publish)
THREADS_DEFAULT_SCOPES=threads_basic,threads_content_publish

# Optional: Success/failure redirect URIs for frontend
THREADS_SUCCESS_REDIRECT_URI=http://localhost:5173/dashboard?threads=connected
THREADS_FAILURE_REDIRECT_URI=http://localhost:5173/settings?threads=error
```

### Production Environment Variables

For **Railway** (backend):
```bash
THREADS_APP_ID=your_production_app_id
THREADS_APP_SECRET=your_production_app_secret
THREADS_REDIRECT_URI=https://your-backend-domain.railway.app/api/auth/threads/callback
THREADS_SUCCESS_REDIRECT_URI=https://your-frontend.vercel.app/dashboard?threads=connected
THREADS_FAILURE_REDIRECT_URI=https://your-frontend.vercel.app/settings?threads=error
```

---

## 3. Test Locally (Optional)

### Using ngrok for Local Testing

If you want to test OAuth locally with real Threads accounts:

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok tunnel
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
```

Update your `.env`:
```bash
THREADS_REDIRECT_URI=https://abc123.ngrok.io/api/auth/threads/callback
```

Add the ngrok URL to Meta Developer Console:
- Valid OAuth Redirect URIs: `https://abc123.ngrok.io/api/auth/threads/callback`

---

## 4. Verify Database Schema

Make sure your database has the required tables:

```bash
cd backend

# Push schema to database
npx prisma db push

# Or run migration
npx prisma migrate dev --name add-threads-support
```

Required models:
- ✅ `User`
- ✅ `SocialConnection`
- ✅ `ScheduledTweet`

---

## 5. Start Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
Server is running on 0.0.0.0:3000
Clerk authentication enabled
```

---

## 6. Test Endpoints

### Test 1: Health Check
```bash
curl http://localhost:3000/api/health
# Expected: {"status":"ok"}
```

### Test 2: Start OAuth (requires Clerk auth)
```bash
curl "http://localhost:3000/api/auth/threads?mode=json" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"

# Expected: {"authorizationUrl":"https://threads.net/oauth/authorize?..."}
```

### Test 3: Create Post (requires Threads connection)
```bash
curl -X POST http://localhost:3000/api/threads/post \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello from Omni Write! 🚀"
  }'

# Expected: {"data":{"id":"...","creation_id":"..."}}
```

---

## 7. Production Deployment

### Deploy to Railway

1. **Push code to GitHub**:
```bash
git add .
git commit -m "feat: Add Threads integration"
git push origin main
```

2. **Add environment variables in Railway**:
   - Go to Railway dashboard
   - Select your backend service
   - Go to "Variables" tab
   - Add all `THREADS_*` variables

3. **Redeploy**:
   - Railway auto-deploys on push
   - Or manually trigger: "Deploy" → "Deploy Now"

### Update Meta Developer Console

Add your production redirect URI:
```
https://your-backend.railway.app/api/auth/threads/callback
```

---

## 8. Frontend Integration (Next Step)

Once backend is working, you can integrate in your frontend:

```javascript
// Start Threads OAuth
const connectThreads = async () => {
  try {
    const response = await fetch(
      `${API_URL}/api/auth/threads?mode=json`,
      {
        headers: {
          'Authorization': `Bearer ${await getToken()}`,
        },
      }
    );
    const { authorizationUrl } = await response.json();
    window.location.href = authorizationUrl;
  } catch (error) {
    console.error('Threads OAuth error:', error);
  }
};
```

---

## Troubleshooting

### ❌ "Threads API env missing"
- Check `.env` file exists in `/backend`
- Verify variable names: `THREADS_APP_ID`, `THREADS_APP_SECRET`, `THREADS_REDIRECT_URI`
- Restart backend server after changes

### ❌ "Redirect URI mismatch"
- Ensure URI in `.env` matches Meta Developer Console **exactly**
- Include `http://` or `https://`
- No trailing slashes
- Case-sensitive

### ❌ "Invalid client credentials"
- Verify you're using **Threads** App ID (not Instagram)
- Check App Secret is correct (reveal and copy again)
- Ensure app is not in Development Mode for production

### ❌ "OAuth state invalid"
- Clear browser cookies/cache
- Restart OAuth flow
- Check server time is synchronized

---

## Required Permissions

Ensure your Threads app requests these scopes:

- ✅ `threads_basic` - Required for all Threads API calls
- ✅ `threads_content_publish` - Required for posting

Optional scopes for future features:
- `threads_manage_replies` - For reply management
- `threads_read_replies` - For reading replies
- `threads_manage_insights` - For analytics

---

## Rate Limits to Remember

| Action | Limit | Period |
|--------|-------|--------|
| Posts | 250 | 24 hours |
| Replies | 1,000 | 24 hours |
| Deletions | 100 | 24 hours |

⚠️ These limits are **per user across ALL apps**, not per app!

---

## Next Steps

After setup is complete:

1. ✅ Test OAuth flow end-to-end
2. ✅ Test post creation
3. ✅ Test scheduled posts (wait 1-2 minutes)
4. ✅ Build frontend UI for Threads integration
5. ✅ Add Threads to social connections page
6. ✅ Add scheduling UI for Threads posts

---

## Resources

- [Threads API Docs](https://developers.facebook.com/docs/threads)
- [Meta Developer Console](https://developers.facebook.com/apps)
- [Full Integration Guide](./THREADS_INTEGRATION.md)

---

**Setup Time:** ~15 minutes  
**Difficulty:** Medium  
**Status:** Ready for testing

---

Last updated: November 1, 2025

