'use strict';

require('dotenv').config();

const path = require('node:path');
const express = require('express');
const cookieParser = require('cookie-parser');

const { migrate } = require('./db/database');
const { loadUser } = require('./middleware/auth');
const { notFound, errorHandler } = require('./middleware/error');

// Ensure the schema exists before we serve a single request.
migrate();

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(loadUser); // attaches req.user (or null) to every request

// ─── API ───────────────────────────────────────────────────────
const api = express.Router();
api.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// Mount a route module if it exists yet; otherwise a 501 stub keeps the
// server bootable while later phases fill routers in. (No touching index.js
// per phase — just drop the file in server/routes/… and it goes live.)
function mount(prefix, modulePath) {
  try {
    api.use(prefix, require(modulePath));
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND' || !String(err.message).includes(modulePath.replace(/^\.\//, ''))) {
      throw err; // a real error inside an existing module — surface it
    }
    api.use(prefix, (_req, res) => res.status(501).json({ error: 'Not implemented yet', prefix }));
  }
}

mount('/auth', './routes/auth');
mount('/products', './routes/products');
mount('/reviews', './routes/reviews');
mount('/cart', './routes/cart');
mount('/wishlist', './routes/wishlist');
mount('/addresses', './routes/addresses');
mount('/coupons', './routes/coupons');
mount('/newsletter', './routes/newsletter');
mount('/checkout', './routes/checkout');
mount('/orders', './routes/orders');
mount('/kb', './routes/kb-public');
mount('/support', './routes/support-public');
mount('/loyalty', './routes/loyalty-public');

// Admin sub-API (each router guards itself with requireStaff/requireRole).
mount('/admin/products', './routes/admin/products');
mount('/admin/inventory', './routes/admin/inventory');
mount('/admin/orders', './routes/admin/orders');
mount('/admin/customers', './routes/admin/customers');
mount('/admin/analytics', './routes/admin/analytics');
mount('/admin/promotions', './routes/admin/promotions');
mount('/admin/settings', './routes/admin/settings');
mount('/admin/loyalty', './routes/admin/loyalty');
mount('/admin/rewards', './routes/admin/rewards');
mount('/admin/segments', './routes/admin/segments');
mount('/admin/support', './routes/admin/support');
mount('/admin/kb', './routes/admin/kb');

api.use(notFound);
app.use('/api', api);

// ─── Static frontend ─────────────────────────────────────────────
// Uploaded media (product images / logo) served from /uploads.
app.use('/uploads', express.static(UPLOADS_DIR));

// Serve the design pages. extensions:['html'] makes /shop resolve shop.html.
app.use(
  express.static(PUBLIC_DIR, {
    extensions: ['html'],
    setHeaders(res, filePath) {
      if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
    },
  })
);

// Unknown non-API path → home (keeps deep links from 404ing hard).
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n  HARRY & CO JEANS running → http://localhost:${PORT}\n`);
  });
}

module.exports = app;
