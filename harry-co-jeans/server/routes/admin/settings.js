'use strict';

const express = require('express');
const router = express.Router();
const { get, run } = require('../../db/database');
const { asyncHandler } = require('../../middleware/error');
const { requireStaff } = require('../../middleware/auth');

router.use(requireStaff);

// GET /api/admin/settings
router.get(
  '/',
  asyncHandler((_req, res) => {
    const settings = get('SELECT * FROM store_settings WHERE id = 1');
    res.json({ settings });
  })
);

// PATCH /api/admin/settings
router.patch(
  '/',
  asyncHandler((req, res) => {
    const current = get('SELECT * FROM store_settings WHERE id = 1') || {};
    const storeName = req.body.storeName ?? current.store_name;
    const supportEmail = req.body.supportEmail ?? current.support_email;
    const contactPhone = req.body.contactPhone ?? current.contact_phone;
    const address = req.body.address ?? current.address;
    const baseCurrency = req.body.baseCurrency ?? current.base_currency;

    run(
      `INSERT OR REPLACE INTO store_settings (id, store_name, support_email, contact_phone, address, base_currency)
       VALUES (1, ?, ?, ?, ?, ?)`,
      [storeName, supportEmail, contactPhone, address, baseCurrency]
    );

    const updated = get('SELECT * FROM store_settings WHERE id = 1');
    res.json({ ok: true, settings: updated });
  })
);

module.exports = router;
