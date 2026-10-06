import express from 'express';
import { db } from '../config/database.js';

const router = express.Router();

// GET /api/v1/products - Filterable, searchable product catalog
router.get('/', (req, res) => {
  try {
    const {
      category,
      collection,
      fit,
      wash,
      min_price,
      max_price,
      sort,
      search,
      featured,
      new_arrivals,
      bestsellers,
      sale,
      limit = 50,
      offset = 0
    } = req.query;

    let query = `
      SELECT p.*, c.name as category_name, col.name as collection_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN collections col ON p.collection_id = col.id
      WHERE p.status = 'active'
    `;
    const params = [];

    if (category) {
      query += ` AND (c.slug = ? OR c.id = ?)`;
      params.push(category, category);
    }

    if (collection) {
      query += ` AND (col.slug = ? OR col.id = ?)`;
      params.push(collection, collection);
    }

    if (fit) {
      query += ` AND LOWER(p.fit) LIKE LOWER(?)`;
      params.push(`%${fit}%`);
    }

    if (wash) {
      query += ` AND LOWER(p.wash) LIKE LOWER(?)`;
      params.push(`%${wash}%`);
    }

    if (min_price) {
      query += ` AND p.price >= ?`;
      params.push(parseFloat(min_price));
    }

    if (max_price) {
      query += ` AND p.price <= ?`;
      params.push(parseFloat(max_price));
    }

    if (featured === '1' || featured === 'true') {
      query += ` AND p.is_featured = 1`;
    }

    if (new_arrivals === '1' || new_arrivals === 'true') {
      query += ` AND p.is_new_arrival = 1`;
    }

    if (bestsellers === '1' || bestsellers === 'true') {
      query += ` AND p.is_bestseller = 1`;
    }

    if (sale === '1' || sale === 'true') {
      query += ` AND p.is_sale = 1`;
    }

    if (search) {
      query += ` AND (
        LOWER(p.name) LIKE LOWER(?) OR 
        LOWER(p.description) LIKE LOWER(?) OR 
        LOWER(p.fit) LIKE LOWER(?) OR 
        LOWER(p.fabric) LIKE LOWER(?) OR 
        LOWER(p.sku) LIKE LOWER(?)
      )`;
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    // Sorting
    if (sort === 'price_asc') {
      query += ` ORDER BY p.price ASC`;
    } else if (sort === 'price_desc') {
      query += ` ORDER BY p.price DESC`;
    } else if (sort === 'newest') {
      query += ` ORDER BY p.created_at DESC`;
    } else if (sort === 'bestseller') {
      query += ` ORDER BY p.is_bestseller DESC, p.created_at DESC`;
    } else {
      query += ` ORDER BY p.display_order ASC, p.id DESC`;
    }

    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    // Handle display_order fallback safely
    query = query.replace('p.display_order ASC, ', '');

    const products = db.prepare(query).all(...params);

    // Fetch variants for each product
    const variantStmt = db.prepare(`
      SELECT id, size, length, sku, stock, additional_price
      FROM product_variants
      WHERE product_id = ?
      ORDER BY id ASC
    `);

    // Fetch review aggregates for each product
    const reviewAggStmt = db.prepare(`
      SELECT COUNT(*) as review_count, COALESCE(AVG(rating), 0) as avg_rating
      FROM reviews
      WHERE product_id = ? AND status = 'approved'
    `);

    const enriched = products.map(p => {
      let images = [];
      try {
        images = JSON.parse(p.images);
      } catch (e) {
        images = [];
      }

      const variants = variantStmt.all(p.id);
      const reviewAgg = reviewAggStmt.get(p.id);

      return {
        ...p,
        images,
        variants,
        reviewCount: reviewAgg ? reviewAgg.review_count : 0,
        averageRating: reviewAgg ? parseFloat(reviewAgg.avg_rating.toFixed(1)) : 0
      };
    });

    res.json({
      success: true,
      count: enriched.length,
      products: enriched
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving products.' });
  }
});

// GET /api/v1/products/:identifier (slug or id)
router.get('/:identifier', (req, res) => {
  try {
    const { identifier } = req.params;
    const isNum = /^\d+$/.test(identifier);

    const query = `
      SELECT p.*, c.name as category_name, col.name as collection_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN collections col ON p.collection_id = col.id
      WHERE (p.slug = ? OR p.id = ?) AND p.status = 'active'
    `;

    const product = db.prepare(query).get(identifier, isNum ? parseInt(identifier, 10) : -1);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    let images = [];
    try {
      images = JSON.parse(product.images);
    } catch (e) {
      images = [];
    }

    const variants = db.prepare(`
      SELECT id, size, length, sku, stock, additional_price
      FROM product_variants
      WHERE product_id = ?
      ORDER BY id ASC
    `).all(product.id);

    const reviews = db.prepare(`
      SELECT id, customer_name, rating, title, comment, verified_purchase, created_at
      FROM reviews
      WHERE product_id = ? AND status = 'approved'
      ORDER BY created_at DESC
    `).all(product.id);

    const avgRating = reviews.length > 0
      ? parseFloat((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
      : 0;

    res.json({
      success: true,
      product: {
        ...product,
        images,
        variants,
        reviews,
        reviewCount: reviews.length,
        averageRating: avgRating
      }
    });
  } catch (err) {
    console.error('Error fetching single product:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving product.' });
  }
});

// GET /api/v1/products/categories/all
router.get('/meta/categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
      WHERE c.enabled = 1
      GROUP BY c.id
      ORDER BY c.display_order ASC
    `).all();

    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching categories.' });
  }
});

// GET /api/v1/products/collections/all
router.get('/meta/collections', (req, res) => {
  try {
    const collections = db.prepare(`
      SELECT col.*, COUNT(p.id) as product_count
      FROM collections col
      LEFT JOIN products p ON col.id = p.collection_id AND p.status = 'active'
      WHERE col.enabled = 1
      GROUP BY col.id
      ORDER BY col.display_order ASC
    `).all();

    res.json({ success: true, collections });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching collections.' });
  }
});

// POST /api/v1/products/:id/reviews - Submit real customer review
router.post('/:id/reviews', (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const { customerName, customerEmail, rating, title, comment } = req.body;

    if (!customerName || !comment || !rating) {
      return res.status(400).json({ success: false, message: 'Name, comment, and rating are required.' });
    }

    const numRating = parseInt(rating, 10);
    if (numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5 stars.' });
    }

    // Check if this customer actually purchased this product in past orders for verified badge
    const purchaseCheck = db.prepare(`
      SELECT id FROM orders 
      WHERE customer_email = ? AND items LIKE ? AND order_status IN ('CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED')
    `).get(customerEmail || '', `%"productId":${productId}%`);

    const isVerified = purchaseCheck ? 1 : 0;

    const result = db.prepare(`
      INSERT INTO reviews (product_id, customer_name, customer_email, rating, title, comment, verified_purchase, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'approved')
    `).run(productId, customerName.trim(), customerEmail || '', numRating, title || '', comment.trim(), isVerified);

    res.json({
      success: true,
      message: 'Thank you for submitting your review. It has been published.',
      reviewId: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({ success: false, message: 'Server error submitting review.' });
  }
});

export default router;
