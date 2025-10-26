const express = require('express');
const userService = require('../services/user.service');
const {
  PROVIDERS,
  upsertConnection,
  getConnectionByUserId,
} = require('../services/socialConnection.service');
const xService = require('../services/x.service');
const pkceStateStore = require('../utils/oauthStateStore');

const router = express.Router();

function requireAuth(req, res, next) {
  try {
    const clerkUserId = req.auth && req.auth.userId;
    if (!clerkUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = router;

