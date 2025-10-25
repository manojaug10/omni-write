const express = require('express');
const { Webhook } = require('svix');
const userService = require('../services/user.service');

const router = express.Router();

/**
 * Clerk Webhook Handler
 * Syncs user data from Clerk to our database
 *
 * Events handled:
 * - user.created: Creates a new user in database
 * - user.updated: Updates existing user data
 * - user.deleted: Removes user from database
 */
router.post('/clerk', async (req, res) => {
  try {
    // Get the webhook secret from environment variables
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      console.error('Missing CLERK_WEBHOOK_SECRET environment variable');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Get the headers
    const svix_id = req.headers['svix-id'];
    const svix_timestamp = req.headers['svix-timestamp'];
    const svix_signature = req.headers['svix-signature'];

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).json({ error: 'Missing svix headers' });
    }

    // Get the raw body
    const payload = req.body.toString();

    // Create a new Svix instance with your webhook secret
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt;

    // Verify the webhook signature
    try {
      evt = wh.verify(payload, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      });
    } catch (err) {
      console.error('Error verifying webhook:', err);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Handle the webhook event
    const { id } = evt.data;
    const eventType = evt.type;

    console.log(`Webhook received: ${eventType} for user ${id}`);

    // Handle different event types
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;

      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;

      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
});

/**
 * Handle user.created event
 * Creates a new user in the database
 */
async function handleUserCreated(data) {
  const { id, email_addresses, first_name, last_name } = data;

  // Get primary email
  const primaryEmail = email_addresses.find(email => email.id === data.primary_email_address_id);

  if (!primaryEmail) {
    console.error('No primary email found for user:', id);
    return;
  }

  // Construct full name
  const name = [first_name, last_name].filter(Boolean).join(' ') || null;

  // Create user in database
  await userService.createUser({
    clerkId: id,
    email: primaryEmail.email_address,
    name: name,
  });

  console.log(`User created in database: ${id}`);
}

/**
 * Handle user.updated event
 * Updates existing user in the database
 */
async function handleUserUpdated(data) {
  const { id, email_addresses, first_name, last_name } = data;

  // Get primary email
  const primaryEmail = email_addresses.find(email => email.id === data.primary_email_address_id);

  const updateData = {};

  if (primaryEmail) {
    updateData.email = primaryEmail.email_address;
  }

  // Construct full name
  const name = [first_name, last_name].filter(Boolean).join(' ') || null;
  if (name) {
    updateData.name = name;
  }

  // Update user in database
  await userService.updateUser(id, updateData);

  console.log(`User updated in database: ${id}`);
}

/**
 * Handle user.deleted event
 * Removes user from the database
 */
async function handleUserDeleted(data) {
  const { id } = data;

  // Delete user from database
  await userService.deleteUser(id);

  console.log(`User deleted from database: ${id}`);
}

module.exports = router;
