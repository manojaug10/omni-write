const crypto = require('crypto');

/**
 * Simple in-memory store for OAuth `state` values to mitigate CSRF.
 * Until we introduce a distributed cache/session layer, this keeps
 * track of states for the lifetime of the process with a TTL.
 */
const DEFAULT_TTL_MS = Number(process.env.THREADS_OAUTH_STATE_TTL_MS || 10 * 60 * 1000);
const store = new Map();

function purgeExpired() {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (value.expiresAt <= now) {
      store.delete(key);
    }
  }
}

/**
 * Creates a secure random state token and stores the associated payload.
 * @param {object} payload - Arbitrary data to store alongside the state.
 * @returns {string} state - The generated state value.
 */
function createState(payload = {}) {
  purgeExpired();
  const state = crypto.randomBytes(24).toString('hex');
  store.set(state, {
    payload,
    expiresAt: Date.now() + DEFAULT_TTL_MS,
  });
  return state;
}

/**
 * Consumes the state if it exists and has not expired.
 * @param {string} state
 * @returns {object|null} - Stored payload, or null if missing/expired.
 */
function consumeState(state) {
  if (!state || typeof state !== 'string') {
    return null;
  }
  purgeExpired();
  const entry = store.get(state);
  if (!entry) {
    return null;
  }
  store.delete(state);
  if (entry.expiresAt <= Date.now()) {
    return null;
  }
  return entry.payload;
}

module.exports = {
  createState,
  consumeState,
};
