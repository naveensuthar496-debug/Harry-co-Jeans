'use strict';

const express = require('express');
const router = express.Router();
const { get, all, run, tx } = require('../db/database');
const { asyncHandler, HttpError } = require('../middleware/error');
const { orderNumber } = require('../lib/ids');
const razorpay = require('../lib/razorpay');

// POST /api/checkout/create-payment-order
router.post(
  '/create-payment-order',
  asyncHandler(async (req, res) => {
    const { amount, receipt = 'rcpt_' + Date.now() } = req.body;
    const amountRupees = Math.max(1, Number(amount) || 0);

    const rzpOrder = await razorpay.createOrder(amountRupees, receipt);
    res.json({
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency || 'INR',
      keyId: razorpay.publicKeyId(),
      isLive: razorpay.isLive(),
    });
  })
);

// POST /api/checkout/place-order
router.post(
  '/place-order',
  asyncHandler((req, res) => {
    const {
      shippingAddress,
      paymentMethod = 'card',
      paymentOrderId,
      paymentId,
      signature,
      couponCode,
      items: customItems,
    } = req.body;

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.line1) {
      throw new HttpError(400, 'Shipping address is required');
    }

    const userId = req.user ? req.user.id : null;

    let itemsToOrder = [];
    if (Array.isArray(customItems) && customItems.length > 0) {
      itemsToOrder = customItems;
    } else if (userId) {
      const cartRows = all(
        `SELECT ci.variant_id as variantId, ci.quantity, v.size, v.color, v.price as unitPrice,
                v.stock, p.id as productId, p.title as name,
                (SELECT url FROM product_images WHERE product_id = p.id ORDER BY is_main DESC, position ASC LIMIT 1) as imageUrl
         FROM cart_items ci
         JOIN product_variants v ON ci.variant_id = v.id
         JOIN products p ON v.product_id = p.id
         WHERE ci.user_id = ?`,
        [userId]
      );
      itemsToOrder = cartRows;
    }

    if (!itemsToOrder || itemsToOrder.length === 0) {
      throw new HttpError(400, 'Cannot place an order with an empty cart');
    }

    // Verify payment signature if card/upi and not COD
    if (paymentMethod !== 'cod' && paymentOrderId) {
      const validSig = razorpay.verifySignature({
        orderId: paymentOrderId,
        paymentId: paymentId || 'sim_pay_' + Date.now(),
        signature: signature || 'sim_sig_ok',
      });
      if (!validSig && razorpay.isLive()) {
        throw new HttpError(400, 'Payment verification failed');
      }
    }

    const subtotal = itemsToOrder.reduce((acc, it) => acc + (Number(it.unitPrice || it.price) * Number(it.quantity || 1)), 0);
    let discount = 0;

    if (couponCode) {
      const promo = get('SELECT * FROM promotions WHERE UPPER(code) = ? AND status = \'active\'', [couponCode.toUpperCase()]);
      if (promo && subtotal >= promo.min_order) {
        if (promo.discount_type === 'percentage') {
          discount = Math.round((subtotal * promo.discount_value) / 100);
        } else if (promo.discount_type === 'fixed') {
          discount = Math.min(subtotal, promo.discount_value);
        }
      }
    }

    const shipping = subtotal > 0 && subtotal < 2500 ? 150 : 0;
    const total = Math.max(0, subtotal - discount + shipping);

    const orderRow = tx(() => {
      const countRow = get('SELECT COUNT(*) as c FROM orders');
      const num = orderNumber((countRow ? countRow.c : 0) + 1);

      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + 4);
      const estDelivery = estimatedDate.toISOString().split('T')[0];

      const ins = run(
        `INSERT INTO orders (
          order_number, user_id, status, payment_method, payment_status,
          subtotal, discount, coupon_code, shipping, tax, total,
          shipping_address, estimated_delivery, carrier, tracking_number,
          razorpay_order_id, razorpay_payment_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          num,
          userId,
          'confirmed',
          paymentMethod,
          paymentMethod === 'cod' ? 'pending' : 'paid',
          subtotal,
          discount,
          couponCode || null,
          shipping,
          Math.round(subtotal * 0.12),
          total,
          JSON.stringify(shippingAddress),
          estDelivery,
          'Blue Dart Express',
          'BD-' + Math.floor(10000000 + Math.random() * 90000000),
          paymentOrderId || null,
          paymentId || (paymentMethod === 'cod' ? null : 'sim_' + Date.now()),
        ]
      );

      const orderId = ins.lastInsertRowid;

      // Insert items and reduce variant inventory
      for (const it of itemsToOrder) {
        const vId = it.variantId || it.id;
        const qty = Number(it.quantity) || 1;
        const price = Number(it.unitPrice || it.price) || 0;

        run(
          `INSERT INTO order_items (order_id, product_id, variant_id, name, color, size, unit_price, quantity, image_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [orderId, it.productId || null, vId, it.name || it.title || 'Denim Item', it.color || 'Default', it.size || '32', price, qty, it.imageUrl || null]
        );

        run('UPDATE product_variants SET stock = MAX(0, stock - ?) WHERE id = ?', [qty, vId]);
      }

      // Insert Timeline events
      run(`INSERT INTO order_events (order_id, label, state, detail, at, position) VALUES
        (?, 'Order Placed & Confirmed', 'done', 'Payment received and verified.', datetime('now'), 1),
        (?, 'Preparing in Atelier', 'current', 'Quality inspected & packaged in custom denim dust bag.', datetime('now', '+2 hours'), 2),
        (?, 'Handed to Blue Dart', 'pending', 'Courier dispatch scheduled.', datetime('now', '+1 day'), 3),
        (?, 'Out for Delivery', 'pending', 'Out with courier partner.', datetime('now', '+3 days'), 4),
        (?, 'Delivered', 'pending', 'Delivered to shipping address.', datetime('now', '+4 days'), 5)
      `, [orderId, orderId, orderId, orderId, orderId]);

      // Award loyalty points to user (1 pt per ₹1)
      if (userId) {
        run('UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?', [total, userId]);
        run('INSERT INTO loyalty_ledger (user_id, delta, reason, order_id) VALUES (?, ?, ?, ?)', [userId, total, 'Earned from order ' + num, orderId]);
        // Clear user cart
        run('DELETE FROM cart_items WHERE user_id = ?', [userId]);
      }

      return get('SELECT * FROM orders WHERE id = ?', [orderId]);
    });

    res.status(201).json({
      ok: true,
      orderNumber: orderRow.order_number,
      order: {
        id: orderRow.id,
        orderNumber: orderRow.order_number,
        total: orderRow.total,
        status: orderRow.status,
        paymentStatus: orderRow.payment_status,
      }
    });
  })
);

module.exports = router;
