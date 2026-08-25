'use strict';

const express = require('express');
const router = express.Router();
const { get, all } = require('../../db/database');
const { asyncHandler } = require('../../middleware/error');
const { requireStaff } = require('../../middleware/auth');

router.use(requireStaff);

// GET /api/admin/customers — list users with metrics
router.get(
  '/',
  asyncHandler((_req, res) => {
    const rows = all(`
      SELECT
        u.id,
        u.email,
        u.full_name as fullName,
        u.phone,
        u.role,
        u.status,
        u.loyalty_points as loyaltyPoints,
        u.member_since as memberSince,
        COUNT(o.id) as orderCount,
        COALESCE(SUM(o.total), 0) as totalSpent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id
      ORDER BY u.id DESC
    `);

    res.json({ customers: rows });
  })
);

module.exports = router;
