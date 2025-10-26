const crypto = require('crypto');

function base64UrlEncode(buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function generateCodeVerifier(length = 64) {
  const verifier = base64UrlEncode(crypto.randomBytes(length));
  // Ensure RFC length between 43 and 128 characters
  return verifier.slice(0, Math.max(43, Math.min(128, verifier.length)));
}

function generateCodeChallenge(codeVerifier) {
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  return base64UrlEncode(hash);
}

module.exports = {
  generateCodeVerifier,
  generateCodeChallenge,
};


