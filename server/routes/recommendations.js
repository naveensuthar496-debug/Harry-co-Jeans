import express from 'express';
import { db } from '../config/database.js';

const router = express.Router();

// GET /api/v1/recommendations/similar/:productId - "You may also like"
router.get('/similar/:productId', (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    const limit = Math.min(parseInt(req.query.limit || '4', 10), 8);

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) return res.json({ success: true, products: [] });

    // Find products in same category or with same fit/wash, excluding current
    const similar = db.prepare(`
      SELECT p.*, c.name as category_name,
        CASE
          WHEN p.category_id = ? THEN 3
          WHEN p.fit = ? THEN 2
          WHEN p.wash = ? THEN 1
          ELSE 0
        END as relevance_score
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id != ? AND p.status = 'active' AND p.total_stock > 0
      ORDER BY relevance_score DESC, p.is_bestseller DESC, p.purchase_count DESC
      LIMIT ?
    `).all(product.category_id, product.fit || '', product.wash || '', productId, limit);

    const enriched = similar.map(p => enrichProduct(p));
    res.json({ success: true, products: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching recommendations.' });
  }
});

// GET /api/v1/recommendations/complete-look/:productId - Complete the look
router.get('/complete-look/:productId', (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10);

    const lookItems = db.prepare(`
      SELECT p.*, pl.relation_type, c.name as category_name
      FROM product_lookbook pl
      JOIN products p ON pl.related_product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE pl.product_id = ? AND p.status = 'active'
      ORDER BY pl.relation_type, pl.display_order ASC
    `).all(productId);

    const enriched = lookItems.map(p => enrichProduct(p));
    res.json({ success: true, products: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching look items.' });
  }
});

// GET /api/v1/recommendations/also-bought/:productId - Customers also bought
router.get('/also-bought/:productId', (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    const limit = parseInt(req.query.limit || '4', 10);

    // Find products frequently ordered together by analyzing order items JSON
    const allOrders = db.prepare(`SELECT items FROM orders WHERE order_status NOT IN ('CANCELLED') LIMIT 1000`).all();

    const coOccurrence = {};
    for (const order of allOrders) {
      let items = [];
      try { items = JSON.parse(order.items); } catch (e) { continue; }

      const productIds = items.map(i => i.productId).filter(Boolean);
      if (!productIds.includes(productId)) continue;

      for (const pid of productIds) {
        if (pid !== productId) {
          coOccurrence[pid] = (coOccurrence[pid] || 0) + 1;
        }
      }
    }

    // Sort by frequency
    const topIds = Object.entries(coOccurrence)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => parseInt(id, 10));

    if (topIds.length === 0) {
      // Fallback to best sellers
      const bestsellers = db.prepare(`
        SELECT p.*, c.name as category_name FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id != ? AND p.status = 'active' AND p.is_bestseller = 1 AND p.total_stock > 0
        LIMIT ?
      `).all(productId, limit);
      return res.json({ success: true, products: bestsellers.map(p => enrichProduct(p)) });
    }

    const placeholders = topIds.map(() => '?').join(',');
    const products = db.prepare(`
      SELECT p.*, c.name as category_name FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id IN (${placeholders}) AND p.status = 'active'
    `).all(...topIds);

    res.json({ success: true, products: products.map(p => enrichProduct(p)) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching recommendations.' });
  }
});

// POST /api/v1/recommendations/recently-viewed - Track and get recently viewed
router.post('/recently-viewed', (req, res) => {
  try {
    const { sessionId, productId } = req.body;
    if (!sessionId || !productId) return res.json({ success: false, message: 'Session and product required.' });

    // Track view event
    db.prepare(`
      INSERT INTO product_analytics (product_id, event_type, session_id)
      VALUES (?, 'view', ?)
    `).run(parseInt(productId), sessionId);

    // Increment view count
    db.prepare(`UPDATE products SET views = views + 1 WHERE id = ?`).run(parseInt(productId));

    res.json({ success: true });
  } catch (err) {
    res.status(200).json({ success: false });
  }
});

// GET /api/v1/recommendations/recently-viewed/:sessionId
router.get('/recently-viewed/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit || '6', 10);

    const recentProductIds = db.prepare(`
      SELECT DISTINCT product_id FROM product_analytics
      WHERE session_id = ? AND event_type = 'view'
      ORDER BY created_at DESC
      LIMIT ?
    `).all(sessionId, limit);

    if (recentProductIds.length === 0) {
      return res.json({ success: true, products: [] });
    }

    const ids = recentProductIds.map(r => r.product_id);
    const placeholders = ids.map(() => '?').join(',');
    const products = db.prepare(`
      SELECT p.*, c.name as category_name FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id IN (${placeholders}) AND p.status = 'active'
    `).all(...ids);

    res.json({ success: true, products: products.map(p => enrichProduct(p)) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching recently viewed.' });
  }
});

