'use strict';

const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/** Sign a session token. Payload is kept small: { uid, role }. */
function sign(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

/** Verify a token; returns the decoded payload or null if invalid/expired. */
function verify(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

module.exports = { sign, verify };
