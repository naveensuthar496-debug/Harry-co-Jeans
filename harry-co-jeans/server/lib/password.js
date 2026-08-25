'use strict';

const bcrypt = require('bcryptjs');

/** Hash a plaintext password (bcryptjs — pure JS, no native build). */
function hash(plain) {
  return bcrypt.hashSync(String(plain), 10);
}

/** Compare a plaintext password against a stored hash. */
function compare(plain, hashed) {
  if (!hashed) return false;
  return bcrypt.compareSync(String(plain), hashed);
}

module.exports = { hash, compare };