// GET /api/v1/recommendations/size - Size recommendation system
router.post('/size-guide', (req, res) => {
  try {
    const { height, weight, waist, preferredFit } = req.body;

    if (!height || !weight) {
      return res.status(400).json({ success: false, message: 'Height and weight required for size recommendation.' });
    }

    const h = parseFloat(height); // cm
    const w = parseFloat(weight); // kg
    const waistCm = waist ? parseFloat(waist) : null;

    // BMI-based approximate waist estimation if not provided
    const estimatedWaist = waistCm || Math.round(w / (h / 100) * 0.44);

    // Size mapping (waist in cm → jeans size in inches)
    const waistInches = estimatedWaist / 2.54;
    let recommendedSize, secondarySize, fitAdvice;

    if (waistInches <= 28.5) {
      recommendedSize = '28';
      secondarySize = '30';
    } else if (waistInches <= 30.5) {
      recommendedSize = '30';
      secondarySize = '32';
    } else if (waistInches <= 32.5) {
      recommendedSize = '32';
      secondarySize = '34';
    } else if (waistInches <= 34.5) {
      recommendedSize = '34';
      secondarySize = '36';
    } else if (waistInches <= 36.5) {
      recommendedSize = '36';
      secondarySize = '38';
    } else {
      recommendedSize = '38';
      secondarySize = '40';
    }

    // Fit advice based on preference and body type
    const fitMap = {
      slim: 'Our Slim Straight or Slim Tapered cuts are perfect for your measurements.',
      relaxed: 'We recommend our Relaxed Straight or Classic High Taper for comfortable movement.',
      baggy: 'Our Relaxed Vintage or Wide Leg fits will give you the comfort you prefer.',
      straight: 'The Classic Straight or Slim Straight fits will look fantastic on your frame.',
      tapered: 'The Slim Tapered or Heritage Taper cuts are ideal for your proportions.'
    };

    fitAdvice = fitMap[preferredFit?.toLowerCase()] || 'Based on your measurements, our Slim Straight cut offers the best balance of comfort and silhouette.';

    res.json({
      success: true,
      recommendation: {
        primarySize: recommendedSize,
        secondarySize,
        estimatedWaistCm: estimatedWaist,
        estimatedWaistInches: Math.round(waistInches * 10) / 10,
        fitAdvice,
        note: 'This is a guide. For raw/selvedge denim, we recommend sizing up by one as these fabrics may be stiffer initially.'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error computing size recommendation.' });
  }
});

// GET /api/v1/recommendations/compare - Product comparison data
router.post('/compare', (req, res) => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length < 2 || productIds.length > 4) {
      return res.status(400).json({ success: false, message: 'Please provide 2 to 4 product IDs for comparison.' });
    }

    const placeholders = productIds.map(() => '?').join(',');
    const products = db.prepare(`
      SELECT p.*, c.name as category_name, col.name as collection_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN collections col ON p.collection_id = col.id
      WHERE p.id IN (${placeholders})
    `).all(...productIds.map(id => parseInt(id)));

    const enriched = products.map(p => {
      let images = [];
      let tags = [];
      try { images = JSON.parse(p.images); } catch (e) {}
      try { tags = JSON.parse(p.tags); } catch (e) {}
      const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ? ORDER BY id').all(p.id);
      return {
        ...p, images, tags, variants,
        first_image: images[0] || null,
        available_sizes: variants.filter(v => v.stock > 0).map(v => v.size)
      };
    });

    res.json({ success: true, products: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching comparison data.' });
  }
});

function enrichProduct(p) {
  let images = [];
  let tags = [];
  try { images = JSON.parse(p.images); } catch (e) {}
  try { tags = JSON.parse(p.tags); } catch (e) {}
  const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ? ORDER BY id').all(p.id);
  return {
    ...p, images, tags, variants,
    first_image: images[0] || null,
    available_sizes: variants.filter(v => v.stock > 0).map(v => v.size),
    low_stock_sizes: variants.filter(v => v.stock > 0 && v.stock <= 3).map(v => v.size)
  };
}

export default router;
