'use strict';

// All monetary values in this app are stored as **whole INR rupees**
// (integers). The design uses no paise, which keeps seed data and display
// simple. Razorpay works in paise, so we convert at the boundary.

/** Convert whole rupees -> paise (integer) for Razorpay. */
function toPaise(rupees) {
  return Math.round(Number(rupees) * 100);
}

/** Convert paise -> whole rupees. */
function fromPaise(paise) {
  return Math.round(Number(paise) / 100);
}

/**
 * Format a rupee amount the way the mockups do, e.g. 1499 -> "₹1,499".
 * Uses the Indian digit-grouping convention (1,00,000).
 */
function formatINR(rupees) {
  const n = Math.round(Number(rupees) || 0);
  return '₹' + n.toLocaleString('en-IN');
}

module.exports = { toPaise, fromPaise, formatINR };
