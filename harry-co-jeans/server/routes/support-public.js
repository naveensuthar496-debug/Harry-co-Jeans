'use strict';

const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db/database');
const { asyncHandler, HttpError } = require('../middleware/error');
const v = require('../middleware/validate');

// POST /api/support/message — public contact message
router.post(
  '/message',
  asyncHandler((req, res) => {
    const email = v.email(req.body.email);
    const subject = v.str(req.body.subject, { field: 'subject', max: 120 }) || 'Store Inquiry';
    const message = v.str(req.body.message, { field: 'message', required: true });
    const orderNumber = v.str(req.body.orderNumber, { field: 'orderNumber' });

    let orderId = null;
    if (orderNumber) {
      const ord = get('SELECT id FROM orders WHERE order_number = ?', [orderNumber]);
      if (ord) orderId = ord.id;
    }

    const conv = run(
      `INSERT INTO support_conversations (user_id, subject, status, order_id)
       VALUES (?, ?, 'open', ?)`,
      [req.user ? req.user.id : null, subject, orderId]
    );

    run(
      `INSERT INTO support_messages (conversation_id, sender_type, sender_id, body)
       VALUES (?, 'customer', ?, ?)`,
      [conv.lastInsertRowid, req.user ? req.user.id : null, message]
    );

    res.json({ ok: true, message: 'Your support ticket has been opened. Our atelier team will reply shortly.' });
  })
);

module.exports = router;
