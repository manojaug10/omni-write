const express = require('express');
const userService = require('../services/user.service');

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

// GET /api/users/me - Get current user profile
router.get('/me', requireAuth, async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    const user = await userService.findUserByClerkId(clerkUserId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user', details: error.message });
  }
});

// PATCH /api/users/me - Update current user profile
router.patch('/me', requireAuth, async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    const { name, email } = req.body || {};

    const updateData = {};
    if (typeof name === 'string') {
      updateData.name = name;
    }
    if (typeof email === 'string') {
      updateData.email = email;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const updated = await userService.updateUser(clerkUserId, updateData);
    return res.status(200).json({ user: updated });
  } catch (error) {
    if (error && error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(500).json({ error: 'Failed to update user', details: error.message });
  }
});

// DELETE /api/users/me - Delete current user account (from our DB)
router.delete('/me', requireAuth, async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    const deleted = await userService.deleteUser(clerkUserId);
    return res.status(200).json({ user: deleted });
  } catch (error) {
    if (error && error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(500).json({ error: 'Failed to delete user', details: error.message });
  }
});

module.exports = router;


