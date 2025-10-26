# Omni Write - Code Reference Guide

**Generated:** October 25, 2025

---

## Key Code Files & Locations

### Backend Routes

#### Health Check Route
**File:** `/backend/src/routes/health.routes.js`
**Status:** Implemented
**Endpoint:** `GET /api/health`
**Purpose:** Server health verification

#### Clerk Webhook Handler
**File:** `/backend/src/routes/webhook.routes.js`  
**Status:** Fully Implemented (Post-development)
**Endpoint:** `POST /api/webhooks/clerk`
**Purpose:** Syncs users from Clerk to database
**Handles:**
- `user.created` - Creates new user in database
- `user.updated` - Updates user information
- `user.deleted` - Removes user from database

**Features:**
- Svix signature verification for security
- Comprehensive error handling
- Detailed logging with emojis
- Handles Clerk test events gracefully

### Backend Services

#### User Service Layer
**File:** `/backend/src/services/user.service.js`
**Status:** Fully Implemented
**Functions:**
- `createUser(clerkId, email, name)` - Create user in database
- `updateUser(clerkId, updateData)` - Update user fields
- `deleteUser(clerkId)` - Remove user from database
- `findUserByClerkId(clerkId)` - Query user by Clerk ID
- `findUserByEmail(email)` - Query user by email
- All functions include error handling and logging

### Backend Server

#### Express Server
**File:** `/backend/src/server.js`
**Status:** Implemented
**Port:** 3000/3001
**Features:**
- Express.js v5.1.0
- Raw body parsing for webhooks
- JSON/URL-encoded middleware
- Error handling middleware
- SIGTERM graceful shutdown
- Health check endpoint
- Root status endpoint

### Frontend Entry Point

#### React Application
**File:** `/frontend/src/main.jsx`
**Status:** Implemented
**Setup:**
- ClerkProvider wrapping app
- Environment variable validation
- Error handling for missing Clerk key
- Strict mode enabled

#### Main App Component
**File:** `/frontend/src/App.jsx`
**Status:** Partially Implemented (UI only)
**Features:**
- Clerk useUser hook
- Loading state handling
- Navigation bar with logo
- SignIn/SignUp buttons (Clerk components)
- UserButton for logged-in users
- Welcome page for logged-out state
- User profile display for logged-in state
- Tailwind CSS styling
- Mobile responsive design

### Database

#### Prisma Schema
**File:** `/backend/prisma/schema.prisma`
**Status:** User model implemented only
**Models Defined (Not Implemented):**
- User (IMPLEMENTED)
- SocialAccount (schema only)
- Post (schema only)
- PostSocialAccount (schema only)
- Hashtag (schema only)
- Analytics (schema only)
- UserWritingProfile (schema only)

#### User Model (Current)
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

---

## Configuration Files

### Frontend

#### Vite Configuration
**File:** `/frontend/vite.config.js`
**Status:** Configured
**Framework:** Vite 7.1.7
**React Plugin:** Enabled

#### Tailwind Configuration
**File:** `/frontend/tailwind.config.js`
**Status:** Configured
**Version:** v4.1.16
**Theme:** Default with extensions

#### PostCSS Configuration
**File:** `/frontend/postcss.config.js`
**Status:** Configured (Tailwind v4)
**Plugins:** tailwindcss, autoprefixer

#### ESLint Configuration
**File:** `/frontend/eslint.config.js`
**Status:** Configured
**Rules:** JavaScript/React rules

#### Vercel Configuration
**File:** `/frontend/vercel.json`
**Status:** Configured
**Features:**
- Build: `npm run build`
- Framework: Vite
- Output: dist/
- SPA routing rewrites
- Asset caching headers
- Dev command: `npm run dev`

#### Vercel Ignore
**File:** `/frontend/.vercelignore`
**Status:** Configured
**Excludes:** node_modules, .env, etc.

### Backend

#### Nodemon Configuration
**File:** `/backend/nodemon.json`
**Status:** Configured
**Watch:** src/ directory
**Ignore:** node_modules, .env

#### Railway Configuration
**File:** `/backend/railway.json`
**Status:** Configured
**Builder:** NIXPACKS
**Build:** `npm install && npx prisma generate`
**Start:** `npm start`
**Restart Policy:** ON_FAILURE (10 retries)

#### Procfile
**File:** `/backend/Procfile`
**Status:** Configured
**Process:** `web: npm start`

---

## Package Dependencies

### Backend (Express Server)

**Package.json Location:** `/backend/package.json`

**Dependencies:**
- @prisma/client: ^6.18.0
- express: ^5.1.0
- prisma: ^6.18.0
- svix: ^1.80.0

**Dev Dependencies:**
- axios: ^1.12.2 (for testing)
- nodemon: ^3.1.10

**Scripts:**
- `npm run dev` - Start with nodemon
- `npm start` - Production start
- `npm test` - Test script

### Frontend (React App)

**Package.json Location:** `/frontend/package.json`

**Dependencies:**
- @clerk/clerk-react: ^5.53.3
- @prisma/client: ^6.18.0
- @prisma/extension-accelerate: ^2.0.2
- prisma: ^6.18.0
- react: ^19.1.1
- react-dom: ^19.1.1

**Dev Dependencies:**
- @eslint/js: ^9.36.0
- @tailwindcss/postcss: ^4.1.16
- @types/react: ^19.1.16
- @types/react-dom: ^19.1.9
- @vitejs/plugin-react: ^5.0.4
- autoprefixer: ^10.4.21
- eslint: ^9.36.0
- eslint-plugin-react-hooks: ^5.2.0
- eslint-plugin-react-refresh: ^0.4.22
- globals: ^16.4.0
- postcss: ^8.5.6
- tailwindcss: ^4.1.16
- vite: ^7.1.7

