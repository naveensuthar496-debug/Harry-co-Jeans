'use strict';

const express = require('express');
const router = express.Router();

const { get, run } = require('../db/database');
const password = require('../lib/password');
const jwtLib = require('../lib/jwt');
const { COOKIE_NAME, requireAuth } = require('../middleware/auth');
const { asyncHandler, HttpError } = require('../middleware/error');
const v = require('../middleware/validate');

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

function cookieOpts() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SEVEN_DAYS,
    path: '/',
  };
}

/** Shape the user row we expose to the client (never the hash). */
function publicUser(u) {
  return {
    id: u.id,
    email: u.email,
    fullName: u.full_name,
    phone: u.phone,
    avatarUrl: u.avatar_url,
    role: u.role,
    status: u.status,
    loyaltyPoints: u.loyalty_points,
    loyaltyTierId: u.loyalty_tier_id,
    memberSince: u.member_since,
  };
}

function issueSession(res, user) {
  const token = jwtLib.sign({ uid: user.id, role: user.role });
  res.cookie(COOKIE_NAME, token, cookieOpts());
}

// POST /api/auth/register
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const email = v.email(req.body.email);
    const pw = v.str(req.body.password, { field: 'password', required: true });
    if (pw.length < 6) throw new HttpError(400, 'Password must be at least 6 characters');
    const fullName = v.str(req.body.fullName || req.body.name, { field: 'name' });
    const phone = v.str(req.body.phone, { field: 'phone' });

    const existing = get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) throw new HttpError(409, 'An account with that email already exists');

    const info = run(
      `INSERT INTO users (email, password_hash, full_name, phone, role)
       VALUES (?, ?, ?, ?, 'customer')`,
      [email, password.hash(pw), fullName, phone || null]
    );
    // Everyone starts at the entry loyalty tier (lowest min_points).
    const tier = get('SELECT id FROM loyalty_tiers ORDER BY min_points ASC LIMIT 1');
    if (tier) run('UPDATE users SET loyalty_tier_id = ? WHERE id = ?', [tier.id, info.lastInsertRowid]);

    const user = get('SELECT * FROM users WHERE id = ?', [info.lastInsertRowid]);

    // Asynchronously replicate to MongoDB Atlas if connected
    try {
      const { getDb } = require('../db/mongodb');
      const db = getDb();
      if (db) {
        db.collection('users').insertOne({
          fullName: user.full_name,
          email: user.email,
          passwordHash: user.password_hash,
          role: user.role,
          phone: user.phone,
          createdAt: new Date(),
          updatedAt: new Date()
        }).catch(() => {});
      }
    } catch {}

    issueSession(res, user);
    res.status(201).json({ user: publicUser(user) });
  })
);

// POST /api/auth/login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const email = v.email(req.body.email);
    const pw = v.str(req.body.password, { field: 'password', required: true });

    // Check local database first
    let user = get('SELECT * FROM users WHERE email = ?', [email]);

    // If not found in local DB, check MongoDB Atlas
    if (!user) {
      try {
        const { findMongoUserByEmail } = require('../db/mongodb');
        const mongoUser = await findMongoUserByEmail(email);
        if (mongoUser && (password.compare(pw, mongoUser.passwordHash) || password.compare(pw, mongoUser.password))) {
          // Sync into local DB for relational session
          const info = run(
            `INSERT INTO users (email, password_hash, full_name, phone, role)
             VALUES (?, ?, ?, ?, ?)`,
            [mongoUser.email, mongoUser.passwordHash || password.hash(pw), mongoUser.fullName || mongoUser.name || '', mongoUser.phone || null, mongoUser.role || 'customer']
          );
          user = get('SELECT * FROM users WHERE id = ?', [info.lastInsertRowid]);
        }
      } catch (err) {
        console.warn('MongoDB auth fallback warning:', err.message);
      }
    }

    if (!user || !password.compare(pw, user.password_hash)) {
      throw new HttpError(401, 'Invalid email or password');
    }
    issueSession(res, user);
    res.json({ user: publicUser(user) });
  })
);

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.user) return res.json({ user: null });
  const full = get('SELECT * FROM users WHERE id = ?', [req.user.id]);
  res.json({ user: full ? publicUser(full) : null });
});

// PATCH /api/auth/me — update profile
router.patch(
  '/me',
  requireAuth,
  asyncHandler((req, res) => {
    const fullName = v.str(req.body.fullName ?? req.body.name, { field: 'name' });
    const phone = v.str(req.body.phone, { field: 'phone' });
    const avatarUrl = v.str(req.body.avatarUrl, { field: 'avatarUrl' });
    run(
      `UPDATE users SET full_name = COALESCE(NULLIF(?,''), full_name),
                        phone = ?,
                        avatar_url = COALESCE(NULLIF(?,''), avatar_url)
       WHERE id = ?`,
      [fullName, phone || null, avatarUrl, req.user.id]
    );
    const full = get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    res.json({ user: publicUser(full) });
  })
);

// POST /api/auth/change-password
router.post(
  '/change-password',
  requireAuth,
  asyncHandler((req, res) => {
    const current = v.str(req.body.currentPassword, { field: 'current password', required: true });
    const next = v.str(req.body.newPassword, { field: 'new password', required: true });
    if (next.length < 6) throw new HttpError(400, 'New password must be at least 6 characters');
    const user = get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!password.compare(current, user.password_hash)) {
      throw new HttpError(400, 'Current password is incorrect');
    }
    run('UPDATE users SET password_hash = ? WHERE id = ?', [password.hash(next), req.user.id]);
    res.json({ ok: true });
  })
);

module.exports = router;
module.exports.publicUser = publicUser;
