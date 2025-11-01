# Threads API Credentials

## 🔑 **Current Credentials** (Updated: Nov 1, 2025)

**Meta Developer Account:**
- **App ID**: `1143862700714291`
- **App Secret**: `921d136be4e3602edb0fa73713201b5d`

---

## ⚙️ **Environment Variables for Railway**

Copy and paste these into Railway:

```bash
THREADS_APP_ID=1143862700714291
THREADS_APP_SECRET=921d136be4e3602edb0fa73713201b5d
THREADS_REDIRECT_URI=https://omni-write-production.up.railway.app/api/auth/threads/callback
THREADS_SUCCESS_REDIRECT_URI=https://omni-write.vercel.app/profile
THREADS_FAILURE_REDIRECT_URI=https://omni-write.vercel.app/profile?error=threads_oauth_failed
THREADS_DEFAULT_SCOPES=threads_basic,threads_content_publish
```

---

## 🖥️ **Local Development (.env)**

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

---

## 📋 **Meta Developer Dashboard Checklist**

### **Required Settings:**

1. **Settings → Basic**
   - Privacy Policy URL: `https://omni-write.vercel.app/privacy`
   - Terms of Service URL: `https://omni-write.vercel.app/terms`
   - App Domains: `omni-write-production.up.railway.app` and `omni-write.vercel.app`

2. **Settings → Basic → Add Platform → Website**
   - Site URL: `https://omni-write.vercel.app`

3. **Use Cases → Access the Threads API → Settings**
   - Redirect Callback URLs: `https://omni-write-production.up.railway.app/api/auth/threads/callback`
   - (Optional) For local testing: `http://localhost:3000/api/auth/threads/callback`

4. **Use Cases → Access the Threads API → Permissions**
   - Enable: `threads_basic`
   - Enable: `threads_content_publish`

---

## 🚀 **Quick Deploy Commands**

```bash
# Add variables to Railway
railway variables set THREADS_APP_ID=1143862700714291
railway variables set THREADS_APP_SECRET=921d136be4e3602edb0fa73713201b5d
railway variables set THREADS_REDIRECT_URI=https://omni-write-production.up.railway.app/api/auth/threads/callback
railway variables set THREADS_SUCCESS_REDIRECT_URI=https://omni-write.vercel.app/profile
railway variables set THREADS_FAILURE_REDIRECT_URI=https://omni-write.vercel.app/profile?error=threads_oauth_failed
railway variables set THREADS_DEFAULT_SCOPES=threads_basic,threads_content_publish

# Deploy to production
git add .
git commit -m "feat: Add Threads integration"
git push origin threads
```

---

## 🧪 **Test URLs**

**OAuth Flow:**
```
https://omni-write-production.up.railway.app/api/auth/threads
```

**Create Post (requires Clerk token):**
```bash
curl -X POST https://omni-write-production.up.railway.app/api/threads/post \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello from Omni Write! 🚀"}'
```

---

**⚠️ SECURITY NOTE:** Keep your App Secret private! Never commit to Git or share publicly.
