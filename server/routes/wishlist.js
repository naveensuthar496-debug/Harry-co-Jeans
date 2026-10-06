import express from 'express';
import { db } from '../config/database.js';

const router = express.Router();

// GET /api/v1/wishlist/:sessionId - Get wishlist for a session
router.get('/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const items = db.prepare(`
      SELECT w.*, p.name, p.price, p.compare_at_price, p.images, p.slug, p.sku, p.status, p.total_stock,
             c.name as category_name
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE w.session_id = ?
      ORDER BY w.added_at DESC
    `).all(sessionId);

    const enriched = items.map(item => {
      let images = [];
      try { images = JSON.parse(item.images); } catch (e) {}
      return {
        ...item,
        images,
        first_image: images[0] || null
      };
    });

    res.json({ success: true, wishlist: enriched, count: enriched.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching wishlist.' });
  }
});

// POST /api/v1/wishlist - Add product to wishlist
router.post('/', (req, res) => {
  try {
    const { sessionId, productId, customerEmail, notifyPriceDrop, notifyRestock, sizeAlert } = req.body;

    if (!sessionId || !productId) {
      return res.status(400).json({ success: false, message: 'Session ID and product ID required.' });
    }

    // Check if already in wishlist
    const existing = db.prepare('SELECT id FROM wishlist WHERE session_id = ? AND product_id = ?').get(sessionId, productId);

    if (existing) {
      // Update notification preferences
      db.prepare(`
        UPDATE wishlist SET
          customer_email = COALESCE(?, customer_email),
          notify_price_drop = ?,
          notify_restock = ?,
          size_alert = COALESCE(?, size_alert)
        WHERE id = ?
      `).run(customerEmail || null, notifyPriceDrop ? 1 : 0, notifyRestock ? 1 : 0, sizeAlert || null, existing.id);

      return res.json({ success: true, message: 'Wishlist preferences updated.', added: false });
    }

    db.prepare(`
      INSERT INTO wishlist (session_id, customer_email, product_id, notify_price_drop, notify_restock, size_alert)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(sessionId, customerEmail || null, parseInt(productId), notifyPriceDrop ? 1 : 0, notifyRestock ? 1 : 0, sizeAlert || null);

    res.json({ success: true, message: 'Added to wishlist!', added: true });
  } catch (err) {
    console.error('Wishlist error:', err);
    res.status(500).json({ success: false, message: 'Error updating wishlist.' });
  }
});

// DELETE /api/v1/wishlist/:sessionId/:productId - Remove from wishlist
router.delete('/:sessionId/:productId', (req, res) => {
  try {
    const { sessionId, productId } = req.params;
    db.prepare('DELETE FROM wishlist WHERE session_id = ? AND product_id = ?').run(sessionId, parseInt(productId));
    res.json({ success: true, message: 'Removed from wishlist.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error removing from wishlist.' });
  }
});

// POST /api/v1/wishlist/restock-alert - Back-in-stock notification
router.post('/restock-alert', (req, res) => {
  try {
    const { productId, variantId, customerEmail, customerPhone, size } = req.body;

    if (!productId || !customerEmail || !size) {
      return res.status(400).json({ success: false, message: 'Product ID, email, and size are required.' });
    }

    if (!customerEmail.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    // Verify the product/size actually has no stock
    const variant = db.prepare(`
      SELECT * FROM product_variants WHERE product_id = ? AND size = ?
    `).get(parseInt(productId), size);

    if (variant && variant.stock > 0) {
      return res.status(400).json({ success: false, message: `Size ${size} is actually in stock! Add it to cart now.` });
    }

    db.prepare(`
      INSERT OR REPLACE INTO restock_alerts (product_id, variant_id, customer_email, customer_phone, size)
      VALUES (?, ?, ?, ?, ?)
    `).run(parseInt(productId), variantId ? parseInt(variantId) : null, customerEmail.toLowerCase(), customerPhone || null, size);

    res.json({
      success: true,
      message: `We'll notify you at ${customerEmail} when size ${size} is back in stock!`
    });
  } catch (err) {
    console.error('Restock alert error:', err);
    res.status(500).json({ success: false, message: 'Error setting up notification.' });
  }
});

export default router;
