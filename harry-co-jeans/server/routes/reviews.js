'use strict';

const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db/database');
const { asyncHandler, HttpError } = require('../middleware/error');
const { requireAuth } = require('../middleware/auth');
const v = require('../middleware/validate');

// GET /api/reviews?productId=...
router.get(
  '/',
  asyncHandler((req, res) => {
    const { productId } = req.query;
    if (!productId) throw new HttpError(400, 'productId query parameter is required');

    const reviews = all(
      `SELECT r.id, r.product_id as productId, r.user_id as userId,
              r.author, r.rating, r.title, r.body, r.created_at as createdAt
       FROM reviews r
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC`,
      [Number(productId)]
    );

    const stats = get(
      `SELECT AVG(rating) as avgRating, COUNT(*) as totalReviews
       FROM reviews WHERE product_id = ?`,
      [Number(productId)]
    );

    res.json({
      reviews,
      avgRating: stats ? Number(stats.avgRating || 0).toFixed(1) : '0.0',
      totalReviews: stats ? stats.totalReviews : 0,
    });
  })
);

// POST /api/reviews
router.post(
  '/',
  asyncHandler((req, res) => {
    const productId = Number(req.body.productId);
    if (!productId) throw new HttpError(400, 'productId is required');

    const rating = Math.min(5, Math.max(1, parseInt(req.body.rating, 10) || 5));
    const title = v.str(req.body.title, { field: 'title', max: 100 }) || 'Great Quality';
    const body = v.str(req.body.body, { field: 'body', required: true });
    const author = req.user ? (req.user.full_name || req.user.email) : (req.body.author || 'Denim Enthusiast');
    const userId = req.user ? req.user.id : null;

    const result = run(
      `INSERT INTO reviews (product_id, user_id, author, rating, title, body)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [productId, userId, author, rating, title, body]
    );

    // Update product average rating & review count
    const stats = get('SELECT AVG(rating) as avgR, COUNT(*) as cnt FROM reviews WHERE product_id = ?', [productId]);
    if (stats) {
      run(
        'UPDATE products SET rating = ?, review_count = ? WHERE id = ?',
        [Number(stats.avgR || 0).toFixed(1), stats.cnt, productId]
      );
    }

    const review = get('SELECT * FROM reviews WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ review });
  })
);

module.exports = router;
