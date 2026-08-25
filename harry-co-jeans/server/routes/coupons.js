'use strict';

const express = require('express');
const router = express.Router();
const { get, run } = require('../db/database');
const { asyncHandler, HttpError } = require('../middleware/error');

// POST /api/coupons/apply
router.post(
  '/apply',
  asyncHandler((req, res) => {
    const { code, subtotal = 0 } = req.body;
    if (!code) throw new HttpError(400, 'Coupon code is required');

    const cleanCode = String(code).trim().toUpperCase();
    const promo = get(
      `SELECT * FROM promotions
       WHERE UPPER(code) = ? AND status = 'active'`,
      [cleanCode]
    );

    if (!promo) {
      throw new HttpError(404, 'Invalid coupon code');
    }

    const orderSubtotal = Number(subtotal) || 0;
    if (orderSubtotal < promo.min_order) {
      throw new HttpError(400, `This coupon requires a minimum order of ₹${promo.min_order}`);
    }

    let discount = 0;
    if (promo.discount_type === 'percentage') {
      discount = Math.round((orderSubtotal * promo.discount_value) / 100);
    } else if (promo.discount_type === 'fixed') {
      discount = Math.min(orderSubtotal, promo.discount_value);
    } else if (promo.discount_type === 'shipping') {
      discount = 150; // free shipping equivalent
    }

    res.json({
      valid: true,
      code: promo.code,
      name: promo.name,
      discountType: promo.discount_type,
      discountValue: promo.discount_value,
      discountAmount: discount,
    });
  })
);

module.exports = router;
