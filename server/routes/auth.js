import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';
import { JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

/**
 * Customer Registration
 * POST /api/v1/auth/customer/register
 */
router.post('/customer/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = phone ? phone.trim() : '';

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.'
      });
    }

    const existing = db.prepare('SELECT id FROM customers WHERE LOWER(email) = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.'
      });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO customers (name, email, phone, password_hash)
      VALUES (?, ?, ?, ?)
    `).run(cleanName, cleanEmail, cleanPhone, passwordHash);

    const customerId = result.lastInsertRowid;
    const token = jwt.sign(
      { id: customerId, email: cleanEmail, name: cleanName, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      customer: {
        id: customerId,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone
      }
    });
  } catch (err) {
    console.error('Customer registration error:', err);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
});

/**
 * Customer Login
 * POST /api/v1/auth/customer/login
 */
router.post('/customer/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const customer = db.prepare('SELECT * FROM customers WHERE LOWER(email) = ?').get(cleanEmail);

    if (!customer) {
      // Check if they have existing orders placed as guest
      const hasOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE LOWER(customer_email) = ?').get(cleanEmail);
      if (hasOrders && hasOrders.count > 0) {
        return res.status(404).json({
          success: false,
          message: 'Account not yet created with a password. You have existing orders! Use "Quick Order Lookup" or Create an Account using this email.'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = bcrypt.compareSync(password, customer.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = jwt.sign(
      { id: customer.id, email: customer.email, name: customer.name, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Signed in successfully.',
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      }
    });
  } catch (err) {
    console.error('Customer login error:', err);
    res.status(500).json({ success: false, message: 'Authentication error.' });
  }
});

/**
 * Quick Customer Order Lookup (Public Orders Dashboard without mandatory password)
 * POST /api/v1/auth/customer/quick-lookup
 */
router.post('/customer/quick-lookup', (req, res) => {
  try {
    const { email, phone } = req.body;
    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either an email or phone number to look up orders.'
      });
    }

    let query = `
      SELECT id, order_number, customer_name, customer_email, customer_phone,
             shipping_address, items, subtotal, discount_amount, coupon_code,
             shipping_fee, cod_fee, tax_amount, total_amount, payment_method,
             payment_status, order_status, tracking_number, courier_name,
             estimated_delivery, created_at
      FROM orders
      WHERE 1=1
    `;
    const params = [];

    if (email) {
      query += ` AND LOWER(customer_email) = LOWER(?)`;
      params.push(email.trim());
    }
    if (phone) {
      query += ` AND REPLACE(customer_phone, ' ', '') LIKE ?`;
      params.push(`%${phone.trim().replace(/\s+/g, '')}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT 25`;

    const orders = db.prepare(query).all(...params);

    const sanitizedOrders = orders.map(ord => {
      let parsedItems = [];
      let parsedAddress = {};
      try { parsedItems = JSON.parse(ord.items); } catch(e) {}
      try { parsedAddress = JSON.parse(ord.shipping_address); } catch(e) {}

      // Get timeline if available
      let timeline = [];
      try {
        timeline = db.prepare('SELECT status, title, description, created_at FROM order_timeline WHERE order_id = ? ORDER BY created_at ASC').all(ord.id);
      } catch(e) {}

      return {
        ...ord,
        items: parsedItems,
        shipping_address: parsedAddress,
        timeline
      };
    });

    res.json({
      success: true,
      count: sanitizedOrders.length,
      orders: sanitizedOrders
    });
  } catch (err) {
    console.error('Customer quick lookup error:', err);
    res.status(500).json({ success: false, message: 'Failed to look up orders.' });
  }
});

/**
 * Authenticated Customer Orders
 * GET /api/v1/auth/customer/orders
 */
router.get('/customer/orders', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }

    const orders = db.prepare(`
      SELECT id, order_number, customer_name, customer_email, customer_phone,
             shipping_address, items, subtotal, discount_amount, coupon_code,
             shipping_fee, cod_fee, tax_amount, total_amount, payment_method,
             payment_status, order_status, tracking_number, courier_name,
             estimated_delivery, created_at
      FROM orders
      WHERE LOWER(customer_email) = LOWER(?)
      ORDER BY created_at DESC
    `).all(decoded.email);

    const parsedOrders = orders.map(ord => {
      let parsedItems = [];
      let parsedAddress = {};
      try { parsedItems = JSON.parse(ord.items); } catch(e) {}
      try { parsedAddress = JSON.parse(ord.shipping_address); } catch(e) {}

      let timeline = [];
      try {
        timeline = db.prepare('SELECT status, title, description, created_at FROM order_timeline WHERE order_id = ? ORDER BY created_at ASC').all(ord.id);
      } catch(e) {}

      return {
        ...ord,
        items: parsedItems,
        shipping_address: parsedAddress,
        timeline
      };
    });

    res.json({
      success: true,
      customer: {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email
      },
      orders: parsedOrders
    });
  } catch (err) {
    console.error('Get customer orders error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve orders.' });
  }
});

/**
 * Admin Login Endpoint (Alias for centralized auth)
 * POST /api/v1/auth/admin/login
 */
router.post('/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required.' });
    }

    const admin = db.prepare('SELECT * FROM admins WHERE username = ? OR email = ?').get(username, username);
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid administrative credentials.' });
    }

    const isMatch = bcrypt.compareSync(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid administrative credentials.' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role, name: admin.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (err) {
    console.error('Auth admin login error:', err);
    res.status(500).json({ success: false, message: 'Server error during administrative login.' });
  }
});

/**
 * Customer Profile Management
 * GET /api/v1/auth/customer/profile
 */
router.get('/customer/profile', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }

    const customer = db.prepare(`
      SELECT id, name, email, phone, avatar_url, address, city, state, pincode, country, created_at
      FROM customers
      WHERE id = ?
    `).get(decoded.id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer record not found.' });
    }

    res.json({
      success: true,
      customer
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
  }
});

/**
 * Update Customer Profile & Shipping Address
 * PUT /api/v1/auth/customer/profile
 */
router.put('/customer/profile', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }

    const { name, phone, avatar_url, address, city, state, pincode, country } = req.body;

    db.prepare(`
      UPDATE customers
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          avatar_url = COALESCE(?, avatar_url),
          address = COALESCE(?, address),
          city = COALESCE(?, city),
          state = COALESCE(?, state),
          pincode = COALESCE(?, pincode),
          country = COALESCE(?, country)
      WHERE id = ?
    `).run(
      name || null,
      phone || null,
      avatar_url || null,
      address || null,
      city || null,
      state || null,
      pincode || null,
      country || null,
      decoded.id
    );

    const updated = db.prepare(`
      SELECT id, name, email, phone, avatar_url, address, city, state, pincode, country
      FROM customers
      WHERE id = ?
    `).get(decoded.id);

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      customer: updated
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

export default router;
