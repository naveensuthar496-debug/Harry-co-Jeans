import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { db } from '../config/database.js';

const router = express.Router();

// Helper to initialize Razorpay instance using environment variables
function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
}

// GET /api/v1/payment-methods - Returns active payment methods
router.get('/', (req, res) => {
  try {
    const methods = db.prepare(`
      SELECT id, code, name, description, minimum_order_value, maximum_order_value, fee, free_threshold, display_order
      FROM payment_methods
      WHERE enabled = 1
      ORDER BY display_order ASC
    `).all();

    res.json({
      success: true,
      paymentMethods: methods
    });
  } catch (err) {
    console.error('Error fetching payment methods:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving payment options.' });
  }
});

// GET /api/v1/payment-methods/:code - Check status of specific method
router.get('/:code', (req, res) => {
  try {
    const { code } = req.params;
    const method = db.prepare(`
      SELECT id, code, name, description, enabled, minimum_order_value, maximum_order_value, fee, free_threshold
      FROM payment_methods
      WHERE UPPER(code) = UPPER(?)
    `).get(code);

    if (!method) {
      return res.status(404).json({ success: false, message: 'Payment method not found.' });
    }

    res.json({
      success: true,
      paymentMethod: method
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error checking payment method.' });
  }
});

// ==========================================================================
// STEP 1: BACKEND - CREATE ORDER
// Compatible with both:
//   - POST /api/create-order
//   - POST /api/v1/payment-methods/razorpay/create-order
// ==========================================================================
export async function handleCreateRazorpayOrder(req, res) {
  try {
    const {
      amount,
      currency = 'INR',
      receipt,
      orderNumber,
      notes = {}
    } = req.body;

    // Validate amount
    const parsedAmount = Number(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount. Minimum amount is 100 paise (₹1.00).'
      });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(401).json({
        success: false,
        message: 'Razorpay API credentials not configured in environment.'
      });
    }

    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: 'Failed to initialize Razorpay SDK client.'
      });
    }

    const receiptId = String(receipt || orderNumber || `rcpt_${Date.now()}`).substring(0, 40);

    const orderOptions = {
      amount: Math.round(parsedAmount),
      currency: currency.toUpperCase(),
      receipt: receiptId,
      notes: {
        orderNumber: orderNumber || receiptId,
        ...notes
      }
    };

    const razorpayOrder = await razorpay.orders.create(orderOptions);

    res.json({
      success: true,
      order_id: razorpayOrder.id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: keyId,
      keyId: keyId
    });
  } catch (err) {
    console.error('Razorpay Create Order Error:', err);

    if (err.statusCode === 401) {
      return res.status(401).json({
        success: false,
        message: 'Razorpay authentication failed. Invalid API credentials.'
      });
    }

    res.status(500).json({
      success: false,
      message: err.error?.description || err.message || 'Razorpay order creation failed.'
    });
  }
}

// ==========================================================================
// STEP 3: BACKEND - VERIFY SIGNATURE
// Compatible with both:
//   - POST /api/verify-payment
//   - POST /api/v1/payment-methods/razorpay/verify
// ==========================================================================
export function handleVerifyRazorpayPayment(req, res) {
  try {
    const {
      razorpay_order_id,
      razorpayOrderId,
      order_id,
      razorpay_payment_id,
      razorpayPaymentId,
      payment_id,
      razorpay_signature,
      razorpaySignature,
      signature,
      orderNumber
    } = req.body;

    const rzpOrderId = razorpay_order_id || razorpayOrderId || order_id;
    const rzpPaymentId = razorpay_payment_id || razorpayPaymentId || payment_id;
    const rzpSignature = razorpay_signature || razorpaySignature || signature;

    // Validate presence of required fields
    if (!rzpOrderId || !rzpPaymentId || !rzpSignature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required signature verification fields (order_id, payment_id, signature).'
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({
        success: false,
        message: 'Server error: Razorpay Key Secret is not configured.'
      });
    }

    // HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const payload = `${rzpOrderId}|${rzpPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    const isMatch = expectedSignature === rzpSignature;

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Signature verification failed: Payment is not authentic.'
      });
    }

    // Signature match verified! Update database order status if order exists
    if (orderNumber) {
      try {
        const order = db.prepare('SELECT id, order_number FROM orders WHERE UPPER(order_number) = UPPER(?)').get(orderNumber.trim());
        if (order) {
          db.prepare(`
            UPDATE orders
            SET payment_status = 'PAID',
                payment_method = 'RAZORPAY',
                admin_notes = COALESCE(admin_notes, '') || ?
            WHERE id = ?
          `).run(` [Verified via Razorpay Ref: ${rzpPaymentId}]`, order.id);

          try {
            db.prepare(`
              INSERT INTO order_timeline (order_id, status, title, description)
              VALUES (?, 'PAID', 'Razorpay Payment Verified', ?)
            `).run(order.id, `Payment signature verified (Payment ID: ${rzpPaymentId}, Order ID: ${rzpOrderId}).`);
          } catch (timelineErr) {
            console.warn('Timeline recording skipped:', timelineErr.message);
          }
        }
      } catch (dbErr) {
        console.warn('DB order update error after verified payment:', dbErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Payment verified successfully.',
      order_id: rzpOrderId,
      payment_id: rzpPaymentId
    });
  } catch (err) {
    console.error('Razorpay Signature Verification Error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during payment verification.'
    });
  }
}

// Router mounts
router.post('/razorpay/create-order', handleCreateRazorpayOrder);
router.post('/razorpay/verify', handleVerifyRazorpayPayment);

export default router;
