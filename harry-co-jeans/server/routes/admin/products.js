'use strict';

const path = require('node:path');
const fs = require('node:fs');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { get, all, run, tx } = require('../../db/database');
const { asyncHandler, HttpError } = require('../../middleware/error');
const { requireStaff } = require('../../middleware/auth');
const { slugify, variantSku } = require('../../lib/ids');
const v = require('../../middleware/validate');

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '..', '..', '..', 'public', 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Setup multer storage for product image uploads
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueName = `product_${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new HttpError(400, 'Only image files are allowed'));
  }
});

// Guard all admin routes with requireStaff
router.use(requireStaff);

// POST /api/admin/products/upload — image upload
router.post(
  '/upload',
  upload.single('image'),
  asyncHandler((req, res) => {
    if (!req.file) throw new HttpError(400, 'No image file uploaded');
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename });
  })
);

// GET /api/admin/products — list all products with stock & stats
router.get(
  '/',
  asyncHandler((req, res) => {
    const { q, status, limit = 100, offset = 0 } = req.query;
    const conditions = [];
    const params = [];

    if (status && status !== 'all') {
      conditions.push('p.status = ?');
      params.push(status);
    }
    if (q) {
      conditions.push('(p.title LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)');
      const term = `%${q.trim()}%`;
      params.push(term, term, term);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT
        p.*,
        c.name as collection_name,
        COALESCE((SELECT SUM(stock) FROM product_variants WHERE product_id = p.id), 0) as total_stock,
        (SELECT url FROM product_images WHERE product_id = p.id ORDER BY is_main DESC, position ASC LIMIT 1) as main_image
      FROM products p
      LEFT JOIN collections c ON p.collection_id = c.id
      ${whereClause}
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `;
    params.push(Number(limit), Number(offset));

    const rows = all(sql, params);

    const products = rows.map(r => ({
      id: r.id,
      sku: r.sku,
      title: r.title,
      slug: r.slug,
      brand: r.brand,
      fit: r.fit,
      productType: r.product_type,
      gender: r.gender,
      basePrice: r.base_price,
      compareAtPrice: r.compare_at_price,
      status: r.status,
      isNew: Boolean(r.is_new),
      rating: r.rating,
      reviewCount: r.review_count,
      totalStock: r.total_stock,
      mainImage: r.main_image || '',
      createdAt: r.created_at,
    }));

    const countRow = get(`SELECT COUNT(*) as c FROM products p ${whereClause}`, params.slice(0, -2));

    res.json({
      products,
      total: countRow ? countRow.c : products.length,
    });
  })
);

// GET /api/admin/products/:id — single product for editing
router.get(
  '/:id',
  asyncHandler((req, res) => {
    const id = Number(req.params.id);
    const p = get(
      `SELECT p.*, c.name as collection_name
       FROM products p
       LEFT JOIN collections c ON p.collection_id = c.id
       WHERE p.id = ?`,
      [id]
    );

    if (!p) throw new HttpError(404, 'Product not found');

    const images = all(
      'SELECT id, url, alt, is_main as isMain, position FROM product_images WHERE product_id = ? ORDER BY position ASC, id ASC',
      [id]
    );
    const variants = all(
      'SELECT id, size, color, color_hex as colorHex, sku, price, stock, reorder_point as reorderPoint FROM product_variants WHERE product_id = ? ORDER BY id ASC',
      [id]
    );

    let fitStyling = [];
    try { fitStyling = typeof p.fit_styling === 'string' ? JSON.parse(p.fit_styling) : (p.fit_styling || []); } catch { fitStyling = []; }

    let tags = [];
    try { tags = typeof p.tags === 'string' ? JSON.parse(p.tags) : (p.tags || []); } catch { tags = []; }

    res.json({
      product: {
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
        isNew: Boolean(p.is_new),
        tags,
        collectionId: p.collection_id,
        status: p.status,
        images,
        variants,
      }
    });
  })
);

