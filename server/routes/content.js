import express from 'express';
import { db } from '../config/database.js';

const router = express.Router();

// GET /api/v1/content/homepage - Dynamic homepage sections configured by admin
router.get('/homepage', (req, res) => {
  try {
    const sections = db.prepare(`
      SELECT id, section_key, section_type, title, subtitle, description,
             image_url, cta_text, cta_url, background_style, enabled,
             display_order, metadata_json
      FROM homepage_sections
      WHERE enabled = 1
      ORDER BY display_order ASC
    `).all();

    const enriched = sections.map(s => {
      let metadata = {};
      try {
        metadata = JSON.parse(s.metadata_json);
      } catch (e) {
        metadata = {};
      }
      return {
        ...s,
        metadata
      };
    });

    res.json({
      success: true,
      sections: enriched
    });
  } catch (err) {
    console.error('Error fetching homepage sections:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving homepage layout.' });
  }
});

// GET /api/v1/content/navigation - Dynamic navigation menu
router.get('/navigation', (req, res) => {
  try {
    const items = db.prepare(`
      SELECT id, label, url, target_type, target_id, parent_id, display_order, enabled
      FROM navigation_menu
      WHERE enabled = 1
      ORDER BY display_order ASC
    `).all();

    res.json({
      success: true,
      menu: items
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error retrieving navigation menu.' });
  }
});

// GET /api/v1/settings - Public store settings
router.get('/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value, group_name FROM settings').all();
    const settings = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }

    res.json({
      success: true,
      settings
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error retrieving store settings.' });
  }
});

// GET /api/v1/content/recent-reviews - Approved customer reviews for testimonials
router.get('/recent-reviews', (req, res) => {
  try {
    const reviews = db.prepare(`
      SELECT r.id, r.customer_name, r.rating, r.title, r.comment, r.verified_purchase, r.created_at,
             p.name as product_name, p.slug as product_slug
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      WHERE r.status = 'approved'
      ORDER BY r.rating DESC, r.created_at DESC
      LIMIT 10
    `).all();

    res.json({
      success: true,
      reviews
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error retrieving reviews.' });
  }
});

export default router;