**Scripts:**
- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run lint` - Run linter
- `npm run preview` - Preview production build

---

## Environment Variables

### Backend (.env)

**Required Variables:**
```env
DATABASE_URL=postgresql://user:password@host:port/database
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_... (needed for production)
REDIS_URL=redis://host:port (configured, not used yet)
PORT=3001 (optional, default 3000)
HOST=0.0.0.0 (optional, default localhost)
```

**Template File:** `/backend/.env.example`

### Frontend (.env.local)

**Required Variables:**
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

**Note:** Variables must be prefixed with `VITE_` to be accessible in Vite frontend

---

## API Endpoints Implemented

### Currently Available

```
GET /api/health
- Response: { status: 'ok' }
- Purpose: Server health check

POST /api/webhooks/clerk
- Auth: Svix signature verification
- Purpose: Receive Clerk user events
- Handles: user.created, user.updated, user.deleted

GET /
- Response: { message, status, timestamp }
- Purpose: API status
```

### Still Needed

```
User Profile Endpoints:
- GET /api/users/me
- PATCH /api/users/me
- DELETE /api/users/me

Posts API (Phase 3):
- POST /api/posts
- GET /api/posts
- GET /api/posts/:id
- PATCH /api/posts/:id
- DELETE /api/posts/:id

Social Accounts (Phase 2):
- POST /api/social-accounts
- GET /api/social-accounts
- DELETE /api/social-accounts/:id

And many more in Phases 4-9...
```

---

## Folder Structure

### Backend Source
```
backend/src/
├── server.js              # Express app entry point
├── routes/
│   ├── health.routes.js   # Health check endpoint
│   └── webhook.routes.js  # Clerk webhook handler
├── services/
│   └── user.service.js    # User database operations
├── controllers/           # (Empty, ready for implementation)
├── middleware/            # (Empty, ready for implementation)
├── jobs/                  # (Empty, ready for implementation)
└── generated/prisma/      # Auto-generated Prisma client
```

### Frontend Source
```
frontend/src/
├── main.jsx               # React entry with Clerk provider
├── App.jsx                # Main component with auth UI
├── index.css              # Tailwind styles
├── App.css                # Component styles
├── components/            # (Empty, ready for components)
├── pages/                 # (Empty, ready for pages)
├── services/              # (Empty, ready for API services)
├── utils/                 # (Empty, ready for utilities)
└── assets/                # Static files
```

---

## Key Technologies & Versions

### Core Stack
- Node.js: 20+ (recommended)
- Express.js: 5.1.0
- React: 19.1.1
- Vite: 7.1.7
- PostgreSQL: Supabase
- Prisma: 6.18.0

### Authentication
- Clerk: 5.53.3
- Svix: 1.80.0 (webhook verification)

### Styling
- Tailwind CSS: 4.1.16
- PostCSS: 8.5.6
- Autoprefixer: 10.4.21

### Development
- ESLint: 9.36.0
- Nodemon: 3.1.10
- Vite: 7.1.7

### Not Yet Integrated
- Bull: (Redis queue, planned Phase 4)
- Claude API SDK: (planned Phase 5)
- Social Media APIs: (planned Phase 2)

---

## Git Information

**Repository:** https://github.com/manojaug10/omni-write
**Current Branch:** main

### Recent Commits
1. `ed1f47b` - Add comprehensive webhook debugging tools
2. `ae6140b` - Add full payload logging
3. `3fa8b7e` - Fix webhook for test events
4. `4715635` - Fix Clerk webhook errors
5. `2ccb9c6` - Repo cleanup

### Deployment Status
- **Frontend:** Ready on Vercel (not deployed)
- **Backend:** Ready on Railway (not deployed)
- **Database:** Live on Supabase
- **Redis:** Configured but not used

---

## What's NOT in the Code Yet

### High Priority (Phase 1-2)
- Dashboard page component
- Protected route wrapper
- User profile endpoints
- Social media OAuth implementations
- Post model and storage

### Medium Priority (Phase 3-5)
- Rich text editor
- Post composer component
- Scheduling system (Bull queue)
- Calendar component
- AI/Claude API integration
- Quiz component for user style

### Lower Priority (Phase 6-9)
- Analytics collection and display
- Hashtag management system
- Advanced features
- Testing suite
- Production monitoring (Sentry)
- Landing page

---

## Running the Application

### Local Development

**Backend:**
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:3001
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### Building for Production

**Backend:**
```bash
npm run build  # Not needed for Node.js
npm start
```

**Frontend:**
```bash
npm run build
npm run preview
```

### Environment Setup

1. Create `.env` file in backend/ with required variables
2. Create `.env.local` file in frontend/ with VITE_CLERK_PUBLISHABLE_KEY
3. Ensure DATABASE_URL points to your Supabase database
4. Get Clerk keys from clerk.com dashboard

---

## Testing the Webhook

**File:** `/backend/test-webhook.js`
**Status:** Documentation created (not yet implemented)
**Purpose:** Test webhook endpoint with sample events

---

## Next Development Priorities

1. **Phase 1 Completion:**
   - Dashboard component (10+ hours)
   - Protected routes (8+ hours)
   - Profile endpoints (5+ hours)

2. **Phase 2 Start:**
   - Social Media OAuth (20+ hours)

3. **Phase 3 Start:**
   - Post composer (15+ hours)

---

**Generated By:** Claude (Anthropic)
**Analysis Date:** October 25, 2025

