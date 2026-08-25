'use strict';

const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db/database');
const { asyncHandler, HttpError } = require('../middleware/error');
const { requireAuth } = require('../middleware/auth');
const v = require('../middleware/validate');

// GET /api/addresses
router.get(
  '/',
  requireAuth,
  asyncHandler((req, res) => {
    const addresses = all(
      `SELECT id, full_name as fullName, phone, line1, line2, city, state, zip, country, is_default as isDefault
       FROM addresses
       WHERE user_id = ?
       ORDER BY is_default DESC, id DESC`,
      [req.user.id]
    );
    res.json({ addresses });
  })
);

// POST /api/addresses
router.post(
  '/',
  requireAuth,
  asyncHandler((req, res) => {
    const fullName = v.str(req.body.fullName || req.body.name, { field: 'Full name', required: true });
    const phone = v.str(req.body.phone, { field: 'Phone', required: true });
    const line1 = v.str(req.body.line1, { field: 'Address line 1', required: true });
    const line2 = v.str(req.body.line2, { field: 'Address line 2' }) || '';
    const city = v.str(req.body.city, { field: 'City', required: true });
    const state = v.str(req.body.state, { field: 'State', required: true });
    const zip = v.str(req.body.zip || req.body.pincode, { field: 'Pincode/ZIP', required: true });
    const country = v.str(req.body.country, { field: 'Country' }) || 'India';
    const isDefault = req.body.isDefault ? 1 : 0;

    if (isDefault) {
      run('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    }

    const result = run(
      `INSERT INTO addresses (user_id, full_name, phone, line1, line2, city, state, zip, country, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, fullName, phone, line1, line2, city, state, zip, country, isDefault]
    );

    const address = get('SELECT * FROM addresses WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ address });
  })
);

// PATCH /api/addresses/:id
router.patch(
  '/:id',
  requireAuth,
  asyncHandler((req, res) => {
    const id = Number(req.params.id);
    const existing = get('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existing) throw new HttpError(404, 'Address not found');

    const fullName = req.body.fullName ?? existing.full_name;
    const phone = req.body.phone ?? existing.phone;
    const line1 = req.body.line1 ?? existing.line1;
    const line2 = req.body.line2 ?? existing.line2;
    const city = req.body.city ?? existing.city;
    const state = req.body.state ?? existing.state;
    const zip = req.body.zip ?? existing.zip;
    const country = req.body.country ?? existing.country;
    const isDefault = req.body.isDefault !== undefined ? (req.body.isDefault ? 1 : 0) : existing.is_default;

    if (isDefault) {
      run('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    }

    run(
      `UPDATE addresses SET
        full_name = ?, phone = ?, line1 = ?, line2 = ?,
        city = ?, state = ?, zip = ?, country = ?, is_default = ?
       WHERE id = ? AND user_id = ?`,
      [fullName, phone, line1, line2, city, state, zip, country, isDefault, id, req.user.id]
    );

    const updated = get('SELECT * FROM addresses WHERE id = ?', [id]);
    res.json({ address: updated });
  })
);

// DELETE /api/addresses/:id
router.delete(
  '/:id',
  requireAuth,
  asyncHandler((req, res) => {
    const id = Number(req.params.id);
    run('DELETE FROM addresses WHERE id = ? AND user_id = ?', [id, req.user.id]);
    res.json({ ok: true });
  })
);

module.exports = router;
