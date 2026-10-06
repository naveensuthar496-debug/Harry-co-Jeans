import express from 'express';
import { db } from '../config/database.js';

const router = express.Router();

// GET /api/v1/payment-methods - Returns currently active payment methods for storefront checkout
router.get('/', (req, res) => {
  try {
    const methods = db.prepare(`
      SELECT id, code, name, description, minimum_order_value, maximum_order_value, fee, free_threshold, display_order
      FROM payment_methods
      WHERE enabled = 1
      ORDER BY display_order ASC
    `).all();

    res.json({
      success: true,
      paymentMethods: methods
    });
  } catch (err) {
    console.error('Error fetching payment methods:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving payment options.' });
  }
});

// GET /api/v1/payment-methods/:code - Check status of specific method
router.get('/:code', (req, res) => {
  try {
    const { code } = req.params;
    const method = db.prepare(`
      SELECT id, code, name, description, enabled, minimum_order_value, maximum_order_value, fee, free_threshold
      FROM payment_methods
      WHERE UPPER(code) = UPPER(?)
    `).get(code);

    if (!method) {
      return res.status(404).json({ success: false, message: 'Payment method not found.' });
    }

    res.json({
      success: true,
      paymentMethod: method
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error checking payment method.' });
  }
});

export default router;
