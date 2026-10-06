import express from 'express';
import { db } from '../config/database.js';
import { createOrder } from '../services/orderService.js';

const router = express.Router();

// POST /api/v1/orders - Place order with strict server-side validation
router.post('/', async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      billingAddress,
      items,
      paymentMethodCode,
      couponCode,
      customerNotes,
      sessionId
    } = req.body;

    if (!customerName || !customerEmail || !customerPhone || !shippingAddress || !items?.length || !paymentMethodCode) {
      return res.status(400).json({ success: false, message: 'Missing required order fields.' });
    }

    const result = await createOrder({
      customerName, customerEmail, customerPhone,
      shippingAddress, billingAddress,
      items, paymentMethodCode, couponCode,
      customerNotes, sessionId
    });

    // Mark abandoned cart as recovered
    if (sessionId) {
      try {
        db.prepare(`UPDATE abandoned_carts SET is_recovered = 1, recovered_at = CURRENT_TIMESTAMP WHERE session_id = ?`).run(sessionId);
      } catch (e) { /* ignore */ }
    }

    res.status(201).json(result);
  } catch (err) {
    console.error('Order placement error:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to place order.' });
  }
});

// POST /api/v1/orders/track - Public order tracking (no auth required)
router.post('/track', (req, res) => {
  try {
    const { orderNumber, email } = req.body;
    if (!orderNumber || !email) {
      return res.status(400).json({ success: false, message: 'Order number and email are required.' });
    }

    const order = db.prepare(`
      SELECT * FROM orders
      WHERE UPPER(order_number) = UPPER(?) AND LOWER(customer_email) = LOWER(?)
    `).get(orderNumber.trim(), email.trim());

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'No order found with that number and email. Please check your details.'
      });
    }

    // Get timeline events
    let timeline = [];
    try {
      timeline = db.prepare(`SELECT * FROM order_timeline WHERE order_id = ? ORDER BY created_at ASC`).all(order.id);
    } catch (e) { /* table may not exist yet */ }

    // Parse nested JSON fields
    let items = [];
    let shippingAddress = {};
    try { items = JSON.parse(order.items); } catch (e) {}
    try { shippingAddress = JSON.parse(order.shipping_address); } catch (e) {}

    // Mask sensitive data for public view
    const publicOrder = {
      ...order,
      items,
      shipping_address: shippingAddress,
      timeline,
      // Mask email partially for security
      customer_email: maskEmail(order.customer_email),
      customer_phone: maskPhone(order.customer_phone),
      billing_address: null // hide billing for security
    };

    res.json({ success: true, order: publicOrder });
  } catch (err) {
    console.error('Order tracking error:', err);
    res.status(500).json({ success: false, message: 'Error fetching order details.' });
  }
});

// GET /api/v1/orders/:orderNumber - Get single order (public, needs email verification)
router.get('/:orderNumber', (req, res) => {
  try {
    const { email } = req.query;
    const { orderNumber } = req.params;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email verification required.' });
    }

    const order = db.prepare(`
      SELECT * FROM orders
      WHERE UPPER(order_number) = UPPER(?) AND LOWER(customer_email) = LOWER(?)
    `).get(orderNumber, email);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    let items = [];
    let shippingAddress = {};
    try { items = JSON.parse(order.items); } catch (e) {}
    try { shippingAddress = JSON.parse(order.shipping_address); } catch (e) {}

    res.json({
      success: true,
      order: { ...order, items, shipping_address: shippingAddress }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching order.' });
  }
});

// POST /api/v1/orders/:id/return-request - Submit return/exchange request
router.post('/:id/return-request', (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const {
      orderNumber,
      customerEmail,
      customerName,
      customerPhone,
      requestType,
      reason,
      description,
      currentSize,
      exchangeSize
    } = req.body;

    if (!orderNumber || !customerEmail || !reason || !requestType) {
      return res.status(400).json({ success: false, message: 'Missing required fields for return/exchange request.' });
    }

    // Verify order ownership
    const order = db.prepare(`
      SELECT * FROM orders WHERE id = ? AND LOWER(customer_email) = LOWER(?)
    `).get(orderId, customerEmail);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or email does not match.' });
    }

    // Check return window
    const returnWindowDays = parseInt(db.prepare(`SELECT value FROM settings WHERE key = 'return_window_days'`).get()?.value || '14', 10);
    const createdAt = new Date(order.created_at);
    const daysSinceOrder = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    if (requestType === 'return' && daysSinceOrder > returnWindowDays + 30) {
      return res.status(400).json({
        success: false,
        message: `Return window of ${returnWindowDays} days has expired for this order.`
      });
    }

    // Check if already requested
    const existing = db.prepare(`SELECT id FROM return_requests WHERE order_id = ? AND request_type = ? AND status != 'REJECTED'`).get(orderId, requestType);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A ${requestType} request has already been submitted for this order.`
      });
    }

    const result = db.prepare(`
      INSERT INTO return_requests (order_id, order_number, customer_name, customer_email, customer_phone, request_type, reason, description, current_size, exchange_size)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderId,
      order.order_number,
      customerName || order.customer_name,
      customerEmail,
      customerPhone || order.customer_phone,
      requestType,
      reason,
      description || '',
      currentSize || '',
      exchangeSize || ''
    );

    // Update order return status
    db.prepare(`UPDATE orders SET return_status = 'REQUESTED', return_reason = ?, return_requested_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(reason, orderId);

    res.json({
      success: true,
      message: `Your ${requestType} request has been submitted successfully. Our team will contact you within 24 business hours.`,
      requestId: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Return request error:', err);
    res.status(500).json({ success: false, message: 'Error submitting request. Please try again.' });
  }
});

// POST /api/v1/orders/abandoned-cart - Save/update abandoned cart
router.post('/abandoned-cart', (req, res) => {
  try {
    const { sessionId, customerEmail, customerName, customerPhone, cartData, cartValue, itemCount } = req.body;
    if (!sessionId || !cartData) {
      return res.status(400).json({ success: false, message: 'Session and cart data required.' });
    }

    db.prepare(`
      INSERT INTO abandoned_carts (session_id, customer_email, customer_name, customer_phone, cart_data, cart_value, item_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET
        customer_email = COALESCE(excluded.customer_email, customer_email),
        customer_name = COALESCE(excluded.customer_name, customer_name),
        customer_phone = COALESCE(excluded.customer_phone, customer_phone),
        cart_data = excluded.cart_data,
        cart_value = excluded.cart_value,
        item_count = excluded.item_count,
        last_activity = CURRENT_TIMESTAMP
    `).run(sessionId, customerEmail || null, customerName || null, customerPhone || null, JSON.stringify(cartData), cartValue || 0, itemCount || 0);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error saving cart.' });
  }
});

// Helper functions
function maskEmail(email) {
  if (!email) return '';
  const [user, domain] = email.split('@');
  if (!user || !domain) return email;
  const masked = user.length > 2
    ? user[0] + '*'.repeat(user.length - 2) + user[user.length - 1]
    : user[0] + '*';
  return `${masked}@${domain}`;
}

function maskPhone(phone) {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '');
  return clean.length >= 4 ? '****' + clean.slice(-4) : '****';
}

export default router;
