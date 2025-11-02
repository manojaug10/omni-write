const express = require('express');
const cors = require('cors');
const { clerkMiddleware } = require('@clerk/express');
const healthRoutes = require('./routes/health.routes');
const userRoutes = require('./routes/user.routes');
const webhookRoutes = require('./routes/webhook.routes');
const xRoutes = require('./routes/x.routes');
const threadsRoutes = require('./routes/threads.routes');
const { processDueTweets, processDueThreads, processDueThreadsPosts } = require('./jobs/processScheduledTweets');
const { refreshExpiringThreadsTokens, cleanupExpiredTokens } = require('./jobs/refreshTokens');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Webhook routes with raw body (must be before express.json() middleware)
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// CORS for frontend origins
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'https://omni-write.vercel.app'
  ],
  credentials: true
}));

// Middleware for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Clerk auth context (adds req.auth) - only if keys are configured
if (process.env.CLERK_PUBLISHABLE_KEY && !process.env.CLERK_PUBLISHABLE_KEY.includes('GET_THIS')) {
  app.use(clerkMiddleware());
  console.log('Clerk authentication enabled');
} else {
  console.log('Warning: Clerk authentication disabled - update CLERK_PUBLISHABLE_KEY in .env');
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Protected user routes
app.use('/api/users', userRoutes);
app.use('/api', xRoutes);
app.use('/api', threadsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Omni Write API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`Server is running on ${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

// Background job: process scheduled tweets and threads every 30 seconds
const SCHEDULE_INTERVAL_MS = Number(process.env.SCHEDULE_INTERVAL_MS || 30000);
setInterval(() => {
  processDueTweets().catch((e) => {
    console.error('Scheduled tweets processing error:', e);
  });
  processDueThreads().catch((e) => {
    console.error('Scheduled threads processing error:', e);
  });
  processDueThreadsPosts().catch((e) => {
    console.error('Scheduled Threads posts processing error:', e);
  });
}, SCHEDULE_INTERVAL_MS);

// Background job: refresh Threads tokens daily (runs every 24 hours)
const TOKEN_REFRESH_INTERVAL_MS = Number(process.env.TOKEN_REFRESH_INTERVAL_MS || 24 * 60 * 60 * 1000);
setInterval(() => {
  refreshExpiringThreadsTokens().catch((e) => {
    console.error('Token refresh error:', e);
  });
  cleanupExpiredTokens().catch((e) => {
    console.error('Token cleanup error:', e);
  });
}, TOKEN_REFRESH_INTERVAL_MS);

// Run token refresh once on startup (after 10 seconds delay)
setTimeout(() => {
  refreshExpiringThreadsTokens().catch((e) => {
    console.error('Initial token refresh error:', e);
  });
}, 10000);

