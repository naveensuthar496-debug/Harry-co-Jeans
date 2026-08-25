'use strict';

const crypto = require('node:crypto');
const { toPaise } = require('./money');

const KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

let client = null;
if (KEY_ID && KEY_SECRET) {
  try {
    const Razorpay = require('razorpay');
    client = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
  } catch (err) {
    console.warn('[razorpay] SDK not available, falling back to simulated payments:', err.message);
  }
}

/** True when real test/live keys are configured and the SDK loaded. */
function isLive() {
  return !!client;
}

/** The public key id the browser Checkout needs (empty string in sim mode). */
function publicKeyId() {
  return KEY_ID;
}

/**
 * Create a payment order. In live mode this calls Razorpay; otherwise it
 * returns a simulated order object with the same shape the frontend expects.
 */
async function createOrder(amountRupees, receipt) {
  const amount = toPaise(amountRupees);
  if (client) {
    return client.orders.create({ amount, currency: 'INR', receipt });
  }
  // Simulated order — same fields the Checkout flow reads.
  return {
    id: 'order_sim_' + crypto.randomBytes(8).toString('hex'),
    amount,
    currency: 'INR',
    receipt,
    status: 'created',
    simulated: true,
  };
}

/**
 * Verify the payment signature returned by Checkout.
 * Live: HMAC-SHA256(order_id|payment_id, key_secret) === signature.
 * Sim: accept our sentinel signature so the flow completes locally.
 */
function verifySignature({ orderId, paymentId, signature }) {
  if (!client) {
    return typeof signature === 'string' && signature.startsWith('sim_');
  }
  const expected = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
}

module.exports = { isLive, publicKeyId, createOrder, verifySignature };
