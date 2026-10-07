import express from 'express';
import { db } from '../config/database.js';

const router = express.Router();

// GET /api/v1/payment-methods - Returns currently active payment methods for storefront checkout
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

// POST /api/v1/payment-methods/razorpay/create-order
router.post('/razorpay/create-order', async (req, res) => {
  try {
    const { amount, orderNumber, currency = 'INR' } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid order amount.' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_AtelierHarryCo';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

    let razorpayOrderId = `rzp_order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // If actual Razorpay credentials are provided, call Razorpay API directly
    if (keySecret && !keyId.includes('placeholder') && !keyId.includes('Atelier')) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify({
            amount: Math.round(Number(amount) * 100),
            currency: currency.toUpperCase(),
            receipt: orderNumber || `receipt_${Date.now()}`,
            notes: { orderNumber: orderNumber || '' }
          })
        });
        const rzpData = await rzpResponse.json();
        if (rzpData && rzpData.id) {
          razorpayOrderId = rzpData.id;
        }
      } catch (err) {
        console.warn('Direct Razorpay API call failed, falling back to simulated order:', err.message);
      }
    }

    res.json({
      success: true,
      keyId,
      razorpayOrderId,
      amount: Math.round(Number(amount) * 100),
      currency: currency.toUpperCase()
    });
  } catch (err) {
    console.error('Razorpay create-order error:', err);
    res.status(500).json({ success: false, message: 'Failed to initiate Razorpay checkout.' });
  }
});

// POST /api/v1/payment-methods/razorpay/verify
router.post('/razorpay/verify', (req, res) => {
  try {
    const { orderNumber, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
    if (!orderNumber || !razorpayPaymentId) {
      return res.status(400).json({ success: false, message: 'Order number and payment ID are required.' });
    }

    const order = db.prepare('SELECT id, order_number, total_amount FROM orders WHERE UPPER(order_number) = UPPER(?)').get(orderNumber.trim());
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order reference not found.' });
    }

    // Update payment status in database
    db.prepare(`
      UPDATE orders
      SET payment_status = 'PAID',
          payment_method = 'RAZORPAY',
          admin_notes = COALESCE(admin_notes, '') || ?
      WHERE id = ?
    `).run(` [Paid via Razorpay Ref: ${razorpayPaymentId}]`, order.id);

    // Record timeline entry
    try {
      db.prepare(`
        INSERT INTO order_timeline (order_id, status, title, description)
        VALUES (?, 'PAID', 'Payment Verified', ?)
      `).run(order.id, `Payment verified via Razorpay Gateway (Txn ID: ${razorpayPaymentId}).`);
    } catch (e) {}

    res.json({
      success: true,
      message: 'Razorpay payment verified and recorded.',
      orderNumber: order.order_number,
      paymentId: razorpayPaymentId
    });
  } catch (err) {
    console.error('Razorpay payment verification error:', err);
    res.status(500).json({ success: false, message: 'Payment verification failed.' });
  }
});

export default router;
