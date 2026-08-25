'use strict';

const express = require('express');
const router = express.Router();
const { get, all, run } = require('../../db/database');
const { asyncHandler, HttpError } = require('../../middleware/error');
const { requireStaff } = require('../../middleware/auth');

router.use(requireStaff);

// GET /api/admin/inventory — all variants matrix
router.get(
  '/',
  asyncHandler((_req, res) => {
    const rows = all(`
      SELECT
        v.id as variantId,
        v.sku,
        v.size,
        v.color,
        v.price,
        v.stock,
        v.reorder_point as reorderPoint,
        p.id as productId,
        p.title as productName,
        p.fit,
        (SELECT url FROM product_images WHERE product_id = p.id ORDER BY is_main DESC, position ASC LIMIT 1) as imageUrl
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      ORDER BY p.id ASC, v.id ASC
    `);

    res.json({ inventory: rows });
  })
);

// PATCH /api/admin/inventory/:variantId — quick update stock
router.patch(
  '/:variantId',
  asyncHandler((req, res) => {
    const variantId = Number(req.params.variantId);
    const stock = parseInt(req.body.stock, 10);
    if (isNaN(stock) || stock < 0) throw new HttpError(400, 'Valid stock number is required');

    const v = get('SELECT id FROM product_variants WHERE id = ?', [variantId]);
    if (!v) throw new HttpError(404, 'Variant not found');

    run('UPDATE product_variants SET stock = ? WHERE id = ?', [stock, variantId]);
    const updated = get('SELECT * FROM product_variants WHERE id = ?', [variantId]);
    res.json({ ok: true, variant: updated });
  })
);

module.exports = router;
