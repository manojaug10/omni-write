# Deployment Guide - Omni Write MVP

This guide covers deploying the Omni Write application using Vercel (frontend) and Railway (backend).

---

## Architecture Overview

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │         │   Backend    │         │  Database   │
│   (Vercel)  │────────▶│  (Railway)   │────────▶│ (Supabase)  │
│   React     │   API   │   Express    │  Query  │ PostgreSQL  │
└─────────────┘         └──────────────┘         └─────────────┘
                               │
                               │
                        ┌──────▼──────┐
                        │    Redis    │
                        │  (Cloud)    │
                        └─────────────┘
```

---

## Prerequisites

- GitHub account with repository access
- Vercel account (free tier works)
- Railway account (free tier works)
- Supabase database already configured
- Redis Cloud instance already configured

---

## Part 1: Backend Deployment (Railway)

### Step 1: Create Railway Project

1. Go to [Railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository: `manojaug10/omni-write`
5. Railway will auto-detect the monorepo structure

### Step 2: Configure Backend Service

1. Click **"Add Service"** → **"GitHub Repo"**
2. Set **Root Directory**: `backend`
3. Railway will detect the `railway.json` configuration

### Step 3: Set Environment Variables

Add the following environment variables in Railway dashboard:

```env
# Database
DATABASE_URL=postgresql://postgres:D0%7B%60wq%3E2K4~mK%5E%3F~%3Ap%24W@db.jesvkdkkkbbxocvyaidn.supabase.co:5432/postgres

# Authentication
CLERK_PUBLISHABLE_KEY=pk_test_Y2xhc3NpYy1rb2FsYS02Ny5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_vlGfgcrKbWmj95OtkGwa86hMTSDUVqb4ZgYrs6paop

# Caching
REDIS_URL=redis://redis-16036.c16.us-east-1-2.ec2.redns.redis-cloud.com:16036

# Server
PORT=3000
NODE_ENV=production
```

### Step 4: Deploy

1. Railway will automatically build and deploy
2. Build process will:
   - Install npm dependencies
   - Generate Prisma Client
   - Push database schema (if needed)
   - Start the Express server

3. Once deployed, Railway will provide a URL like:
   - `https://omni-write-backend.up.railway.app`

### Step 5: Verify Backend Deployment

Test the health endpoint:
```bash
curl https://your-backend-url.railway.app/api/health
```

Expected response:
```json
{
  "status": "ok"
}
```

---

## Part 2: Frontend Deployment (Vercel)

### Step 1: Create Vercel Project