// POST /api/admin/products — create new product
router.post(
  '/',
  asyncHandler((req, res) => {
    const title = v.str(req.body.title, { field: 'title', required: true });
    const basePrice = Math.max(0, parseInt(req.body.basePrice, 10) || 0);
    const compareAtPrice = req.body.compareAtPrice ? parseInt(req.body.compareAtPrice, 10) : null;
    const brand = v.str(req.body.brand, { field: 'brand' }) || 'HARRY & CO';
    const fit = v.str(req.body.fit, { field: 'fit' }) || 'straight';
    const productType = v.str(req.body.productType, { field: 'productType' }) || 'Jeans';
    const gender = v.str(req.body.gender, { field: 'gender' }) || 'unisex';
    const description = v.str(req.body.description, { field: 'description' }) || '';
    const fabricCare = v.str(req.body.fabricCare, { field: 'fabricCare' }) || '';
    const status = ['active', 'draft', 'archived'].includes(req.body.status) ? req.body.status : 'active';
    const isNew = req.body.isNew ? 1 : 0;
    const collectionId = req.body.collectionId ? Number(req.body.collectionId) : null;

    let sku = v.str(req.body.sku, { field: 'sku' });
    if (!sku) {
      sku = 'HC-' + Math.floor(1000 + Math.random() * 9000);
    }
    let slug = v.str(req.body.slug, { field: 'slug' }) || slugify(title);

    // Ensure unique slug
    const existingSlug = get('SELECT id FROM products WHERE slug = ?', [slug]);
    if (existingSlug) {
      slug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    let fitStyling = [];
    if (Array.isArray(req.body.fitStyling)) fitStyling = req.body.fitStyling;
    else if (typeof req.body.fitStyling === 'string' && req.body.fitStyling.trim()) {
      fitStyling = req.body.fitStyling.split('\n').map(s => s.trim()).filter(Boolean);
    }

    let tags = [];
    if (Array.isArray(req.body.tags)) tags = req.body.tags;
    else if (typeof req.body.tags === 'string' && req.body.tags.trim()) {
      tags = req.body.tags.split(',').map(s => s.trim()).filter(Boolean);
    }

    const newProduct = tx(() => {
      const ins = run(
        `INSERT INTO products (
          sku, title, slug, brand, fit, product_type, gender,
          description, fit_styling, fabric_care, base_price, compare_at_price,
          is_new, tags, collection_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sku, title, slug, brand, fit, productType, gender,
          description, JSON.stringify(fitStyling), fabricCare, basePrice, compareAtPrice,
          isNew, JSON.stringify(tags), collectionId, status
        ]
      );
      const productId = ins.lastInsertRowid;

      // Handle Images
      const images = Array.isArray(req.body.images) ? req.body.images : [];
      if (images.length === 0 && req.body.imageUrl) {
        images.push({ url: req.body.imageUrl, isMain: 1, position: 0 });
      }

      images.forEach((img, idx) => {
        const url = typeof img === 'string' ? img : img.url;
        if (url) {
          run(
            `INSERT INTO product_images (product_id, url, alt, is_main, position)
             VALUES (?, ?, ?, ?, ?)`,
            [productId, url, img.alt || title, img.isMain ? 1 : (idx === 0 ? 1 : 0), idx]
          );
        }
      });

      // Handle Variants
      const variants = Array.isArray(req.body.variants) && req.body.variants.length > 0
        ? req.body.variants
        : ['28', '30', '32', '34', '36', '38'].map(size => ({ size, price: basePrice, stock: 20, color: 'Raw Indigo' }));

      variants.forEach(vObj => {
        const sz = vObj.size || '32';
        const clr = vObj.color || 'Default';
        const vPrice = vObj.price ? Number(vObj.price) : basePrice;
        const vStock = vObj.stock !== undefined ? Math.max(0, parseInt(vObj.stock, 10)) : 20;
        const vSku = vObj.sku || variantSku(sku, sz, clr);

        run(
          `INSERT INTO product_variants (product_id, size, color, color_hex, sku, price, stock)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [productId, sz, clr, vObj.colorHex || null, vSku, vPrice, vStock]
        );
      });

      return get('SELECT * FROM products WHERE id = ?', [productId]);
    });

    res.status(201).json({ ok: true, product: newProduct });
  })
);

