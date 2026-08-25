'use strict';

const express = require('express');
const router = express.Router();
const { run } = require('../db/database');
const { asyncHandler, HttpError } = require('../middleware/error');
const v = require('../middleware/validate');

// POST /api/newsletter/subscribe
router.post(
  '/subscribe',
  asyncHandler((req, res) => {
    const email = v.email(req.body.email);
    try {
      run('INSERT OR IGNORE INTO subscribers (email) VALUES (?)', [email]);
    } catch (e) {
      // ignore unique constraint
    }
    res.json({ ok: true, message: 'Welcome to the HARRY & CO Selvedge Guild. Check your inbox soon!' });
  })
);

module.exports = router;
