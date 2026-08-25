'use strict';

const crypto = require('node:crypto');

/** Random URL-safe id (default 16 chars). Used for generic surrogate keys. */
function id(len = 16) {
  return crypto.randomBytes(Math.ceil(len * 0.75)).toString('base64url').slice(0, len);
}

/**
 * Human-facing order number like the mockups: "#HC-99210".
 * We keep a 5-digit tail; callers pass a monotonic-ish seed (e.g. row count)
 * or we fall back to a random 5-digit number.
 */
function orderNumber(seq) {
  const tail = seq != null ? String(90000 + Number(seq)).slice(-5) : String(Math.floor(10000 + Math.random() * 89999));
  return `#HC-${tail}`;
}

/** Slugify a product/article title: "Classic Black Slim" -> "classic-black-slim". */
function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Build a variant SKU, e.g. ("HC-RSS-001", "32", "Black") -> "HC-RSS-001-32-BLK". */
function variantSku(baseSku, size, color) {
  const c = String(color || '').replace(/[^a-z0-9]/gi, '').slice(0, 3).toUpperCase() || 'STD';
  const s = String(size || '').replace(/[^a-z0-9]/gi, '').toUpperCase() || 'OS';
  return `${baseSku}-${s}-${c}`;
}

module.exports = { id, orderNumber, slugify, variantSku };
