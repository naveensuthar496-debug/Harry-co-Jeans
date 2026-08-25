'use strict';

const express = require('express');
const router = express.Router();
const { get, all } = require('../db/database');
const { asyncHandler } = require('../middleware/error');
const { requireAuth } = require('../middleware/auth');

// GET /api/loyalty/tiers
router.get(
  '/tiers',
  asyncHandler((_req, res) => {
    const tiers = all('SELECT * FROM loyalty_tiers ORDER BY min_points ASC');
    const parsed = tiers.map(t => ({
      ...t,
      benefits: typeof t.benefits === 'string' ? JSON.parse(t.benefits) : t.benefits
    }));
    res.json({ tiers: parsed });
  })
);

// GET /api/loyalty/me
router.get(
  '/me',
  requireAuth,
  asyncHandler((req, res) => {
    const user = get('SELECT id, loyalty_points, loyalty_tier_id FROM users WHERE id = ?', [req.user.id]);
    const tier = user && user.loyalty_tier_id ? get('SELECT * FROM loyalty_tiers WHERE id = ?', [user.loyalty_tier_id]) : null;
    const history = all('SELECT * FROM loyalty_ledger WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [req.user.id]);

    res.json({
      points: user ? user.loyalty_points : 0,
      tier: tier ? {
        ...tier,
        benefits: typeof tier.benefits === 'string' ? JSON.parse(tier.benefits) : tier.benefits
      } : null,
      history,
    });
  })
);

module.exports = router;
