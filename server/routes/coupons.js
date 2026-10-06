import express from 'express';
import { db } from '../config/database.js';

const router = express.Router();

// POST /api/v1/coupons/validate
router.post('/validate', (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter a coupon code.' });
    }

    const cartSubtotal = parseFloat(subtotal || '0');

    const coupon = db.prepare(`
      SELECT * FROM coupons
      WHERE UPPER(code) = UPPER(?) AND is_active = 1
      AND (expires_at IS NULL OR expires_at > datetime('now'))
    `).get(code.trim());

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon code.' });
    }

    if (coupon.usage_limit > 0 && coupon.usage_count >= coupon.usage_limit) {
      return res.status(400).json({ success: false, message: 'This coupon has reached its usage limit.' });
    }

    if (cartSubtotal < coupon.min_order_amount) {
      return res.status(400).json({
        success: false,
        message: `This coupon requires a minimum cart subtotal of ₹${coupon.min_order_amount}.`
      });
    }

    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = (cartSubtotal * coupon.discount_value) / 100;
      if (coupon.max_discount > 0 && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }
    } else {
      discount = coupon.discount_value;
    }

    res.json({
      success: true,
      message: `Coupon "${coupon.code}" applied successfully!`,
      coupon: {
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value,
        calculatedDiscount: Math.round(discount)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error validating coupon.' });
  }
});

export default router;
