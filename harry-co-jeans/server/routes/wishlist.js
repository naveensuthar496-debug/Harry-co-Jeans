'use strict';

const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db/database');
const { asyncHandler, HttpError } = require('../middleware/error');
const { requireAuth } = require('../middleware/auth');
const { formatProduct } = require('./products');

// GET /api/wishlist
router.get(
  '/',
  requireAuth,
  asyncHandler((req, res) => {
    const rows = all(
      `SELECT p.*, w.added_at as wishlist_added_at
       FROM wishlist_items w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = ?
       ORDER BY w.added_at DESC`,
      [req.user.id]
    );

    res.json({ items: rows.map(formatProduct) });
  })
);

// POST /api/wishlist/toggle
router.post(
  '/toggle',
  requireAuth,
  asyncHandler((req, res) => {
    const { productId } = req.body;
    if (!productId) throw new HttpError(400, 'productId is required');

    const existing = get(
      'SELECT id FROM wishlist_items WHERE user_id = ? AND product_id = ?',
      [req.user.id, productId]
    );

    let inWishlist = false;
    if (existing) {
      run('DELETE FROM wishlist_items WHERE id = ?', [existing.id]);
      inWishlist = false;
    } else {
      run('INSERT INTO wishlist_items (user_id, product_id) VALUES (?, ?)', [req.user.id, productId]);
      inWishlist = true;
    }

    res.json({ inWishlist });
  })
);

// DELETE /api/wishlist/:productId
router.delete(
  '/:productId',
  requireAuth,
  asyncHandler((req, res) => {
    const pId = Number(req.params.productId);
    run('DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?', [req.user.id, pId]);
    res.json({ ok: true });
  })
);

module.exports = router;
