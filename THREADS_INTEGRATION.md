# Threads API Integration Guide

## Overview

This document provides a complete guide to the Threads API integration in Omni Write. Users can connect their Threads account, schedule posts, and automatically publish content to Threads.

---

## Table of Contents

1. [Features](#features)
2. [API Endpoints](#api-endpoints)
3. [Environment Variables](#environment-variables)
4. [OAuth Flow](#oauth-flow)
5. [Token Management](#token-management)
6. [Rate Limits](#rate-limits)
7. [Post Creation](#post-creation)
8. [Scheduling Posts](#scheduling-posts)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Features

- ✅ OAuth 2.0 authentication with Threads
- ✅ Automatic token exchange (short-lived → long-lived)
- ✅ Automatic token refresh before expiry
- ✅ Create text posts
- ✅ Create posts with images
- ✅ Create posts with videos
- ✅ Schedule posts for future publishing
- ✅ Delete posts
- ✅ View scheduled posts
- ✅ Cancel scheduled posts
- ✅ Rate limit handling

---

## API Endpoints

### Authentication & Connection

#### **Start Threads OAuth**
```
GET /api/auth/threads
```
- **Auth required:** Yes (Clerk)
- **Query params:**
  - `redirect` (optional) - URL to redirect after OAuth
  - `scope` (optional) - Custom scopes (default: `threads_basic,threads_content_publish`)
  - `mode` (optional) - Set to `json` to return JSON instead of redirect
- **Returns:** Redirects to Threads authorization page

#### **OAuth Callback**
```
GET /api/auth/threads/callback
```
- **Auth required:** No (validated via state)
- **Query params:**
  - `code` - Authorization code from Threads
  - `state` - OAuth state for security
- **Returns:** Redirects to success/failure URL with params

#### **Get Connection Info**
```
GET /api/threads/connection
```
- **Auth required:** Yes
- **Returns:** User's Threads connection details
```json
{
  "connection": {
    "id": "clxyz123...",
    "provider": "THREADS",
    "username": "johndoe",
    "providerUserId": "123456789",
    "accessTokenExpiresAt": "2025-12-31T00:00:00.000Z",
    "createdAt": "2025-11-01T00:00:00.000Z",
    "updatedAt": "2025-11-01T00:00:00.000Z"
  }
}
```

#### **Disconnect Threads**
```
DELETE /api/threads/connection
```
- **Auth required:** Yes
- **Returns:** `{ "status": "ok" }`

#### **Refresh Access Token**
```
POST /api/threads/refresh
```
- **Auth required:** Yes
- **Returns:** Updated connection with new token expiry

---

### Profile

#### **Get Current User Profile**
```
GET /api/threads/me
```
- **Auth required:** Yes
- **Returns:** Threads user profile
```json
{
  "data": {
    "id": "123456789",
    "username": "johndoe",
    "profile_picture_url": "https://...",
    "biography": "Software developer | Coffee enthusiast"
  }
}
```

---

### Posts

#### **Create Post Immediately**
```
POST /api/threads/post
```
- **Auth required:** Yes
- **Body:**
```json
{
  "text": "Hello Threads! 👋",
  "mediaUrl": "https://example.com/image.jpg" // optional
}
```
- **Returns:** Created post data
```json
{
  "data": {
    "id": "987654321",
    "creation_id": "123456789"
  }
}
```

#### **Delete Post**
```
DELETE /api/threads/post/:id
```
- **Auth required:** Yes
- **Params:** `id` - Threads post ID
- **Returns:** `{ "success": true }`

---

### Scheduled Posts

#### **Schedule a Post**
```
POST /api/threads/post/schedule
```
- **Auth required:** Yes
- **Body:**
```json
{
  "text": "Scheduled post content",
  "scheduledAt": "2025-12-01T12:00:00Z",
  "mediaUrl": "https://example.com/image.jpg" // optional
}
```
- **Returns:** Scheduled post details

#### **List Scheduled Posts**
```
GET /api/threads/post/schedule
```
- **Auth required:** Yes
- **Returns:** Array of user's scheduled Threads posts

#### **Cancel Scheduled Post**
```
DELETE /api/threads/post/schedule/:id
```
- **Auth required:** Yes
- **Params:** `id` - Scheduled post ID
- **Returns:** `{ "status": "ok" }`

---

## Environment Variables

### Required Variables

Add these to your `.env` file:

```bash
# Threads OAuth Configuration
THREADS_APP_ID=your_threads_app_id
THREADS_APP_SECRET=your_threads_app_secret
THREADS_REDIRECT_URI=https://yourdomain.com/api/auth/threads/callback

# Optional: Custom scopes (defaults to threads_basic,threads_content_publish)
THREADS_DEFAULT_SCOPES=threads_basic,threads_content_publish

# Optional: Success/failure redirect URIs
THREADS_SUCCESS_REDIRECT_URI=https://yourdomain.com/dashboard?threads=connected
THREADS_FAILURE_REDIRECT_URI=https://yourdomain.com/settings?threads=error
```

### Getting Your Threads App Credentials

1. Go to [Meta Developers](https://developers.facebook.com/)
2. Create or select your app
3. Add "Threads" use case
4. Navigate to **Threads > Settings**
5. Note: You'll see **TWO** app IDs and secrets (Instagram + Threads)
   - ⚠️ **Use the THREADS App ID and App Secret** (not Instagram)
6. Add your redirect URI to **Valid OAuth Redirect URIs**
7. Copy the **Threads App ID** and **App Secret**

---

## OAuth Flow

### Step-by-Step Process

1. **User clicks "Connect Threads"** in your app
2. **Backend generates authorization URL** with:
   - `client_id` - Your Threads App ID
   - `redirect_uri` - Callback URL
   - `scope` - Permissions (threads_basic, threads_content_publish)
   - `response_type=code`
   - `state` - Security token
3. **User authorizes** on Threads website
4. **Threads redirects back** with authorization code
5. **Backend exchanges code** for short-lived token (1 hour)
6. **Backend automatically exchanges** short-lived token for long-lived token (60 days)
7. **Backend stores** long-lived token in database
8. **User redirected** to success page

### Security Features

- **PKCE-style state validation** - Prevents CSRF attacks
- **Unique constraint** - One Threads account per Omni Write user
- **Automatic token refresh** - Tokens refreshed before expiry
- **Secure storage** - Tokens encrypted in database

---

## Token Management

### Token Lifecycle

```
Authorization Code (5 min)
  ↓ Exchange
Short-Lived Token (1 hour)
  ↓ Exchange (automatic)
Long-Lived Token (60 days)
  ↓ Refresh (automatic)
New Long-Lived Token (60 days)
```

### Automatic Token Refresh

The system includes automatic token refresh:

1. **Background job checks** tokens nearing expiry (< 7 days)
2. **Calls refresh endpoint** to get new token
3. **Updates database** with new token and expiry
4. **No user interaction needed**

### Manual Token Refresh

If needed, users can manually refresh:

```bash
POST /api/threads/refresh
Authorization: Bearer <clerk-token>
```

---

## Rate Limits

Threads enforces strict rate limits **across all apps** for a user:

| Action | Limit | Period |
|--------|-------|--------|
| Posts | 250 | 24 hours |
| Replies | 1,000 | 24 hours |
| Deletions | 100 | 24 hours |

### Important Notes

- **Limits are per user, not per app**
  - If a user posts 100 times via Omni Write and 150 times via another app, they've used 250/250
- **Moving 24-hour window**
  - Not reset at midnight, but calculated from current time minus 24 hours
- **Rate limit errors** return HTTP 429 with `retry-after` header

### Handling Rate Limits

The service automatically includes rate limit info in error messages:

```javascript
// Error message includes retry time
"Rate limited by Threads API (retry after: 3600). Post limit: 250/24h"
```

---

## Post Creation

### Text-Only Post

```javascript
POST /api/threads/post
Content-Type: application/json

{
  "text": "Hello Threads! This is my first post from Omni Write 🚀"
}
```

### Post with Image

```javascript
POST /api/threads/post
Content-Type: application/json

{
  "text": "Check out this amazing view! 🌅",
  "mediaUrl": "https://example.com/sunset.jpg"
}
```

### Post Types Supported

- **TEXT** - Text-only posts (default)
- **IMAGE** - Text + image
- **VIDEO** - Text + video
- **CAROUSEL** - Multiple images (future support)

### Post Content Limits

- **Text length:** Up to 500 characters
- **Links:** Automatically detected and clickable
- **Mentions:** Use `@username` format
- **Hashtags:** Use `#hashtag` format

---

## Scheduling Posts

### How It Works

1. User creates a scheduled post
2. Post saved to database with `QUEUED` status
3. Background job runs every 30 seconds
4. Job checks for posts where `scheduledAt <= now`
5. Job publishes posts automatically
6. Status updated to `POSTED` or `FAILED`

### Scheduling Example

```javascript
// Schedule a post for tomorrow at 9 AM
POST /api/threads/post/schedule

{
  "text": "Good morning! ☀️ #MondayMotivation",
  "scheduledAt": "2025-11-02T09:00:00Z"
}
```

### Canceling Scheduled Posts

```javascript
// Cancel before it posts
DELETE /api/threads/post/schedule/clxyz123...
```

Note: Can only cancel posts with `QUEUED` status.

---

## Testing

### Local Testing Setup

1. **Install ngrok** (for local OAuth callback):
```bash
npm install -g ngrok
ngrok http 3000
```

2. **Update environment variables**:
```bash
THREADS_REDIRECT_URI=https://your-ngrok-url.ngrok.io/api/auth/threads/callback
```

3. **Add ngrok URL to Meta Developer Console**:
   - Valid OAuth Redirect URIs: `https://your-ngrok-url.ngrok.io/api/auth/threads/callback`

4. **Start backend**:
```bash
cd backend
npm run dev
```

### Testing OAuth Flow

```bash
# 1. Start OAuth (will return authorization URL)
curl http://localhost:3000/api/auth/threads?mode=json \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"

# 2. Visit the authorization URL in browser
# 3. Authorize the app
# 4. Get redirected to callback URL
# 5. Check database for new connection
```

### Testing Post Creation

```bash
# Create a post
curl -X POST http://localhost:3000/api/threads/post \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Test post from Omni Write API!"
  }'
```

### Testing Scheduled Posts

```bash
# Schedule a post for 1 minute from now
curl -X POST http://localhost:3000/api/threads/post/schedule \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Scheduled test post",
    "scheduledAt": "'$(date -u -v+1M +"%Y-%m-%dT%H:%M:%SZ")'"
  }'

# Wait 1-2 minutes and check if it posted
curl http://localhost:3000/api/threads/post/schedule \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

---

## Troubleshooting

### Common Issues

#### **1. "Threads API env missing"**

**Cause:** Missing environment variables

**Fix:**
```bash
# Check .env file has:
THREADS_APP_ID=...
THREADS_APP_SECRET=...
THREADS_REDIRECT_URI=...
```

#### **2. "Invalid or expired OAuth state"**

**Cause:** State token expired or tampered

**Fix:**
- Restart OAuth flow
- Check server time is synchronized
- Ensure state is not being modified

#### **3. "This Threads account is already connected to another user"**

**Cause:** Threads account already linked to different Omni Write user

**Fix:**
- Disconnect from other account first
- Or use a different Threads account

#### **4. "Rate limited by Threads API"**

**Cause:** Exceeded Threads rate limits

**Fix:**
- Wait until retry-after time
- Check total posts across all apps
- Reduce posting frequency

#### **5. "Threads token exchange failed"**

**Cause:** Invalid authorization code or configuration

**Fix:**
- Verify THREADS_APP_ID and THREADS_APP_SECRET
- Check authorization code not expired (5 minutes)
- Ensure redirect URI matches exactly

#### **6. "Unable to get Threads user ID"**

**Cause:** Token doesn't have required permissions

**Fix:**
- Re-authorize with correct scopes
- Ensure `threads_basic` permission is granted

---

## Database Schema

### SocialConnection Model

```prisma
model SocialConnection {
  id                   String    @id @default(cuid())
  provider             String    // "THREADS"
  providerUserId       String    // Threads user ID
  accessToken          String    @db.Text
  accessTokenExpiresAt DateTime?
  refreshToken         String?   @db.Text
  username             String?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  userId               String
  user                 User      @relation(fields: [userId], references: [id])
  
  @@unique([provider, providerUserId])
  @@unique([provider, userId])
}
```

### ScheduledTweet Model

```prisma
model ScheduledTweet {
  id            String                @id @default(cuid())
  userId        String
  provider      String                @default("X")
  text          String
  scheduledAt   DateTime
  status        ScheduledTweetStatus  @default(QUEUED)
  postedTweetId String?
  errorMessage  String?               @db.Text
  createdAt     DateTime              @default(now())
  updatedAt     DateTime              @updatedAt
  user          User                  @relation(fields: [userId], references: [id])
}
```

---

## Architecture

### Service Layer (`threads.service.js`)

- OAuth URL generation
- Token exchange (code → short-lived → long-lived)
- Token refresh
- Profile fetching
- Post creation (text, image, video)
- Post deletion
- Rate limit handling

### Routes Layer (`threads.routes.js`)

- `/api/auth/threads` - Start OAuth
- `/api/auth/threads/callback` - OAuth callback
- `/api/threads/connection` - Manage connection
- `/api/threads/refresh` - Refresh token
- `/api/threads/me` - Get profile
- `/api/threads/post` - Create/delete posts
- `/api/threads/post/schedule` - Schedule posts

### Background Jobs (`processScheduledTweets.js`)

- `processDueThreadsPosts()` - Publishes scheduled Threads posts every 30 seconds

---

## Best Practices

### 1. Token Management

- ✅ Always use long-lived tokens (60 days)
- ✅ Refresh tokens before they expire (< 7 days remaining)
- ✅ Handle token refresh failures gracefully
- ✅ Store tokens securely (encrypted at rest)

### 2. Rate Limiting

- ✅ Track post count locally to avoid hitting limits
- ✅ Implement exponential backoff on 429 errors
- ✅ Show users their daily post quota
- ✅ Queue posts if approaching limits

### 3. Error Handling

- ✅ Catch and log all API errors
- ✅ Provide user-friendly error messages
- ✅ Implement retry logic for transient errors
- ✅ Mark scheduled posts as FAILED with error message

### 4. Scheduling

- ✅ Validate `scheduledAt` is in the future
- ✅ Check user's Threads connection before scheduling
- ✅ Allow canceling only QUEUED posts
- ✅ Store posted IDs for reference

---

## Resources

- [Threads API Documentation](https://developers.facebook.com/docs/threads)
- [Meta Developer Portal](https://developers.facebook.com/)
- [Threads OAuth Guide](https://developers.facebook.com/docs/threads/get-started)
- [Threads Publishing API](https://developers.facebook.com/docs/threads/posts)

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review Meta's [Threads API Docs](https://developers.facebook.com/docs/threads)
3. Open an issue on GitHub

---

**Last Updated:** November 1, 2025
**Version:** 1.0.0

