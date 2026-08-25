'use strict';

const express = require('express');
const router = express.Router();
const { get, all } = require('../../db/database');
const { asyncHandler } = require('../../middleware/error');
const { requireStaff } = require('../../middleware/auth');

router.use(requireStaff);

// GET /api/admin/analytics/summary — store KPIs
router.get(
  '/summary',
  asyncHandler((_req, res) => {
    const revenueRow = get("SELECT COALESCE(SUM(total), 0) as totalRevenue, COUNT(*) as totalOrders FROM orders WHERE payment_status = 'paid' OR status != 'cancelled'");
    const customersRow = get("SELECT COUNT(*) as totalCustomers FROM users WHERE role = 'customer'");
    const productsRow = get("SELECT COUNT(*) as totalProducts FROM products WHERE status = 'active'");
    const lowStockRow = get("SELECT COUNT(*) as lowStockCount FROM product_variants WHERE stock <= reorder_point");

    const recentOrders = all(`
      SELECT o.id, o.order_number, o.total, o.status, o.placed_at,
             COALESCE(u.full_name, 'Guest') as customer_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.placed_at DESC
      LIMIT 5
    `);

    res.json({
      totalRevenue: revenueRow ? revenueRow.totalRevenue : 0,
      totalOrders: revenueRow ? revenueRow.totalOrders : 0,
      totalCustomers: customersRow ? customersRow.totalCustomers : 0,
      totalProducts: productsRow ? productsRow.totalProducts : 0,
      lowStockCount: lowStockRow ? lowStockRow.lowStockCount : 0,
      recentOrders,
    });
  })
);

module.exports = router;
