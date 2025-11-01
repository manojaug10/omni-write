# Threads API Enhancement Recommendations

## Current Implementation Status: 85% Complete ✅

### ✅ **Completed Features**

1. **OAuth 2.0 Flow**
   - ✅ Authorization with `threads_basic` and `threads_content_publish`
   - ✅ Short-lived to long-lived token exchange (automatic)
   - ✅ Token refresh (60-day tokens)
   - ✅ State-based CSRF protection

2. **Single Post Management**
   - ✅ Create text posts
   - ✅ Create posts with images (via `mediaUrl` parameter)
   - ✅ Delete posts
   - ✅ Schedule posts for later
   - ✅ Background job processing

3. **Connection Management**
   - ✅ Connect Threads account
   - ✅ Disconnect Threads account
   - ✅ Get profile information
   - ✅ Token expiry tracking

4. **Rate Limiting**
   - ✅ 250 posts/24hr limit handling
   - ✅ 100 deletions/24hr limit handling
   - ✅ Error messages with retry-after headers

---

## 🔧 **Recommended Enhancements**

### **1. Carousel Posts** (Priority: Medium)

**What it is:** Multi-image/video posts (like Instagram carousels)

**Implementation:**
```javascript
// In threads.service.js
async function createCarouselPost(accessToken, text, mediaUrls) {
  const me = await getMe(accessToken);
  const userId = me.data.id;

  // Create carousel container
  const carouselParams = {
    media_type: 'CAROUSEL',
    children: mediaUrls, // Array of media container IDs
    text: text,
    access_token: accessToken,
  };

  // Post to /{user-id}/threads and then publish
}
```

**Routes to add:**
- `POST /api/threads/carousel` - Create carousel post
- `POST /api/threads/carousel/schedule` - Schedule carousel post

---

### **2. Thread Replies** (Priority: Low)

**What it is:** Reply to existing Threads posts

**Requirements:**
- User must own the root thread post, OR
- User must have `threads_manage_replies` permission

**Implementation:**
```javascript
// In threads.service.js
async function replyToThread(accessToken, text, replyToId) {
  const me = await getMe(accessToken);
  const userId = me.data.id;

  const mediaParams = {
    media_type: 'TEXT',
    text: text,
    reply_to_id: replyToId, // ID of post to reply to
    access_token: accessToken,
  };

  // Create and publish reply
}
```

**Routes to add:**
- `POST /api/threads/reply` - Reply to a thread

---

### **3. Quote Posts & Reposts** (Priority: Low)

**What it is:** Quote another user's post or repost it

**Implementation:**
```javascript
// In threads.service.js
async function quotePost(accessToken, text, quotedPostId) {
  // Similar to createPost but with reply_quote_id parameter
}

async function repost(accessToken, postId) {
  // Repost without adding new text
}
```

**Routes to add:**
- `POST /api/threads/quote` - Quote a post
- `POST /api/threads/repost` - Repost

---

### **4. Insights API** (Priority: Medium)

**What it is:** Analytics for posts (views, likes, replies, reposts, quotes, shares)

**Requirements:**
- User must grant `threads_manage_insights` permission

**Implementation:**
```javascript
// In threads.service.js
async function getPostInsights(accessToken, postId, metrics = ['views', 'likes', 'replies']) {
  const url = `${THREADS_GRAPH_API_BASE}/v1.0/${postId}/insights`;
  const params = new URLSearchParams({
    metric: metrics.join(','),
    access_token: accessToken,
  });

  const response = await axios.get(`${url}?${params.toString()}`);
  return response.data;
}
```

**Routes to add:**
- `GET /api/threads/post/:id/insights` - Get post analytics

---

### **5. Video Support** (Priority: High)

**What it is:** Post videos to Threads

**Current Status:** Partially supported (mediaUrl with VIDEO type)

**Enhancement needed:**
- Video upload endpoint
- Polling for video processing status
- Better error handling for video failures

**Implementation:**
```javascript
// In threads.service.js - enhance createPost
async function createVideoPost(accessToken, text, videoUrl) {
  // Step 1: Create video container
  const createResponse = await createMediaContainer(userId, {
    media_type: 'VIDEO',
    video_url: videoUrl,
    text: text,
  });

  // Step 2: Poll for video processing completion
  await pollVideoStatus(creationId);

  // Step 3: Publish when ready
  await publishMediaContainer(userId, creationId);
}
```

---

### **6. Topic Tags & Links** (Priority: Low)

**What it is:** Add hashtags and links to posts

