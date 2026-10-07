import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDatabase } from './config/database.js';
import { checkMaintenanceMode } from './middleware/maintenance.js';

import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import paymentsRouter, { handleCreateRazorpayOrder, handleVerifyRazorpayPayment } from './routes/payments.js';
import contentRouter from './routes/content.js';
import couponsRouter from './routes/coupons.js';
import adminRouter from './routes/admin.js';
import wishlistRouter from './routes/wishlist.js';
import recommendationsRouter from './routes/recommendations.js';
import searchRouter from './routes/search.js';
import newsletterRouter from './routes/newsletter.js';
import authRouter from './routes/auth.js';

import { securityHeaders } from './middleware/securityHeaders.js';
import { originShield } from './middleware/originShield.js';
import { wafMiddleware } from './middleware/waf.js';
import {
  generalLimiter,
  authLimiter,
  orderLimiter,
  searchLimiter,
  trackLimiter
} from './middleware/rateLimiter.js';
import healthRouter from './routes/health.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust reverse proxy / Azure Front Door for client IP extraction
app.set('trust proxy', true);

// Initialize Database & Schemas
initDatabase();

// 1. Security Headers (HSTS, CSP, X-Frame-Options, No-Sniff, strip Server/X-Powered-By)
app.use(securityHeaders);

// 2. Health check route for Azure Front Door and Reverse Proxy probes
app.use('/health', healthRouter);
app.use('/api/v1/health', healthRouter);

// 3. Origin Shield & Edge Verification (Enforces CDN/Reverse Proxy & Masks Origin IP)
app.use(originShield);

// 4. Web Application Firewall (SQLi, XSS, Path Traversal, Request Smuggling, Scanners)
app.use(wafMiddleware);

// 5. Strict CORS Configuration
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : null;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || !allowedOrigins || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Cross-Origin Request Blocked by Security Policy'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Azure-FDID', 'X-Origin-Verify', 'X-Requested-With'],
  credentials: true
}));

// Body Parsers with strict size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global Maintenance Mode check
app.use(checkMaintenanceMode);

// 6. Multi-Tier Rate Limiting
app.use('/api/v1/admin/login', authLimiter);
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1/orders/track', trackLimiter);
app.use('/api/v1/orders', orderLimiter);
app.use('/api/v1/search', searchLimiter);
app.use('/api/', generalLimiter);

// Public API routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/payment-methods', paymentsRouter);
// Standard Razorpay Checkout Endpoints
app.post('/api/create-order', handleCreateRazorpayOrder);
app.post('/api/verify-payment', handleVerifyRazorpayPayment);
app.use('/api/v1/content', contentRouter);
app.use('/api/v1/settings', (req, res) => res.redirect('/api/v1/content/settings'));
app.use('/api/v1/coupons', couponsRouter);
app.use('/api/v1/wishlist', wishlistRouter);
app.use('/api/v1/recommendations', recommendationsRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/newsletter', newsletterRouter);

// Protected Admin API routes
app.use('/api/v1/admin', adminRouter);

// Static assets
app.use(express.static(publicDir));

// Admin SPA route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(publicDir, 'admin.html'));
});

// Dedicated standalone pages
app.get('/login', (req, res) => res.sendFile(path.join(publicDir, 'login.html')));
app.get('/track', (req, res) => res.sendFile(path.join(publicDir, 'track.html')));
app.get('/privacy-policy', (req, res) => res.sendFile(path.join(publicDir, 'privacy-policy.html')));
app.get('/refund-policy', (req, res) => res.sendFile(path.join(publicDir, 'refund-policy.html')));
app.get('/return-policy', (req, res) => res.sendFile(path.join(publicDir, 'return-policy.html')));
app.get('/disclaimer', (req, res) => res.sendFile(path.join(publicDir, 'disclaimer.html')));

// Storefront SPA fallback
app.get('*', (req, res) => {
  // If not an API route, send index.html
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'Endpoint not found.' });
  }
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Global error handler - never leaks internal stack traces or origin IP
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON payload in request.'
    });
  }
  console.error('Unhandled server error:', err.message || err);
  const isDev = process.env.NODE_ENV === 'development';
  res.status(err.status || 500).json({
    success: false,
    message: isDev ? (err.message || 'Server error') : 'A secure internal server error occurred.'
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` HARRY & CO JEANS - DYNAMIC E-COMMERCE PLATFORM`);
  console.log(` Atelier Server running at: http://localhost:${PORT}`);
  console.log(` Storefront:               http://localhost:${PORT}`);
  console.log(` Admin Portal:             http://localhost:${PORT}/admin`);
  console.log(` Admin User:               admin`);
  console.log(` Admin Password:           admin123`);
  console.log(`====================================================`);
});
