# Webhook Not Working - Debug Steps

User exists in Clerk but NOT in database = Webhook is not successfully running.

## Step 1: Verify Railway Deployment

**Check if Railway has deployed the latest code:**

1. Go to https://railway.app
2. Open your backend project
3. Click "Deployments" tab
4. Check the latest deployment:
   - Status should be: ✅ Success
   - Commit message should be: "Fix webhook to handle Clerk test events..."
   - Timestamp should be recent (last 5-10 minutes)

**If deployment failed or is old:**
- Railway might not have auto-deployed
- Click "Deploy" button manually

---

## Step 2: Test Railway Endpoint

**Run this command to verify your Railway backend is live:**

```bash
curl https://omni-write-production.up.railway.app/api/health
```

**Expected response:**
```json
{"status":"ok"}
```

**If you get an error:**
- Railway is not running
- Check Railway logs for startup errors

---

## Step 3: Check Webhook Configuration in Clerk

**Go to Clerk Dashboard:**

1. Visit: https://dashboard.clerk.com
2. Select your "Omni Write" app
3. Click "Webhooks" in left sidebar

**Verify webhook exists with:**
- Endpoint URL: `https://omni-write-production.up.railway.app/api/webhooks/clerk`
- Status: ✅ Active (not paused/disabled)
- Events subscribed:
  - ☑️ user.created
  - ☑️ user.updated
  - ☑️ user.deleted

**If webhook doesn't exist or URL is wrong:**
- Create/update webhook with correct URL
- Make sure URL ends with `/api/webhooks/clerk` (not `/clerk` or anything else)

---

## Step 4: Check Webhook Secret Matches

**Get your webhook secret from Clerk:**

1. In Clerk Dashboard → Webhooks
2. Click on your webhook endpoint
3. Click "Signing Secret" tab
4. Copy the secret (starts with `whsec_...`)

**Check Railway has the same secret:**

1. Go to https://railway.app
2. Open backend project
3. Click "Variables" tab
4. Look for `CLERK_WEBHOOK_SECRET`
5. Click the eye icon to reveal value
6. **Compare:** Does it match the Clerk secret EXACTLY?

**If they don't match or variable is missing:**
- Add/update `CLERK_WEBHOOK_SECRET` in Railway
- Wait 30 seconds for Railway to redeploy

---

## Step 5: Check Webhook Delivery Attempts

**In Clerk Dashboard:**

1. Go to Webhooks → Your endpoint
2. Click "Logs" or "Deliveries" tab
3. Look at recent webhook attempts

**What to check:**

### Scenario A: No delivery attempts at all
**Problem:** Clerk is not sending webhooks
**Solution:**
- Webhook might be disabled/paused - check status
- Events might not be selected - add user.created, user.updated, user.deleted
- Create a NEW user in Clerk to trigger webhook

### Scenario B: Delivery attempts with 400 error
**Problem:** Signature verification failing
**Solution:**
- `CLERK_WEBHOOK_SECRET` in Railway doesn't match Clerk
- Copy secret from Clerk and update Railway variable
- Make sure no extra spaces/characters

### Scenario C: Delivery attempts with 500 error
**Problem:** Webhook code is crashing
**Solution:**
- Check Railway logs (Step 6)
- Look for error stack traces

### Scenario D: Delivery attempts with 200 success
**Problem:** Webhook ran but didn't save to database
**Solution:**
- Database connection issue
- Check Railway logs (Step 6)
- Verify `DATABASE_URL` in Railway

---

## Step 6: Check Railway Logs

**View real-time logs:**

1. Go to https://railway.app
2. Open backend project
3. Click "Deployments" tab
4. Click the latest deployment
5. Scroll through logs

**What to look for:**

### Good signs:
```
📥 Webhook received
✅ Webhook signature verified
📨 Webhook event: user.created
🔄 Creating user...
✅ User created successfully
```

### Bad signs:
```
❌ Missing CLERK_WEBHOOK_SECRET
❌ Error verifying webhook signature
❌ email_addresses is empty
❌ Error creating user
```

**Copy any error messages you see and share them!**

---

## Step 7: Create a Test User

**While watching Railway logs:**

1. Open Railway logs in browser (keep it open)
2. In another tab, go to Clerk Dashboard
3. Go to "Users" section
4. Click "Create User" button
5. Add email: `webhook-test@example.com`
6. Add password (any password)
7. Click "Create"

**Immediately check Railway logs:**
- You should see webhook activity within 1-2 seconds
- Look for the emoji logs (📥, ✅, etc.)

**Then check Prisma Studio:**
```bash
cd backend
npx prisma studio
```
- Refresh the User table
- `webhook-test@example.com` should appear

---

## Quick Checklist

Before asking for more help, verify:

- [ ] Railway deployment is successful and recent
- [ ] `curl https://omni-write-production.up.railway.app/api/health` works
- [ ] Webhook exists in Clerk Dashboard with correct URL
- [ ] `CLERK_WEBHOOK_SECRET` in Railway matches Clerk exactly
- [ ] Webhook is Active (not paused) in Clerk
- [ ] user.created event is subscribed in Clerk webhook
- [ ] `DATABASE_URL` is set in Railway
- [ ] Created a NEW test user (not using existing user)

---

## Share This Info If Still Not Working

If you've gone through all steps and it's still not working, share:

1. **Screenshot of Clerk webhook configuration** (URL + events)
2. **Screenshot of Railway variables** (blur out actual secrets, just show they exist)
3. **Latest Railway logs** (from when you created test user)
4. **Clerk webhook delivery logs** (success/failure status)

This will help diagnose the exact issue!
