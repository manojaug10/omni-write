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
      console.error('❌ Missing CLERK_WEBHOOK_SECRET environment variable');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Get the headers
    const svix_id = req.headers['svix-id'];
    const svix_timestamp = req.headers['svix-timestamp'];
    const svix_signature = req.headers['svix-signature'];

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('❌ Missing svix headers:', { svix_id, svix_timestamp, svix_signature });
      return res.status(400).json({ error: 'Missing svix headers' });
    }

    // Get the body as a string
    // req.body is a Buffer from express.raw(), need to convert to string
    const payload = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body);

    console.log('📥 Webhook received - Headers:', { svix_id, svix_timestamp });

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
      console.log('✅ Webhook signature verified');
    } catch (err) {
      console.error('❌ Error verifying webhook signature:', err.message);
      return res.status(400).json({ error: 'Invalid signature', details: err.message });
    }

    // Handle the webhook event
    const { id } = evt.data;
    const eventType = evt.type;

    console.log(`📨 Webhook event: ${eventType} for user ${id}`);
    console.log('📦 Full webhook payload:', JSON.stringify(evt, null, 2));

    // Handle different event types
    try {
      switch (eventType) {
        case 'user.created':
          await handleUserCreated(evt.data);
          console.log(`✅ User created successfully: ${id}`);
          break;

        case 'user.updated':
          await handleUserUpdated(evt.data);
          console.log(`✅ User updated successfully: ${id}`);
          break;

        case 'user.deleted':
          await handleUserDeleted(evt.data);
          console.log(`✅ User deleted successfully: ${id}`);
          break;

        default:
          console.log(`⚠️  Unhandled event type: ${eventType}`);
      }
    } catch (handlerError) {
      console.error(`❌ Error handling ${eventType}:`, handlerError);
      console.error('Stack trace:', handlerError.stack);
      return res.status(500).json({
        error: 'Event handler failed',
        eventType,
        details: handlerError.message
      });
    }

    return res.status(200).json({ success: true, eventType });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    console.error('Stack trace:', error.stack);
    return res.status(500).json({ error: 'Webhook handler failed', details: error.message });
  }
});

/**
 * Handle user.created event
 * Creates a new user in the database
 */
async function handleUserCreated(data) {
  try {
    const { id, email_addresses, first_name, last_name, primary_email_address_id } = data;

    console.log(`🔄 Creating user ${id}...`);
    console.log('Email addresses:', JSON.stringify(email_addresses, null, 2));
    console.log('Primary email ID:', primary_email_address_id);

    // Check if email_addresses array exists and has items
    if (!email_addresses || email_addresses.length === 0) {
      console.error('❌ email_addresses is empty or missing for user:', id);
      console.error('This is likely a Clerk test event with incomplete data.');
      console.error('⚠️  SOLUTION: Use a real user signup instead of "Send Example" test.');
      throw new Error('No email addresses provided in webhook event. Use real signup to test.');
    }

    // Get primary email
    const primaryEmail = email_addresses.find(email => email.id === primary_email_address_id);

    if (!primaryEmail) {
      console.error('❌ No primary email found for user:', id);
      console.error('Primary email ID:', primary_email_address_id);
      console.error('Available emails:', email_addresses);
      throw new Error(`Primary email (${primary_email_address_id}) not found in email_addresses array`);
    }

    // Validate email address field
    if (!primaryEmail.email_address) {
      console.error('❌ Primary email object has no email_address field:', primaryEmail);
      throw new Error('Email address field is missing from primary email object');
    }

    // Construct full name
    const name = [first_name, last_name].filter(Boolean).join(' ') || null;

    console.log(`📝 User data: email=${primaryEmail.email_address}, name=${name}`);

    // Create user in database
    const user = await userService.createUser({
      clerkId: id,
      email: primaryEmail.email_address,
      name: name,
    });

    console.log(`✅ User created in database: ${user.id}`);
    return user;
  } catch (error) {
    console.error('❌ Error in handleUserCreated:', error);
    throw error;
  }
}

/**
 * Handle user.updated event
 * Updates existing user in the database
 */
async function handleUserUpdated(data) {
  try {
    const { id, email_addresses, first_name, last_name, primary_email_address_id } = data;

    console.log(`🔄 Updating user ${id}...`);

    // Get primary email
    const primaryEmail = email_addresses?.find(email => email.id === primary_email_address_id);

    const updateData = {};

    if (primaryEmail) {
      updateData.email = primaryEmail.email_address;
    }

    // Construct full name
    const name = [first_name, last_name].filter(Boolean).join(' ') || null;
    if (name) {
      updateData.name = name;
    }

    console.log(`📝 Update data:`, updateData);

    // Update user in database
    const user = await userService.updateUser(id, updateData);

    console.log(`✅ User updated in database: ${user.id}`);
    return user;
  } catch (error) {
    console.error('❌ Error in handleUserUpdated:', error);
    throw error;
  }
}

/**
 * Handle user.deleted event
 * Removes user from the database
 */
async function handleUserDeleted(data) {
  try {
    const { id } = data;

    console.log(`🔄 Deleting user ${id}...`);

    // Delete user from database
    const user = await userService.deleteUser(id);

    console.log(`✅ User deleted from database: ${user.id}`);
    return user;
  } catch (error) {
    console.error('❌ Error in handleUserDeleted:', error);
    throw error;
  }
}

module.exports = router;
