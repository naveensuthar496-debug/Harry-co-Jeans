'use strict';

const express = require('express');
const router = express.Router();
const { get, all } = require('../db/database');
const { asyncHandler, HttpError } = require('../middleware/error');
const { requireAuth } = require('../middleware/auth');

function formatOrder(ord) {
  if (!ord) return null;
  const items = all(
    `SELECT id, product_id as productId, variant_id as variantId,
            name, color, size, unit_price as unitPrice, quantity, image_url as imageUrl
     FROM order_items WHERE order_id = ?`,
    [ord.id]
  );
  const events = all(
    'SELECT id, label, state, detail, at, position FROM order_events WHERE order_id = ? ORDER BY position ASC',
    [ord.id]
  );

  let shippingAddress = {};
  try { shippingAddress = typeof ord.shipping_address === 'string' ? JSON.parse(ord.shipping_address) : (ord.shipping_address || {}); } catch { shippingAddress = {}; }

  return {
    id: ord.id,
    orderNumber: ord.order_number,
    userId: ord.user_id,
    status: ord.status,
    paymentMethod: ord.payment_method,
    paymentStatus: ord.payment_status,
    subtotal: ord.subtotal,
    discount: ord.discount,
    couponCode: ord.coupon_code,
    shipping: ord.shipping,
    tax: ord.tax,
    total: ord.total,
    shippingAddress,
    estimatedDelivery: ord.estimated_delivery,
    carrier: ord.carrier,
    trackingNumber: ord.tracking_number,
    placedAt: ord.placed_at,
    items,
    events,
  };
}

// GET /api/orders — current user's order history
router.get(
  '/',
  requireAuth,
  asyncHandler((req, res) => {
    const rows = all(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY placed_at DESC',
      [req.user.id]
    );
    res.json({ orders: rows.map(formatOrder) });
  })
);

// GET /api/orders/:orderNumber — order details & receipt
router.get(
  '/:orderNumber',
  asyncHandler((req, res) => {
    const { orderNumber } = req.params;
    const cleanNum = orderNumber.startsWith('#') ? orderNumber : '#' + orderNumber;

    const row = get(
      'SELECT * FROM orders WHERE order_number = ? OR order_number = ?',
      [orderNumber, cleanNum]
    );

    if (!row) throw new HttpError(404, 'Order not found');

    // If logged in as customer, verify ownership unless staff
    if (req.user && req.user.role === 'customer' && row.user_id && row.user_id !== req.user.id) {
      throw new HttpError(403, 'Unauthorized to view this order');
    }

    res.json({ order: formatOrder(row) });
  })
);

module.exports = router;
module.exports.formatOrder = formatOrder;