1. Go to [Vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository: `manojaug10/omni-write`
4. Vercel will auto-detect the monorepo structure

### Step 2: Configure Frontend Service

1. **Framework Preset**: Vite
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build` (auto-detected)
4. **Output Directory**: `dist` (auto-detected)
5. **Install Command**: `npm install` (auto-detected)

### Step 3: Set Environment Variables

Add the following environment variables in Vercel dashboard:

```env
# Backend API URL (use your Railway backend URL)
VITE_API_URL=https://your-backend-url.railway.app

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2xhc3NpYy1rb2FsYS02Ny5jbGVyay5hY2NvdW50cy5kZXYk
```

**Important:** All frontend env vars must be prefixed with `VITE_` to be available in the browser.

### Step 4: Deploy

1. Click **"Deploy"**
2. Vercel will:
   - Install dependencies
   - Build the React app with Vite
   - Deploy to CDN
   - Provide a production URL

3. Your frontend will be available at:
   - `https://omni-write.vercel.app` (or custom domain)

### Step 5: Verify Frontend Deployment

1. Visit your Vercel URL
2. Check browser console for errors
3. Verify API calls reach Railway backend

---

## Part 3: Connect Frontend to Backend

### Update CORS in Backend

You'll need to add CORS middleware to your Express backend to allow Vercel frontend requests.

**File:** `backend/src/server.js`

```javascript
// Add this after installing: npm install cors
const cors = require('cors');

const app = express();

// Configure CORS
app.use(cors({
  origin: [
    'http://localhost:5173', // Local development
    'https://omni-write.vercel.app', // Production frontend
    'https://*.vercel.app' // Vercel preview deployments
  ],
  credentials: true
}));
```

---

## Part 4: Configure Custom Domains (Optional)

### Vercel Custom Domain

1. Go to **Project Settings** → **Domains**
2. Add your custom domain (e.g., `omniwrite.com`)
3. Configure DNS records as instructed by Vercel
4. Vercel auto-provisions SSL certificates

### Railway Custom Domain

1. Go to **Settings** → **Domains**
2. Add custom domain (e.g., `api.omniwrite.com`)
3. Add CNAME record pointing to Railway
4. Railway auto-provisions SSL certificates

---

## Deployment Configuration Files

### Frontend: `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Backend: `railway.json`
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npx prisma generate"
  },
  "deploy": {
    "startCommand": "npx prisma db push && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Backend: `Procfile`
```
web: npm start
```

---

## Environment Variables Summary

### Backend (Railway)
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `CLERK_PUBLISHABLE_KEY` | Clerk public key | `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk secret key | `sk_test_...` |
| `REDIS_URL` | Redis connection string | `redis://...` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `production` |

### Frontend (Vercel)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://api.omniwrite.com` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk public key | `pk_test_...` |

---

## Continuous Deployment

Both Vercel and Railway support automatic deployments:

### Automatic Deployments
- **Main Branch**: Deploys to production automatically
- **Feature Branches**: Creates preview deployments
- **Pull Requests**: Deploys preview for testing

### Manual Deployments
```bash
# Vercel CLI
npm i -g vercel
cd frontend
vercel --prod

# Railway CLI
npm i -g @railway/cli
cd backend
railway up
```

---

## Monitoring & Logs

### Vercel Logs
1. Go to **Deployments** tab
2. Click on a deployment
3. View **Build Logs** and **Function Logs**

### Railway Logs
1. Go to your service
2. Click **Deployments** tab
3. View real-time logs
4. Use filters to search logs

---

## Troubleshooting

### Frontend Issues

**Build Failures:**
```bash
# Check Vercel build logs
# Common issues:
- Missing environment variables
- Node version mismatch
- Missing dependencies
```

**API Connection Errors:**
```bash
# Verify VITE_API_URL is correct
# Check CORS configuration in backend
# Verify backend is running
```

### Backend Issues

**Database Connection Errors:**
```bash
# Verify DATABASE_URL is correct
# Check Supabase database is accessible
# Ensure URL-encoded special characters
```

**Prisma Client Errors:**
```bash
# Ensure `npx prisma generate` runs in build
# Check railway.json buildCommand
```

**Port Issues:**
```bash
# Railway auto-assigns PORT variable
# Ensure server uses process.env.PORT
```

---

## Rollback Strategy

### Vercel Rollback
1. Go to **Deployments**
2. Find previous working deployment
3. Click **"⋮"** → **"Promote to Production"**

### Railway Rollback
1. Go to **Deployments**
2. Select previous deployment
3. Click **"Redeploy"**

---

## Security Checklist

- [ ] All environment variables are set correctly
- [ ] `.env` files are in `.gitignore`
- [ ] CORS is configured properly
- [ ] Database credentials are URL-encoded
- [ ] Clerk keys are for correct environment
- [ ] HTTPS is enabled (auto by Vercel/Railway)
- [ ] Sensitive data not committed to git

---

## Cost Estimation

### Free Tier Limits

**Vercel (Free Tier):**
- 100 GB bandwidth/month
- Unlimited deployments
- 100 GB-hours serverless execution

**Railway (Free Tier):**
- $5 credit/month
- ~500 hours of runtime
- Sleeps after 30min inactivity

**Recommendations:**
- Start with free tiers
- Monitor usage in dashboards
- Upgrade when needed

---

## Next Steps After Deployment

1. **Set up monitoring**
   - Add error tracking (Sentry)
   - Set up uptime monitoring (UptimeRobot)

2. **Configure CI/CD**
   - Add automated tests
   - Set up deployment previews

3. **Performance optimization**
   - Enable Vercel Edge Network
   - Add Redis caching

4. **Production readiness**
   - Add rate limiting
   - Implement logging
   - Set up database backups

---

## Support & Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Prisma Production Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)

---

---

## Currently Deployed Features

### Phase 1: Authentication & User Management ✅
- Clerk authentication with sign-in/sign-up flows
- User profile management
- Protected routes
- User database sync via webhooks

### Phase 2: X (Twitter) API Integration (45% Complete) ✅
**OAuth & Connection Management:**
- OAuth 2.0 with PKCE authentication
- Connect/disconnect X accounts
- Token refresh mechanism
- Rate limit handling

**Single Tweet Features:**
- Post immediate tweets
- Schedule tweets for future posting
- View scheduled tweets list
- Cancel scheduled tweets (before posting)
- Delete published tweets (after posting)

**Thread Posting Features (Added October 30, 2025):**
- Post immediate threads (multi-tweet)
- Schedule threads for future posting
- Background auto-posting of threads
- Thread chaining with `in_reply_to_tweet_id`
- View scheduled threads list
- Cancel scheduled threads (before posting)

**Backend Implementation:**
- `postThread()` service method with reply chaining
- `ScheduledThread` database model
- Thread scheduling API endpoints
- Background job processor (`processDueThreads()`)

**Frontend Implementation:**
- Toggle UI (Tweet/Thread modes)
- Thread composition with numbered inputs
- Add/remove tweet functionality
- Visual thread connectors
- Scheduled threads display

### Phase 4: Scheduling System (85% Complete) ✅
- Background job system (30-second interval)
- Status tracking (QUEUED, POSTED, FAILED, CANCELLED)
- Auto-post tweets and threads at scheduled time
- Error handling and retry logic
- Complete scheduling UI

---

## Production Environment Variables

### Backend (Railway) - Updated

Add these environment variables in Railway dashboard:

```env
# Database
DATABASE_URL=postgresql://postgres:password@host:5432/postgres?pgbouncer=true
DIRECT_DATABASE_URL=postgresql://postgres:password@host:5432/postgres

# Authentication
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# X (Twitter) API
X_CLIENT_ID=your_x_client_id
X_CLIENT_SECRET=your_x_client_secret
X_REDIRECT_URI=https://your-backend-url.railway.app/api/x/callback
X_DEFAULT_SCOPES=tweet.read tweet.write users.read offline.access

# Caching
REDIS_URL=redis://redis-host:port

# Server
PORT=3000
NODE_ENV=production
```

**Important Notes:**
- `DIRECT_DATABASE_URL` is required for Prisma migrations (without pgbouncer)
- `CLERK_WEBHOOK_SECRET` is required for user sync
- X API credentials are required for social media posting
- All X scopes are necessary for full functionality

---

## API Endpoints Reference

### Authentication
- `POST /api/webhooks/clerk` - Clerk user sync webhook

### User Management
- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me` - Update user profile
- `DELETE /api/users/me` - Delete user account

### X (Twitter) Integration

**OAuth:**
- `GET /api/x/authorize` - Start X OAuth flow
- `GET /api/x/callback` - OAuth callback handler
- `GET /api/x/profile` - Get X user profile
- `GET /api/social-connections` - List connected accounts
- `DELETE /api/social-connections/X` - Disconnect X account

**Single Tweets:**
- `POST /api/x/tweet` - Post immediate tweet
- `POST /api/x/tweet/schedule` - Schedule a tweet
- `GET /api/x/tweet/schedule` - List scheduled tweets
- `DELETE /api/x/tweet/schedule/:id` - Cancel scheduled tweet
- `DELETE /api/x/tweet/:id` - Delete published tweet

**Thread Posting:**
- `POST /api/x/thread` - Post immediate thread
- `POST /api/x/thread/schedule` - Schedule a thread
- `GET /api/x/thread/schedule` - List scheduled threads
- `DELETE /api/x/thread/schedule/:id` - Cancel scheduled thread

---

## Database Schema

### Core Models

**User:**
```prisma
model User {
  id              String            @id @default(cuid())
  clerkId         String            @unique
  email           String            @unique
  name            String?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  connections     SocialConnection[]
  scheduledTweets ScheduledTweet[]
  scheduledThreads ScheduledThread[]
}
```

**SocialConnection:**
```prisma
model SocialConnection {
  id           String   @id @default(cuid())
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId       String
  provider     String
  accessToken  String   @db.Text
  refreshToken String?  @db.Text
  expiresAt    DateTime?
  providerUserId String?
  providerUsername String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([userId, provider])
}
```

**ScheduledTweet:**
```prisma
model ScheduledTweet {
  id           String              @id @default(cuid())
  user         User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId       String
  provider     String              @default("X")
  text         String              @db.Text
  scheduledAt  DateTime
  status       ScheduledTweetStatus @default(QUEUED)
  postedTweetId String?
  errorMessage String?             @db.Text
  createdAt    DateTime            @default(now())
  updatedAt    DateTime            @updatedAt
}
```

**ScheduledThread:**
```prisma
model ScheduledThread {
  id             String                @id @default(cuid())
  user           User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId         String
  provider       String                @default("X")
  tweets         String[]              // Array of tweet texts
  scheduledAt    DateTime
  status         ScheduledThreadStatus @default(QUEUED)
  postedThreadId String?               // First tweet ID
  postedTweetIds String[]              // All tweet IDs
  errorMessage   String?               @db.Text
  createdAt      DateTime              @default(now())
  updatedAt      DateTime              @updatedAt
}
```

---

## Background Jobs

The backend runs two background jobs on a 30-second interval:

**1. Process Scheduled Tweets (`processDueTweets`)**
- Checks for tweets with `scheduledAt <= now()`
- Posts tweets using X API
- Updates status to POSTED or FAILED
- Stores `postedTweetId` on success

**2. Process Scheduled Threads (`processDueThreads`)**
- Checks for threads with `scheduledAt <= now()`
- Posts threads using X API with reply chaining
- Updates status to POSTED or FAILED
- Stores `postedThreadId` and `postedTweetIds` array on success

**Job Configuration:**
```javascript
// backend/src/server.js
setInterval(async () => {
  await processScheduledTweets();
}, 30 * 1000); // Every 30 seconds
```

---

**Last Updated:** October 30, 2025