**Current Status:** Works via plain text (just include #hashtag in text)

**Enhancement:**
- Validation for hashtag format
- Link preview support
- Topic suggestion API

---

### **7. Automatic Token Refresh Job** (Priority: High)

**What it is:** Background job to refresh tokens before expiry

**Implementation:**
```javascript
// In backend/src/jobs/refreshTokens.js
async function refreshExpiringTokens() {
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Find all Threads connections expiring in < 7 days
  const expiringConnections = await prisma.socialConnection.findMany({
    where: {
      provider: 'THREADS',
      accessTokenExpiresAt: {
        lte: sevenDaysFromNow,
      },
    },
  });

  for (const conn of expiringConnections) {
    try {
      const refreshed = await threadsService.refreshAccessToken(conn.accessToken);
      await upsertConnection({
        userId: conn.userId,
        provider: 'THREADS',
        providerUserId: conn.providerUserId,
        accessToken: refreshed.access_token,
        accessTokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
        username: conn.username,
      });
      console.log(`Refreshed token for user ${conn.userId}`);
    } catch (error) {
      console.error(`Failed to refresh token for user ${conn.userId}:`, error);
    }
  }
}

// Add to server.js
setInterval(refreshExpiringTokens, 24 * 60 * 60 * 1000); // Run daily
```

---

### **8. User Feed & Mentions** (Priority: Low)

**Note:** Per Threads API limitations:
- ❌ Cannot show followers' timeline/feed
- ❌ Can only display posts created by the authenticated user

**What you CAN do:**
- List user's own posts
- Get mentions (requires `threads_read_replies` permission)

**Implementation:**
```javascript
// In threads.service.js
async function getUserPosts(accessToken, limit = 25) {
  const me = await getMe(accessToken);
  const url = `${THREADS_GRAPH_API_BASE}/v1.0/${me.data.id}/threads`;
  const params = new URLSearchParams({
    fields: 'id,text,timestamp,media_type,media_url,permalink',
    limit: limit,
    access_token: accessToken,
  });

  const response = await axios.get(`${url}?${params.toString()}`);
  return response.data;
}
```

---

## 📊 **Priority Recommendations**

### **Phase 1: Essential (Do This Week)**
1. ✅ Automatic token refresh job (CRITICAL - prevents token expiry)
2. ✅ Video post support (highly requested feature)
3. ✅ Better error handling and logging

### **Phase 2: Nice to Have (Do This Month)**
1. Carousel posts
2. Post insights/analytics
3. Get user's own posts (list view)

### **Phase 3: Advanced (Future)**
1. Quote posts & reposts
2. Thread replies
3. Mentions management
4. Webhooks for real-time updates

---

## 🧪 **Testing Checklist**

### **OAuth Flow**
- [ ] Test authorization URL generation
- [ ] Test callback with valid code
- [ ] Verify long-lived token exchange
- [ ] Test token refresh
- [ ] Test disconnect flow

### **Posting**
- [ ] Create text post
- [ ] Create post with image
- [ ] Schedule post for future
- [ ] Delete post
- [ ] Test rate limit handling (250 posts)

### **Background Jobs**
- [ ] Verify scheduled posts are published on time
- [ ] Test job error handling
- [ ] Verify token refresh job works

### **Error Scenarios**
- [ ] Invalid token
- [ ] Expired token
- [ ] Rate limit exceeded
- [ ] Invalid media URL
- [ ] Network errors

---

## 📝 **Environment Variables Needed**

```bash
# In backend/.env
THREADS_APP_ID=your_app_id_here
THREADS_APP_SECRET=your_app_secret_here
THREADS_REDIRECT_URI=https://omni-write-production.up.railway.app/api/auth/threads/callback
THREADS_DEFAULT_SCOPES=threads_basic,threads_content_publish
THREADS_SUCCESS_REDIRECT_URI=https://omni-write.vercel.app/profile
THREADS_FAILURE_REDIRECT_URI=https://omni-write.vercel.app/profile?error=threads_oauth_failed
```

**For local development:**
```bash
THREADS_REDIRECT_URI=http://localhost:3000/api/auth/threads/callback
THREADS_SUCCESS_REDIRECT_URI=http://localhost:5173/profile
THREADS_FAILURE_REDIRECT_URI=http://localhost:5173/profile?error=threads_oauth_failed
```

---

## 🚀 **Quick Start Guide**

### **1. Get Threads App Credentials**

1. Go to https://developers.facebook.com
2. Create a new app or use existing
3. Enable "Threads Use Case"
4. Get **Threads App ID** and **Threads App Secret** (NOT Facebook App ID!)
5. Add OAuth redirect URI: `https://omni-write-production.up.railway.app/api/auth/threads/callback`

### **2. Configure Environment Variables**

Add to Railway:
```bash
THREADS_APP_ID=123456789
THREADS_APP_SECRET=abc123xyz
THREADS_REDIRECT_URI=https://omni-write-production.up.railway.app/api/auth/threads/callback
THREADS_SUCCESS_REDIRECT_URI=https://omni-write.vercel.app/profile
```

### **3. Test OAuth Flow**

1. Navigate to: `https://omni-write-production.up.railway.app/api/auth/threads`
2. Authorize with your Threads account
3. Verify redirect back to profile page
4. Check database for new `SocialConnection` record

### **4. Test Posting**

```bash
curl -X POST https://omni-write-production.up.railway.app/api/threads/post \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello from Omni Write!"}'
```

---

## 🔗 **Useful Resources**

- [Threads API Documentation](https://developers.facebook.com/docs/threads)
- [Publishing API](https://developers.facebook.com/docs/threads/posts)
- [OAuth Guide](https://developers.facebook.com/docs/threads/get-started)
- [Rate Limits](https://developers.facebook.com/docs/threads/troubleshooting#rate-limits)
- [Insights API](https://developers.facebook.com/docs/threads/insights)

---

## ⚠️ **Known Limitations**

1. **Cannot show followers' timeline** - Threads API only allows displaying posts created by the authenticated user
2. **250 posts per 24 hours** - Shared across ALL apps the user has connected
3. **100 deletions per 24 hours** - Shared limit
4. **1,000 replies per 24 hours** - For comment/reply operations
5. **Short-lived tokens expire in 1 hour** - Must exchange for long-lived immediately (already implemented!)

---

**Last Updated:** November 1, 2025
