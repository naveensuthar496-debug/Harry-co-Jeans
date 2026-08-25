'use strict';

const jwtLib = require('../lib/jwt');
const { get } = require('../db/database');

const COOKIE_NAME = 'hc_session';

/** Populate req.user from the session cookie (if valid). Never throws. */
function loadUser(req, _res, next) {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  req.user = null;
  if (token) {
    const payload = jwtLib.verify(token);
    if (payload && payload.uid) {
      const row = get(
        `SELECT id, email, full_name, phone, avatar_url, role, status,
                loyalty_points, loyalty_tier_id, member_since
           FROM users WHERE id = ?`,
        [payload.uid]
      );
      if (row) req.user = row;
    }
  }
  next();
}

/** Require any authenticated user. */
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  next();
}

/** Require one of the given staff roles (admin implicitly passes all). */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (req.user.role === 'admin' || roles.includes(req.user.role)) return next();
    return res.status(403).json({ error: 'Insufficient permissions' });
  };
}

/** Any staff member (admin/manager/editor). */
function requireStaff(req, res, next) {
  return requireRole('admin', 'manager', 'editor')(req, res, next);
}

module.exports = { COOKIE_NAME, loadUser, requireAuth, requireRole, requireStaff };
