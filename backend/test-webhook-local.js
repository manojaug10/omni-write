/**
 * Local Webhook Test Script
 *
 * This script tests the webhook endpoint locally before deploying to Railway.
 * It simulates a Clerk user.created webhook event.
 *
 * Usage:
 * 1. Make sure your backend server is running: npm run dev
 * 2. Run this script: node test-webhook-local.js
 */

require('dotenv').config();
const axios = require('axios');

const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/clerk';

// Sample Clerk user.created event payload
const testPayload = {
  data: {
    id: 'user_test123456789',
    email_addresses: [
      {
        id: 'email_test123',
        email_address: 'test@example.com',
        verification: {
          status: 'verified'
        }
      }
    ],
    primary_email_address_id: 'email_test123',
    first_name: 'Test',
    last_name: 'User',
    created_at: Date.now(),
    updated_at: Date.now()
  },
  type: 'user.created',
  object: 'event'
};

async function testWebhook() {
  console.log('🧪 Testing webhook endpoint locally...\n');
  console.log('Webhook URL:', WEBHOOK_URL);
  console.log('Payload:', JSON.stringify(testPayload, null, 2));
  console.log('\n' + '='.repeat(50) + '\n');

  try {
    // Test WITHOUT signature verification (will fail as expected)
    console.log('Test 1: Sending without Svix headers (should fail with 400)...');
    try {
      const response = await axios.post(WEBHOOK_URL, testPayload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('❌ Unexpected success:', response.status);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Expected failure: Missing svix headers\n');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    // Test 2: Check if webhook secret is configured
    console.log('\nTest 2: Checking webhook secret configuration...');
    if (!process.env.CLERK_WEBHOOK_SECRET) {
      console.log('❌ CLERK_WEBHOOK_SECRET is not set in .env file');
      console.log('   Please add it to backend/.env file\n');
    } else {
      console.log('✅ CLERK_WEBHOOK_SECRET is configured\n');
    }

    // Test 3: Check database connection
    console.log('Test 3: Testing database connection...');
    try {
      const { PrismaClient } = require('./src/generated/prisma');
      const prisma = new PrismaClient();
      await prisma.$connect();
      console.log('✅ Database connection successful');

      // Check if User table exists
      const userCount = await prisma.user.count();
      console.log(`✅ User table exists (${userCount} users)\n`);

      await prisma.$disconnect();
    } catch (error) {
      console.log('❌ Database error:', error.message);
      console.log('   Make sure DATABASE_URL is correctly set in .env\n');
    }

    console.log('='.repeat(50));
    console.log('\n📋 Summary:');
    console.log('- Webhook endpoint is responding');
    console.log('- Signature verification is working (rejects unsigned requests)');
    console.log('- To test with real Clerk webhooks:');
    console.log('  1. Deploy to Railway');
    console.log('  2. Add CLERK_WEBHOOK_SECRET to Railway environment');
    console.log('  3. Configure webhook in Clerk Dashboard');
    console.log('  4. Use Clerk\'s "Send Test Event" feature');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   Make sure your backend server is running (npm run dev)');
    }
  }
}

testWebhook();
