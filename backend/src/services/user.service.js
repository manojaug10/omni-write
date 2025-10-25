const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/**
 * User Service
 * Handles all user-related database operations
 */

/**
 * Create a new user in the database
 * @param {Object} userData - User data from Clerk
 * @param {string} userData.clerkId - Clerk user ID
 * @param {string} userData.email - User email address
 * @param {string} [userData.name] - User full name (optional)
 * @returns {Promise<Object>} Created user object
 */
async function createUser({ clerkId, email, name }) {
  try {
    const user = await prisma.user.create({
      data: {
        clerkId,
        email,
        name: name || null,
      },
    });
    console.log('User created successfully:', user.id);
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Update an existing user in the database
 * @param {string} clerkId - Clerk user ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated user object
 */
async function updateUser(clerkId, updateData) {
  try {
    const user = await prisma.user.update({
      where: { clerkId },
      data: updateData,
    });
    console.log('User updated successfully:', user.id);
    return user;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

/**
 * Delete a user from the database
 * @param {string} clerkId - Clerk user ID
 * @returns {Promise<Object>} Deleted user object
 */
async function deleteUser(clerkId) {
  try {
    const user = await prisma.user.delete({
      where: { clerkId },
    });
    console.log('User deleted successfully:', user.id);
    return user;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

/**
 * Find a user by Clerk ID
 * @param {string} clerkId - Clerk user ID
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function findUserByClerkId(clerkId) {
  try {
    return await prisma.user.findUnique({
      where: { clerkId },
    });
  } catch (error) {
    console.error('Error finding user:', error);
    throw error;
  }
}

/**
 * Find a user by email
 * @param {string} email - User email address
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function findUserByEmail(email) {
  try {
    return await prisma.user.findUnique({
      where: { email },
    });
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
}

module.exports = {
  createUser,
  updateUser,
  deleteUser,
  findUserByClerkId,
  findUserByEmail,
};
