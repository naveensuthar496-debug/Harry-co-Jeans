'use strict';

const express = require('express');
const router = express.Router();
const { get, all, run } = require('../../db/database');
const { asyncHandler, HttpError } = require('../../middleware/error');
const { requireStaff } = require('../../middleware/auth');
const { formatOrder } = require('../orders');

router.use(requireStaff);

// GET /api/admin/orders — list all orders
router.get(
  '/',
  asyncHandler((req, res) => {
    const { status, q, limit = 100, offset = 0 } = req.query;
    const conditions = [];
    const params = [];

    if (status && status !== 'all') {
      conditions.push('o.status = ?');
      params.push(status);
    }
    if (q) {
      conditions.push('(o.order_number LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)');
      const term = `%${q.trim()}%`;
      params.push(term, term, term);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT o.*, u.full_name as customer_name, u.email as customer_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ${whereClause}
      ORDER BY o.placed_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(Number(limit), Number(offset));

    const rows = all(sql, params);
    const orders = rows.map(r => ({
      ...formatOrder(r),
      customerName: r.customer_name || 'Guest Checkout',
      customerEmail: r.customer_email || '',
    }));

    res.json({ orders, total: orders.length });
  })
);

// PATCH /api/admin/orders/:id/status — update order status
router.patch(
  '/:id/status',
  asyncHandler((req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;

    const validStatuses = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new HttpError(400, `Invalid status. Valid values: ${validStatuses.join(', ')}`);
    }

    const ord = get('SELECT * FROM orders WHERE id = ?', [id]);
    if (!ord) throw new HttpError(404, 'Order not found');

    run('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    // Add status event to timeline
    run(
      `INSERT INTO order_events (order_id, label, state, detail, at, position)
       VALUES (?, ?, 'done', ?, datetime('now'), (SELECT COALESCE(MAX(position),0) + 1 FROM order_events WHERE order_id = ?))`,
      [id, `Status updated to ${status.toUpperCase()}`, `Updated by admin staff on ${new Date().toLocaleDateString()}`, id]
    );

    const updated = get('SELECT * FROM orders WHERE id = ?', [id]);
    res.json({ ok: true, order: formatOrder(updated) });
  })
);

module.exports = router;
