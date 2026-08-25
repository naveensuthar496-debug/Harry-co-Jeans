'use strict';

const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db/database');
const { asyncHandler, HttpError } = require('../middleware/error');
const { requireAuth } = require('../middleware/auth');

function computeCart(userId) {
  const items = all(
    `SELECT
      ci.id,
      ci.variant_id as variantId,
      ci.quantity,
      v.size,
      v.color,
      v.sku,
      v.price as unitPrice,
      v.stock,
      p.id as productId,
      p.title as name,
      p.slug as productSlug,
      p.brand,
      (SELECT url FROM product_images WHERE product_id = p.id ORDER BY is_main DESC, position ASC LIMIT 1) as imageUrl
     FROM cart_items ci
     JOIN product_variants v ON ci.variant_id = v.id
     JOIN products p ON v.product_id = p.id
     WHERE ci.user_id = ?
     ORDER BY ci.added_at DESC`,
    [userId]
  );

  const subtotal = items.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0);
  const shipping = subtotal > 0 && subtotal < 2500 ? 150 : 0; // Free shipping above ₹2,500
  const tax = Math.round(subtotal * 0.12); // 12% GST breakdown (included in total or added)
  const total = subtotal + shipping;

  return {
    items,
    totals: {
      subtotal,
      shipping,
      tax,
      discount: 0,
      total,
    }
  };
}

// GET /api/cart
router.get(
  '/',
  asyncHandler((req, res) => {
    if (!req.user) {
      return res.json({ items: [], totals: { subtotal: 0, shipping: 0, tax: 0, total: 0 } });
    }
    res.json(computeCart(req.user.id));
  })
);

// POST /api/cart
router.post(
  '/',
  requireAuth,
  asyncHandler((req, res) => {
    const { variantId, quantity = 1 } = req.body;
    if (!variantId) throw new HttpError(400, 'variantId is required');

    const variant = get('SELECT id, stock FROM product_variants WHERE id = ?', [variantId]);
    if (!variant) throw new HttpError(404, 'Variant not found');

    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    const existing = get(
      'SELECT id, quantity FROM cart_items WHERE user_id = ? AND variant_id = ?',
      [req.user.id, variantId]
    );

    if (existing) {
      const newQty = existing.quantity + qty;
      run('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing.id]);
    } else {
      run(
        'INSERT INTO cart_items (user_id, variant_id, quantity) VALUES (?, ?, ?)',
        [req.user.id, variantId, qty]
      );
    }

    res.json(computeCart(req.user.id));
  })
);

// PATCH /api/cart/:id
router.patch(
  '/:id',
  requireAuth,
  asyncHandler((req, res) => {
    const itemId = Number(req.params.id);
    const qty = parseInt(req.body.quantity, 10);

    const item = get('SELECT * FROM cart_items WHERE id = ? AND user_id = ?', [itemId, req.user.id]);
    if (!item) throw new HttpError(404, 'Cart item not found');

    if (qty <= 0) {
      run('DELETE FROM cart_items WHERE id = ?', [itemId]);
    } else {
      run('UPDATE cart_items SET quantity = ? WHERE id = ?', [qty, itemId]);
    }

    res.json(computeCart(req.user.id));
  })
);

// DELETE /api/cart/:id
router.delete(
  '/:id',
  requireAuth,
  asyncHandler((req, res) => {
    const itemId = Number(req.params.id);
    run('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [itemId, req.user.id]);
    res.json(computeCart(req.user.id));
  })
);

// DELETE /api/cart (clear)
router.delete(
  '/',
  requireAuth,
  asyncHandler((req, res) => {
    run('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    res.json(computeCart(req.user.id));
  })
);

module.exports = router;
