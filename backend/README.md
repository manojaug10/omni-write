# Backend API

Express.js backend with Prisma ORM for database access.

## Getting Started

### Installation

```bash
npm install
```

### Running the Server

#### Development Mode (with auto-restart)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

### Testing the Health Endpoint

Once the server is running, you can test the health endpoint:

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok"
}
```

## Project Structure

### `/src/routes`
**Purpose**: Define API route handlers and endpoints.

This folder contains route definitions that map HTTP requests to controller functions. Routes should be organized by feature or resource (e.g., `user.routes.js`, `product.routes.js`). Each route file typically exports an Express router.

**Example**: `health.routes.js` defines the `/health` endpoint.

### `/src/controllers`
**Purpose**: Handle request/response logic.

Controllers receive requests from routes, process them (usually by calling services), and send responses back to the client. They contain the business logic for handling HTTP requests and should be thin, delegating complex operations to services.

**Example**: A `userController.js` would handle user-related requests like registration, login, profile updates.

### `/src/services`
**Purpose**: Contain business logic and data operations.

Services encapsulate the core business logic of your application. They interact with the database through Prisma, perform data transformations, calculations, and other operations. Services can be called from controllers or other services.

**Example**: A `userService.js` would contain functions like `createUser()`, `getUserById()`, `updateUserProfile()`.

### `/src/middleware`
**Purpose**: Process requests before they reach controllers.

Middleware functions execute during the request-response cycle before reaching the final route handler. Common use cases include authentication, authorization, request validation, logging, error handling, and rate limiting.

**Example**: `auth.middleware.js` for verifying JWT tokens, `validate.middleware.js` for request validation.

### `/src/jobs`
**Purpose**: Background tasks and scheduled jobs.

This folder contains scripts for background processing, scheduled tasks (cron jobs), queue workers, and long-running operations that shouldn't block HTTP requests. These might include sending emails, generating reports, cleaning up old data, etc.

**Example**: `emailJob.js` for sending bulk emails, `cleanupJob.js` for removing expired sessions.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"

# X (Twitter) OAuth 2.0 (Production)
X_CLIENT_ID="your-x-client-id"
X_CLIENT_SECRET="your-x-client-secret"
X_REDIRECT_URI="https://omni-write-production.up.railway.app/api/auth/x/callback"
X_DEFAULT_SCOPES="tweet.read users.read offline.access"
X_SUCCESS_REDIRECT_URI="https://omni-write.vercel.app/profile"
X_FAILURE_REDIRECT_URI="https://omni-write.vercel.app/profile"
X_AUTH_BASE="https://twitter.com/i/oauth2/authorize"
X_TOKEN_URL="https://api.twitter.com/2/oauth2/token"
X_API_BASE="https://api.twitter.com/2"
```

## X (Twitter) OAuth Setup

1. **Register the app in the X Developer Portal**
   - Create a project/app, enable OAuth 2.0 with PKCE, and set required scopes.
   - Add the redirect URI `X_REDIRECT_URI`:
     - Local: `http://localhost:3000/api/auth/x/callback`
     - Production: `https://omni-write-production.up.railway.app/api/auth/x/callback`

2. **Configure environment variables**
   - Copy Client ID/Secret into `X_CLIENT_ID` and `X_CLIENT_SECRET`.
   - Set `X_REDIRECT_URI` to your backend callback endpoint.
   - Optionally set success/failure redirect URIs to return to your frontend.

3. **Start the OAuth flow**
   - Authenticated users can hit `GET /api/auth/x` to be redirected to X for login/consent.
   - SPAs can use JSON mode to receive the authorization URL and then navigate:
     - `GET /api/auth/x?mode=json&redirect=<return_url>` → `{ authorizationUrl }`
   - X returns to `/api/auth/x/callback`, which exchanges the code for tokens, fetches the X profile, and persists the connection.

4. **Refreshing tokens**
   - Call `POST /api/x/refresh` to refresh the access token using the stored refresh token.

5. **Using the connection**
   - Fetch the connected profile with `GET /api/x/me`.
   - Post a tweet with `POST /api/x/tweet` JSON body: `{ "text": "Hello from Omni Write" }` (requires write scopes).

## Prisma Setup

### Initialize Database
```bash
npx prisma migrate dev
```

### Generate Prisma Client
```bash
npx prisma generate
```

### Open Prisma Studio (Database GUI)
```bash
npx prisma studio
```

## Dependencies

- **express**: Web framework for Node.js
- **prisma**: Database ORM and migration tool
- **@prisma/client**: Prisma client for database queries
- **nodemon**: (dev) Auto-restart server on file changes
