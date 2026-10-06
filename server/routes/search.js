import express from 'express';
import { db } from '../config/database.js';

const router = express.Router();

// GET /api/v1/search?q=... - Advanced product search
router.get('/', (req, res) => {
  try {
    const {
      q = '',
      fit,
      wash,
      category,
      minPrice,
      maxPrice,
      limit = 12,
      saveRecent
    } = req.query;

    const query = q.trim();

    if (!query && !fit && !wash && !category && !minPrice && !maxPrice) {
      return res.json({ success: true, products: [], suggestions: [], query: '' });
    }

    // Build search query with typo tolerance (fuzzy matching via LIKE + multiple terms)
    const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);

    let sql = `
      SELECT DISTINCT p.*, c.name as category_name,
        CASE
          WHEN LOWER(p.name) LIKE ? THEN 100
          WHEN LOWER(p.sku) = LOWER(?) THEN 90
          WHEN LOWER(p.name) LIKE ? THEN 70
          WHEN LOWER(p.tags) LIKE ? THEN 60
          WHEN LOWER(p.fit) LIKE ? THEN 50
          WHEN LOWER(p.wash) LIKE ? THEN 45
          WHEN LOWER(p.fabric) LIKE ? THEN 40
          WHEN LOWER(p.description) LIKE ? THEN 20
          ELSE 10
        END as relevance
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active'
    `;

    const exactMatch = `%${query}%`;
    const params = [exactMatch, query, exactMatch, exactMatch, exactMatch, exactMatch, exactMatch, exactMatch];

    // Add search filter if query exists
    if (query) {
      sql += ` AND (
        LOWER(p.name) LIKE ?
        OR LOWER(p.sku) LIKE ?
        OR LOWER(p.description) LIKE ?
        OR LOWER(p.fit) LIKE ?
        OR LOWER(p.wash) LIKE ?
        OR LOWER(p.fabric) LIKE ?
        OR LOWER(p.tags) LIKE ?
        OR LOWER(c.name) LIKE ?
      )`;
      params.push(exactMatch, `%${query.toLowerCase()}%`, exactMatch, exactMatch, exactMatch, exactMatch, exactMatch, exactMatch);
    }

    // Additional filters
    if (fit) { sql += ` AND LOWER(p.fit) LIKE ?`; params.push(`%${fit.toLowerCase()}%`); }
    if (wash) { sql += ` AND LOWER(p.wash) LIKE ?`; params.push(`%${wash.toLowerCase()}%`); }
    if (category) {
      sql += ` AND (LOWER(c.slug) = LOWER(?) OR LOWER(c.name) LIKE ?)`;
      params.push(category, `%${category}%`);
    }
    if (minPrice) { sql += ` AND p.price >= ?`; params.push(parseFloat(minPrice)); }
    if (maxPrice) { sql += ` AND p.price <= ?`; params.push(parseFloat(maxPrice)); }

    sql += ` ORDER BY relevance DESC, p.is_bestseller DESC LIMIT ?`;
    params.push(Math.min(parseInt(limit, 10), 24));

    const products = db.prepare(sql).all(...params);

    const enriched = products.map(p => {
      let images = [];
      let tags = [];
      try { images = JSON.parse(p.images); } catch (e) {}
      try { tags = JSON.parse(p.tags); } catch (e) {}
      const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(p.id);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        compare_at_price: p.compare_at_price,
        fit: p.fit,
        wash: p.wash,
        sku: p.sku,
        total_stock: p.total_stock,
        category_name: p.category_name,
        first_image: images[0] || null,
        available_sizes: variants.filter(v => v.stock > 0).map(v => v.size),
        tags
      };
    });

    // Generate autocomplete suggestions
    const suggestions = generateSuggestions(query, enriched);

    res.json({
      success: true,
      query,
      products: enriched,
      count: enriched.length,
      suggestions
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ success: false, message: 'Search error.' });
  }
});

// GET /api/v1/search/autocomplete?q=... - Autocomplete suggestions
router.get('/autocomplete', (req, res) => {
  try {
    const { q = '' } = req.query;
    const query = q.trim().toLowerCase();

    if (query.length < 2) {
      return res.json({ success: true, suggestions: [] });
    }

    const pattern = `%${query}%`;

    // Product name suggestions
    const productSuggestions = db.prepare(`
      SELECT DISTINCT name, price, id FROM products
      WHERE LOWER(name) LIKE ? AND status = 'active'
      LIMIT 5
    `).all(pattern);

    // Fit suggestions
    const fitSuggestions = db.prepare(`
      SELECT DISTINCT fit FROM products
      WHERE LOWER(fit) LIKE ? AND status = 'active' AND fit != ''
      LIMIT 3
    `).all(pattern);

    // Wash suggestions
    const washSuggestions = db.prepare(`
      SELECT DISTINCT wash FROM products
      WHERE LOWER(wash) LIKE ? AND status = 'active' AND wash != ''
      LIMIT 3
    `).all(pattern);

    // Category suggestions
    const categorySuggestions = db.prepare(`
      SELECT DISTINCT name, slug FROM categories
      WHERE LOWER(name) LIKE ? AND enabled = 1
      LIMIT 3
    `).all(pattern);

    const suggestions = [
      ...productSuggestions.map(p => ({ type: 'product', label: p.name, value: p.name, price: p.price, id: p.id })),
      ...fitSuggestions.map(f => ({ type: 'fit', label: `${f.fit} Fit`, value: f.fit })),
      ...washSuggestions.map(w => ({ type: 'wash', label: w.wash, value: w.wash })),
      ...categorySuggestions.map(c => ({ type: 'category', label: c.name, value: c.slug }))
    ].slice(0, 8);

    res.json({ success: true, suggestions });
  } catch (err) {
    res.status(500).json({ success: false, suggestions: [] });
  }
});

// GET /api/v1/search/filters - Available filter options
router.get('/filters', (req, res) => {
  try {
    const fits = db.prepare(`SELECT DISTINCT fit FROM products WHERE status = 'active' AND fit != '' ORDER BY fit`).all().map(r => r.fit);
    const washes = db.prepare(`SELECT DISTINCT wash FROM products WHERE status = 'active' AND wash != '' ORDER BY wash`).all().map(r => r.wash);
    const priceRange = db.prepare(`SELECT MIN(price) as min_price, MAX(price) as max_price FROM products WHERE status = 'active'`).get();
    const categories = db.prepare(`SELECT id, name, slug FROM categories WHERE enabled = 1 ORDER BY display_order`).all();

    res.json({
      success: true,
      filters: {
        fits, washes, categories,
        priceRange: {
          min: priceRange?.min_price || 0,
          max: priceRange?.max_price || 10000
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching filters.' });
  }
});

function generateSuggestions(query, results) {
  if (!query || results.length === 0) return [];
  const suggestions = [];
  const seen = new Set();

  for (const p of results.slice(0, 5)) {
    if (p.fit && !seen.has(p.fit)) {
      suggestions.push({ label: `${p.fit} Jeans`, type: 'fit', value: p.fit });
      seen.add(p.fit);
    }
    if (p.wash && !seen.has(p.wash)) {
      suggestions.push({ label: p.wash, type: 'wash', value: p.wash });
      seen.add(p.wash);
    }
  }

  return suggestions.slice(0, 4);
}

export default router;
