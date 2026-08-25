'use strict';

const { HttpError } = require('./error');

/** Assert a condition or throw a 400. */
function assert(cond, message, details) {
  if (!cond) throw new HttpError(400, message, details);
}

/** Coerce to a trimmed string; throw if required and empty. */
function str(value, { field = 'value', required = false, max = 100000 } = {}) {
  if (value === undefined || value === null) {
    if (required) throw new HttpError(400, `${field} is required`);
    return '';
  }
  const s = String(value).trim();
  if (required && !s) throw new HttpError(400, `${field} is required`);
  if (s.length > max) throw new HttpError(400, `${field} is too long`);
  return s;
}

/** Coerce to a finite number; throw if required and missing/NaN. */
function num(value, { field = 'value', required = false, min = -Infinity, max = Infinity } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new HttpError(400, `${field} is required`);
    return null;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) throw new HttpError(400, `${field} must be a number`);
  if (n < min || n > max) throw new HttpError(400, `${field} is out of range`);
  return n;
}

/** Coerce to a positive integer count (defaults to 1). */
function count(value, fallback = 1) {
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function email(value) {
  const s = str(value, { field: 'email', required: true }).toLowerCase();
  if (!EMAIL_RE.test(s)) throw new HttpError(400, 'Enter a valid email address');
  return s;
}

module.exports = { assert, str, num, count, email };
