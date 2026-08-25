'use strict';

const express = require('express');
const router = express.Router();
const { get, all } = require('../db/database');
const { asyncHandler, HttpError } = require('../middleware/error');

// Helper to attach images and variants to a product row
function formatProduct(p) {
  if (!p) return null;
  const images = all(
    'SELECT id, url, alt, is_main as isMain, position FROM product_images WHERE product_id = ? ORDER BY position ASC, id ASC',
    [p.id]
  );
  const variants = all(
    'SELECT id, size, color, color_hex as colorHex, sku, price, stock, reorder_point as reorderPoint FROM product_variants WHERE product_id = ? ORDER BY id ASC',
    [p.id]
  );

  let fitStyling = [];
  try { fitStyling = typeof p.fit_styling === 'string' ? JSON.parse(p.fit_styling) : (p.fit_styling || []); } catch { fitStyling = []; }

  let tags = [];
  try { tags = typeof p.tags === 'string' ? JSON.parse(p.tags) : (p.tags || []); } catch { tags = []; }

  return {
    id: p.id,
    sku: p.sku,
    title: p.title,
    slug: p.slug,
    brand: p.brand,
    fit: p.fit,
    productType: p.product_type,
    gender: p.gender,
    description: p.description,
    fitStyling,
    fabricCare: p.fabric_care,
    basePrice: p.base_price,
    compareAtPrice: p.compare_at_price,
    rating: p.rating,
    reviewCount: p.review_count,
    isNew: Boolean(p.is_new),
    tags,
    collectionId: p.collection_id,
    collectionName: p.collection_name || null,
    status: p.status,
    createdAt: p.created_at,
    mainImage: (images.find(i => i.isMain) || images[0] || {}).url || '',
    images,
    variants,
  };
}

// GET /api/products — list active products with filtering, sorting, searching
router.get(
  '/',
  asyncHandler((req, res) => {
    const { fit, gender, type, collection, q, sort = 'recommended', limit = 50, offset = 0 } = req.query;

    const conditions = ["p.status = 'active'"];
    const params = [];

    if (fit && fit !== 'all') {
      conditions.push('p.fit = ?');
      params.push(fit);
    }
    if (gender && gender !== 'all') {
      conditions.push('(p.gender = ? OR p.gender = \'unisex\')');
      params.push(gender);
    }
    if (type && type !== 'all') {
      conditions.push('p.product_type = ?');
      params.push(type);
    }
    if (collection) {
      conditions.push('(c.slug = ? OR c.id = ?)');
      params.push(collection, Number(collection) || 0);
    }
    if (q) {
      conditions.push('(p.title LIKE ? OR p.description LIKE ? OR p.brand LIKE ? OR p.tags LIKE ?)');
      const term = `%${q.trim()}%`;
      params.push(term, term, term, term);
    }

    let orderBy = 'p.is_new DESC, p.id DESC';
    if (sort === 'newest') orderBy = 'p.created_at DESC';
    else if (sort === 'price-low') orderBy = 'p.base_price ASC';
    else if (sort === 'price-high') orderBy = 'p.base_price DESC';
    else if (sort === 'rating') orderBy = 'p.rating DESC';

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT p.*, c.name as collection_name
      FROM products p
      LEFT JOIN collections c ON p.collection_id = c.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
    params.push(Number(limit), Number(offset));

    const rows = all(sql, params);
    const products = rows.map(formatProduct);

    const totalRow = get(
      `SELECT COUNT(*) as count FROM products p LEFT JOIN collections c ON p.collection_id = c.id ${whereClause}`,
      params.slice(0, -2)
    );

    res.json({
      products,
      total: totalRow ? totalRow.count : products.length,
      limit: Number(limit),
      offset: Number(offset),
    });
  })
);

// GET /api/products/featured — featured selection
router.get(
  '/featured',
  asyncHandler((_req, res) => {
    const rows = all(`
      SELECT p.*, c.name as collection_name
      FROM products p
      LEFT JOIN collections c ON p.collection_id = c.id
      WHERE p.status = 'active'
      ORDER BY p.is_new DESC, p.rating DESC
      LIMIT 8
    `);
    res.json({ products: rows.map(formatProduct) });
  })
);

// GET /api/products/:slugOrId — single product details
router.get(
  '/:slugOrId',
  asyncHandler((req, res) => {
    const { slugOrId } = req.params;
    const isId = /^\d+$/.test(slugOrId);

    const row = get(
      `SELECT p.*, c.name as collection_name
       FROM products p
       LEFT JOIN collections c ON p.collection_id = c.id
       WHERE (p.id = ? OR p.slug = ?)`,
      [isId ? Number(slugOrId) : -1, slugOrId]
    );

    if (!row) throw new HttpError(404, 'Product not found');
    res.json({ product: formatProduct(row) });
  })
);

module.exports = router;
module.exports.formatProduct = formatProduct;
