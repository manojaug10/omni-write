# Webhook Not Working - Debug Checklist

## Let's systematically check what's wrong

### Step 1: Check Railway Environment Variable Name ⚠️

**CRITICAL:** The environment variable name must be EXACTLY:
```
CLERK_WEBHOOK_SECRET
```

**Common mistakes:**
- ❌ `WEBHOOK_SECRET`
- ❌ `CLERK_SECRET`
- ❌ `CLERK_WEBHOOK`
- ✅ `CLERK_WEBHOOK_SECRET` (correct!)

**How to verify:**
1. Go to Railway Dashboard
2. Click on your service
3. Click "Variables" tab
4. Look for `CLERK_WEBHOOK_SECRET`
5. Make sure the value starts with `whsec_`

---

### Step 2: Verify Railway Redeployed

After adding the environment variable, Railway should automatically redeploy.

**How to check:**
1. Go to Railway Dashboard
2. Click "Deployments" tab
3. Check the timestamp of the latest deployment
4. It should be AFTER you added the webhook secret
5. Status should be "Success" (green checkmark)

**If Railway didn't redeploy:**
- Click the "..." menu
- Click "Redeploy"
- Wait 2-3 minutes for deployment to complete

---

### Step 3: Check Railway Logs (MOST IMPORTANT!)

This will tell us exactly what's happening.

**How to check:**
1. Go to Railway Dashboard
2. Click on your service
3. Click "Deployments" tab
4. Click on the latest deployment
5. View the logs
6. Look for recent activity (last few minutes)

**What to look for:**

#### If you see these lines → Webhook is being received:
```
📥 Webhook received - Headers: { svix_id, svix_timestamp }
✅ Webhook signature verified
📨 Webhook event: user.created for user user_xxxxx
🔄 Creating user user_xxxxx...
✅ User created successfully: user_xxxxx
```

#### If you see this → Wrong webhook secret:
```
📥 Webhook received - Headers: { svix_id, svix_timestamp }
❌ Error verifying webhook signature: ...
```

#### If you see this → Missing webhook secret:
```
❌ Missing CLERK_WEBHOOK_SECRET environment variable
```

#### If you see NOTHING → Clerk isn't sending webhooks:
- No webhook logs at all
- This means Clerk isn't configured correctly

---

### Step 4: Verify Clerk Webhook Configuration

**Go back to Clerk Dashboard:**

1. Click "Webhooks" in sidebar
2. You should see your webhook endpoint listed
3. Click on it
4. Check these settings:

**Endpoint URL must be EXACTLY:**
```
https://omni-write-production.up.railway.app/api/webhooks/clerk
```

**Common mistakes:**
- ❌ Missing `/api/webhooks/clerk`
- ❌ Using localhost URL
- ❌ Extra spaces or characters
- ❌ Wrong domain

**Events subscribed (must have all 3):**
- ✅ user.created
- ✅ user.updated
- ✅ user.deleted

**Status:**
- Should show as "Active" or "Enabled"
- Should NOT show errors

---

### Step 5: Test the Webhook from Clerk

While you're in the Clerk webhook settings:

1. Click on your webhook
2. Click "Testing" tab
3. Click "Send Example" for `user.created`
4. Look at the response

**Expected responses:**

✅ **Success (200 OK):** Webhook is working!

⚠️ **Error with message about email addresses:** This is actually OK! Clerk's test events have incomplete data. The real signup should work.

❌ **404 Not Found:** Endpoint URL is wrong

❌ **500 Server Error:** Check Railway logs for the error

❌ **Timeout:** Railway might be down or slow

---

### Step 6: Check Recent Deliveries in Clerk

This is the BEST way to see what's happening:

1. In Clerk Dashboard → Webhooks
2. Click on your webhook endpoint
3. Click "Recent Deliveries" or "Logs" tab
4. Look for the webhook event from your recent signup

**What you'll see:**

Each delivery shows:
- Timestamp
- Event type (e.g., `user.created`)
- Status code
- Response body

**Check the status:**
- ✅ **200 OK:** Success! Webhook worked.
- ❌ **400, 500:** Click on it to see the error details
- ❌ **Nothing listed:** Clerk didn't send any webhooks

---

## Quick Diagnostic Commands

Run these in your terminal to help diagnose:

### Check if endpoint is accessible:
```bash
curl -X POST https://omni-write-production.up.railway.app/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```
Should return: `{"error":"Missing svix headers"}`

---

## What to Share With Me

Don't share any secrets! Just share:

1. **Railway logs output** (copy/paste the relevant lines)
   - Look for lines with 📥, ✅, or ❌ emojis
   - Or any error messages

2. **Clerk webhook delivery status**
   - What status code did Clerk receive?
   - Any error message?

3. **Railway environment variables** (just confirm these exist, don't share values):
   - [ ] CLERK_WEBHOOK_SECRET exists?
   - [ ] DATABASE_URL exists?
   - [ ] CLERK_SECRET_KEY exists?

4. **Railway deployment status**
   - Was there a deployment after you added the webhook secret?
   - Is the latest deployment successful?

---

## Most Common Issues (99% of cases)

1. **Wrong variable name** → Must be `CLERK_WEBHOOK_SECRET` exactly
2. **Railway didn't redeploy** → Manually trigger a redeploy
3. **Wrong webhook URL in Clerk** → Must include `/api/webhooks/clerk`
4. **Webhook not enabled in Clerk** → Check if it's active
5. **Missing events** → Must subscribe to `user.created`

---

## Next Steps

Please do this:

1. ✅ Check Railway logs (Step 3) - This is the most important!
2. ✅ Verify the webhook secret variable name (Step 1)
3. ✅ Check Clerk recent deliveries (Step 6)
4. ✅ Share the findings (not the secrets, just what you see)

Then I can tell you exactly what's wrong!
