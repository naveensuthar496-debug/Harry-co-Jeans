import express from 'express';
import { db } from '../config/database.js';

const router = express.Router();

// POST /api/v1/newsletter/subscribe
router.post('/subscribe', (req, res) => {
  try {
    const { email, name, source = 'website' } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }

    const existing = db.prepare('SELECT id, is_active FROM newsletter_subscribers WHERE email = ?').get(email.toLowerCase().trim());

    if (existing) {
      if (existing.is_active) {
        return res.json({ success: true, message: 'You are already subscribed to the Harry & Co Archive newsletter!' });
      }
      // Re-subscribe
      db.prepare('UPDATE newsletter_subscribers SET is_active = 1 WHERE id = ?').run(existing.id);
      return res.json({ success: true, message: 'Welcome back! You have been re-subscribed to the Harry & Co Archive.' });
    }

    db.prepare(`
      INSERT INTO newsletter_subscribers (email, name, source)
      VALUES (?, ?, ?)
    `).run(email.toLowerCase().trim(), name?.trim() || null, source);

    res.json({
      success: true,
      message: 'You are now subscribed to the Harry & Co Archive. Expect exclusive early access to small-batch drops!'
    });
  } catch (err) {
    console.error('Newsletter error:', err);
    res.status(500).json({ success: false, message: 'Error subscribing. Please try again.' });
  }
});

// POST /api/v1/newsletter/unsubscribe
router.post('/unsubscribe', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required.' });

    db.prepare('UPDATE newsletter_subscribers SET is_active = 0 WHERE email = ?').run(email.toLowerCase());
    res.json({ success: true, message: 'You have been successfully unsubscribed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error unsubscribing.' });
  }
});

// GET /api/v1/promotions/active - Get active promotions/flash sales
router.get('/promotions/active', (req, res) => {
  try {
    const now = new Date().toISOString();
    const promotions = db.prepare(`
      SELECT * FROM promotions
      WHERE is_active = 1
        AND start_at <= ?
        AND end_at >= ?
      ORDER BY created_at DESC
    `).all(now, now);

    res.json({ success: true, promotions });
  } catch (err) {
    res.status(500).json({ success: false, promotions: [] });
  }
});

export default router;