// PATCH /api/admin/products/:id — edit existing product
router.patch(
  '/:id',
  asyncHandler((req, res) => {
    const id = Number(req.params.id);
    const existing = get('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing) throw new HttpError(404, 'Product not found');

    const title = req.body.title ?? existing.title;
    const sku = req.body.sku ?? existing.sku;
    const slug = req.body.slug ?? existing.slug;
    const brand = req.body.brand ?? existing.brand;
    const fit = req.body.fit ?? existing.fit;
    const productType = req.body.productType ?? existing.product_type;
    const gender = req.body.gender ?? existing.gender;
    const description = req.body.description ?? existing.description;
    const fabricCare = req.body.fabricCare ?? existing.fabric_care;
    const basePrice = req.body.basePrice !== undefined ? parseInt(req.body.basePrice, 10) : existing.base_price;
    const compareAtPrice = req.body.compareAtPrice !== undefined ? (req.body.compareAtPrice ? parseInt(req.body.compareAtPrice, 10) : null) : existing.compare_at_price;
    const status = req.body.status ?? existing.status;
    const isNew = req.body.isNew !== undefined ? (req.body.isNew ? 1 : 0) : existing.is_new;

    let fitStyling = existing.fit_styling;
    if (req.body.fitStyling !== undefined) {
      if (Array.isArray(req.body.fitStyling)) fitStyling = JSON.stringify(req.body.fitStyling);
      else if (typeof req.body.fitStyling === 'string') fitStyling = JSON.stringify(req.body.fitStyling.split('\n').map(s => s.trim()).filter(Boolean));
    }

    let tags = existing.tags;
    if (req.body.tags !== undefined) {
      if (Array.isArray(req.body.tags)) tags = JSON.stringify(req.body.tags);
      else if (typeof req.body.tags === 'string') tags = JSON.stringify(req.body.tags.split(',').map(s => s.trim()).filter(Boolean));
    }

    tx(() => {
      run(
        `UPDATE products SET
          title = ?, sku = ?, slug = ?, brand = ?, fit = ?, product_type = ?,
          gender = ?, description = ?, fit_styling = ?, fabric_care = ?,
          base_price = ?, compare_at_price = ?, is_new = ?, tags = ?, status = ?
         WHERE id = ?`,
        [
          title, sku, slug, brand, fit, productType,
          gender, description, fitStyling, fabricCare,
          basePrice, compareAtPrice, isNew, tags, status, id
        ]
      );

      // If images provided, update them
      if (Array.isArray(req.body.images)) {
        run('DELETE FROM product_images WHERE product_id = ?', [id]);
        req.body.images.forEach((img, idx) => {
          const url = typeof img === 'string' ? img : img.url;
          if (url) {
            run(
              `INSERT INTO product_images (product_id, url, alt, is_main, position)
               VALUES (?, ?, ?, ?, ?)`,
              [id, url, img.alt || title, img.isMain ? 1 : (idx === 0 ? 1 : 0), idx]
            );
          }
        });
      }

      // If variants provided, update them
      if (Array.isArray(req.body.variants)) {
        run('DELETE FROM product_variants WHERE product_id = ?', [id]);
        req.body.variants.forEach(vObj => {
          const sz = vObj.size || '32';
          const clr = vObj.color || 'Default';
          const vPrice = vObj.price ? Number(vObj.price) : basePrice;
          const vStock = vObj.stock !== undefined ? Math.max(0, parseInt(vObj.stock, 10)) : 20;
          const vSku = vObj.sku || variantSku(sku, sz, clr);

          run(
            `INSERT INTO product_variants (product_id, size, color, color_hex, sku, price, stock)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, sz, clr, vObj.colorHex || null, vSku, vPrice, vStock]
          );
        });
      }
    });

    const updated = get('SELECT * FROM products WHERE id = ?', [id]);
    res.json({ ok: true, product: updated });
  })
);

// DELETE /api/admin/products/:id — delete product and all dependencies
router.delete(
  '/:id',
  asyncHandler((req, res) => {
    const id = Number(req.params.id);
    const existing = get('SELECT id, title FROM products WHERE id = ?', [id]);
    if (!existing) throw new HttpError(404, 'Product not found');

    tx(() => {
      // Clean up wishlist items referencing this product
      run('DELETE FROM wishlist_items WHERE product_id = ?', [id]);
      // Clean up cart items referencing product variants
      run('DELETE FROM cart_items WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = ?)', [id]);
      // Product variants, images, reviews cascade delete via FK ON DELETE CASCADE in SQLite
      run('DELETE FROM product_images WHERE product_id = ?', [id]);
      run('DELETE FROM product_variants WHERE product_id = ?', [id]);
      run('DELETE FROM reviews WHERE product_id = ?', [id]);
      // Delete the product itself
      run('DELETE FROM products WHERE id = ?', [id]);
    });

    res.json({ ok: true, message: `Product '${existing.title}' deleted successfully` });
  })
);

module.exports = router;
