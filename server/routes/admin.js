import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, seedSampleCatalog, clearCatalogData } from '../config/database.js';
import { authenticateAdmin, JWT_SECRET } from '../middleware/auth.js';
import { getRealStoreAnalytics } from '../services/analyticsService.js';

const router = express.Router();

// POST /api/v1/admin/login
router.post('/login', (req, res) => {
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
    console.error('Admin login error:', err);
    res.status(500).json({ success: false, message: 'Server error during administrative login.' });
  }
});

// All subsequent routes require admin authentication
router.use(authenticateAdmin);

// GET /api/v1/admin/me
router.get('/me', (req, res) => {
  res.json({ success: true, admin: req.admin });
});

// GET /api/v1/admin/analytics - Real database metrics
router.get('/analytics', (req, res) => {
  try {
    const analytics = getRealStoreAnalytics();
    res.json({ success: true, analytics });
  } catch (err) {
    console.error('Error computing analytics:', err);
    res.status(500).json({ success: false, message: 'Server error computing store analytics.' });
  }
});

// --- PRODUCT MANAGEMENT ---

// GET /api/v1/admin/products
router.get('/products', (req, res) => {
  try {
    const products = db.prepare(`
      SELECT p.*, c.name as category_name, col.name as collection_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN collections col ON p.collection_id = col.id
      ORDER BY p.id DESC
    `).all();

    const variantStmt = db.prepare(`SELECT * FROM product_variants WHERE product_id = ? ORDER BY id ASC`);

    const enriched = products.map(p => {
      let images = [];
      try {
        images = JSON.parse(p.images);
      } catch (e) {
        images = [];
      }
      return {
        ...p,
        images,
        variants: variantStmt.all(p.id)
      };
    });

    res.json({ success: true, products: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving products.' });
  }
});

// POST /api/v1/admin/products
router.post('/products', (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      short_description,
      price,
      compare_at_price,
      category_id,
      collection_id,
      fit,
      wash,
      fabric,
      sku,
      images, // array of urls
      variants, // array of { size, length, stock, additional_price }
      is_featured,
      is_new_arrival,
      is_bestseller,
      is_sale,
      status = 'active'
    } = req.body;

    if (!name || !price || !sku) {
      return res.status(400).json({ success: false, message: 'Product name, price, and SKU are required.' });
    }

    const cleanSlug = slug && slug.trim()
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const cleanImages = Array.isArray(images) ? JSON.stringify(images) : JSON.stringify([images].filter(Boolean));
    const variantList = Array.isArray(variants) ? variants : [];
    const totalStock = variantList.reduce((acc, v) => acc + (parseInt(v.stock, 10) || 0), 0);

    const insertStmt = db.prepare(`
      INSERT INTO products (
        name, slug, description, short_description, price, compare_at_price,
        category_id, collection_id, fit, wash, fabric, sku, images, total_stock,
        is_featured, is_new_arrival, is_bestseller, is_sale, status
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    const variantStmt = db.prepare(`
      INSERT INTO product_variants (product_id, size, length, sku, stock, additional_price)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    let newProductId = null;

    const tx = db.transaction(() => {
      const result = insertStmt.run(
        name.trim(),
        cleanSlug,
        description || '',
        short_description || '',
        parseFloat(price),
        compare_at_price ? parseFloat(compare_at_price) : null,
        category_id ? parseInt(category_id, 10) : null,
        collection_id ? parseInt(collection_id, 10) : null,
        fit || '',
        wash || '',
        fabric || '',
        sku.trim().toUpperCase(),
        cleanImages,
        totalStock,
        is_featured ? 1 : 0,
        is_new_arrival ? 1 : 0,
        is_bestseller ? 1 : 0,
        is_sale ? 1 : 0,
        status
      );

      newProductId = result.lastInsertRowid;

      if (variantList.length > 0) {
        for (const v of variantList) {
          variantStmt.run(
            newProductId,
            v.size,
            v.length || '',
            v.sku || `${sku}-${v.size}`,
            parseInt(v.stock, 10) || 0,
            parseFloat(v.additional_price || 0)
          );
        }
      } else {
        // Default standard sizes if none provided
        const defaultSizes = ['30', '32', '34'];
        for (const s of defaultSizes) {
          variantStmt.run(newProductId, s, '32', `${sku}-${s}`, 10, 0);
        }
      }
    });

    tx();

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      productId: newProductId
    });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(400).json({ success: false, message: err.message || 'Error creating product.' });
  }
});

// PUT /api/v1/admin/products/:id
router.put('/products/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const {
      name,
      slug,
      description,
      short_description,
      price,
      compare_at_price,
      category_id,
      collection_id,
      fit,
      wash,
      fabric,
      sku,
      images,
      variants,
      is_featured,
      is_new_arrival,
      is_bestseller,
      is_sale,
      status
    } = req.body;

    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const cleanSlug = slug && slug.trim()
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const cleanImages = Array.isArray(images) ? JSON.stringify(images) : JSON.stringify([images].filter(Boolean));
    const variantList = Array.isArray(variants) ? variants : [];
    const totalStock = variantList.reduce((acc, v) => acc + (parseInt(v.stock, 10) || 0), 0);

    const updateStmt = db.prepare(`
      UPDATE products SET
        name = ?, slug = ?, description = ?, short_description = ?, price = ?,
        compare_at_price = ?, category_id = ?, collection_id = ?, fit = ?,
        wash = ?, fabric = ?, sku = ?, images = ?, total_stock = ?,
        is_featured = ?, is_new_arrival = ?, is_bestseller = ?, is_sale = ?,
        status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const delVariantsStmt = db.prepare('DELETE FROM product_variants WHERE product_id = ?');
    const insertVariantStmt = db.prepare(`
      INSERT INTO product_variants (product_id, size, length, sku, stock, additional_price)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const tx = db.transaction(() => {
      updateStmt.run(
        name.trim(),
        cleanSlug,
        description || '',
        short_description || '',
        parseFloat(price),
        compare_at_price ? parseFloat(compare_at_price) : null,
        category_id ? parseInt(category_id, 10) : null,
        collection_id ? parseInt(collection_id, 10) : null,
        fit || '',
        wash || '',
        fabric || '',
        sku.trim().toUpperCase(),
        cleanImages,
        totalStock,
        is_featured ? 1 : 0,
        is_new_arrival ? 1 : 0,
        is_bestseller ? 1 : 0,
        is_sale ? 1 : 0,
        status || 'active',
        id
      );

      if (variantList.length > 0) {
        delVariantsStmt.run(id);
        for (const v of variantList) {
          insertVariantStmt.run(
            id,
            v.size,
            v.length || '',
            v.sku || `${sku}-${v.size}`,
            parseInt(v.stock, 10) || 0,
            parseFloat(v.additional_price || 0)
          );
        }
      }
    });

    tx();

    res.json({ success: true, message: 'Product updated successfully.' });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(400).json({ success: false, message: err.message || 'Error updating product.' });
  }
});

// DELETE /api/v1/admin/products/:id
router.delete('/products/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting product.' });
  }
});

// PUT /api/v1/admin/products/:id/stock - Quick inventory adjustment
router.put('/products/:id/stock', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { variants } = req.body; // array of { id, stock }

    if (!Array.isArray(variants)) {
      return res.status(400).json({ success: false, message: 'Variants array required.' });
    }

    const updateStmt = db.prepare('UPDATE product_variants SET stock = ? WHERE id = ? AND product_id = ?');
    const tx = db.transaction(() => {
      let total = 0;
      for (const v of variants) {
        const s = Math.max(0, parseInt(v.stock, 10) || 0);
        updateStmt.run(s, v.id, id);
        total += s;
      }
      db.prepare('UPDATE products SET total_stock = ? WHERE id = ?').run(total, id);
    });
    tx();

    res.json({ success: true, message: 'Inventory updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating inventory.' });
  }
});

// --- CATEGORIES & COLLECTIONS ---

// GET /api/v1/admin/categories
router.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY display_order ASC').all();
  res.json({ success: true, categories });
});

// POST /api/v1/admin/categories
router.post('/categories', (req, res) => {
  try {
    const { name, slug, description, image_url, display_order = 1, enabled = 1 } = req.body;
    const cleanSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const result = db.prepare(`
      INSERT INTO categories (name, slug, description, image_url, display_order, enabled)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, cleanSlug, description || '', image_url || '', display_order, enabled ? 1 : 0);
    res.json({ success: true, categoryId: result.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/v1/admin/categories/:id
router.put('/categories/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, slug, description, image_url, display_order, enabled } = req.body;
    db.prepare(`
      UPDATE categories SET
        name = ?, slug = ?, description = ?, image_url = ?, display_order = ?, enabled = ?
      WHERE id = ?
    `).run(name, slug, description || '', image_url || '', display_order, enabled ? 1 : 0, id);
    res.json({ success: true, message: 'Category updated.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/v1/admin/categories/:id
router.delete('/categories/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM categories WHERE id = ?').run(parseInt(req.params.id, 10));
    res.json({ success: true, message: 'Category deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting category.' });
  }
});

// Collections CRUD
router.get('/collections', (req, res) => {
  const collections = db.prepare('SELECT * FROM collections ORDER BY display_order ASC').all();
  res.json({ success: true, collections });
});

router.post('/collections', (req, res) => {
  try {
    const { name, slug, description, banner_image, display_order = 1, enabled = 1 } = req.body;
    const cleanSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const result = db.prepare(`
      INSERT INTO collections (name, slug, description, banner_image, display_order, enabled)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, cleanSlug, description || '', banner_image || '', display_order, enabled ? 1 : 0);
    res.json({ success: true, collectionId: result.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/collections/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, slug, description, banner_image, display_order, enabled } = req.body;
    db.prepare(`
      UPDATE collections SET
        name = ?, slug = ?, description = ?, banner_image = ?, display_order = ?, enabled = ?
      WHERE id = ?
    `).run(name, slug, description || '', banner_image || '', display_order, enabled ? 1 : 0, id);
    res.json({ success: true, message: 'Collection updated.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/collections/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM collections WHERE id = ?').run(parseInt(req.params.id, 10));
    res.json({ success: true, message: 'Collection deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting collection.' });
  }
});

// --- ORDERS MANAGEMENT ---

// GET /api/v1/admin/orders
router.get('/orders', (req, res) => {
  try {
    const { status, paymentMethod, search } = req.query;
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND order_status = ?';
      params.push(status);
    }
    if (paymentMethod) {
      query += ' AND payment_method = ?';
      params.push(paymentMethod);
    }
    if (search) {
      query += ' AND (order_number LIKE ? OR customer_name LIKE ? OR customer_email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const orders = db.prepare(query).all(...params);
    const parsed = orders.map(o => {
      let items = [];
      let shipping = {};
      try { items = JSON.parse(o.items); } catch (e) {}
      try { shipping = JSON.parse(o.shipping_address); } catch (e) {}
      return { ...o, items, shipping_address: shipping };
    });

    res.json({ success: true, orders: parsed });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving orders.' });
  }
});

// PUT /api/v1/admin/orders/:id/status
router.put('/orders/:id/status', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { orderStatus, paymentStatus, trackingNumber, adminNotes } = req.body;

    const existing = db.prepare('SELECT id FROM orders WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    db.prepare(`
      UPDATE orders SET
        order_status = COALESCE(?, order_status),
        payment_status = COALESCE(?, payment_status),
        tracking_number = COALESCE(?, tracking_number),
        admin_notes = COALESCE(?, admin_notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(orderStatus || null, paymentStatus || null, trackingNumber || null, adminNotes || null, id);

    res.json({ success: true, message: 'Order updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating order status.' });
  }
});

// --- PAYMENT METHODS CMS (CRITICAL SERVER CONTROLS) ---

// GET /api/v1/admin/payment-methods
router.get('/payment-methods', (req, res) => {
  try {
    const methods = db.prepare('SELECT * FROM payment_methods ORDER BY display_order ASC').all();
    res.json({ success: true, paymentMethods: methods });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving payment methods.' });
  }
});

// POST /api/v1/admin/payment-methods/:id/toggle - Instant Enable/Disable switch
router.post('/payment-methods/:id/toggle', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const method = db.prepare('SELECT * FROM payment_methods WHERE id = ?').get(id);
    if (!method) {
      return res.status(404).json({ success: false, message: 'Payment method not found.' });
    }

    const newStatus = method.enabled === 1 ? 0 : 1;
    db.prepare(`
      UPDATE payment_methods
      SET enabled = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStatus, id);

    res.json({
      success: true,
      message: `${method.name} is now ${newStatus === 1 ? 'ENABLED' : 'DISABLED'}.`,
      enabled: newStatus === 1
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating payment method status.' });
  }
});

// PUT /api/v1/admin/payment-methods/:id - Full configuration (Min/Max, fee, free_threshold)
router.put('/payment-methods/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const {
      name,
      description,
      enabled,
      minimum_order_value,
      maximum_order_value,
      fee,
      free_threshold,
      display_order
    } = req.body;

    const existing = db.prepare('SELECT * FROM payment_methods WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Payment method not found.' });
    }

    db.prepare(`
      UPDATE payment_methods SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        enabled = COALESCE(?, enabled),
        minimum_order_value = COALESCE(?, minimum_order_value),
        maximum_order_value = COALESCE(?, maximum_order_value),
        fee = COALESCE(?, fee),
        free_threshold = COALESCE(?, free_threshold),
        display_order = COALESCE(?, display_order),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name || null,
      description || null,
      enabled !== undefined ? (enabled ? 1 : 0) : null,
      minimum_order_value !== undefined ? parseFloat(minimum_order_value) : null,
      maximum_order_value !== undefined ? parseFloat(maximum_order_value) : null,
      fee !== undefined ? parseFloat(fee) : null,
      free_threshold !== undefined ? parseFloat(free_threshold) : null,
      display_order !== undefined ? parseInt(display_order, 10) : null,
      id
    );

    res.json({
      success: true,
      message: `Configuration for ${name || existing.name} saved successfully.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error saving payment method configuration.' });
  }
});

// --- HOMEPAGE BUILDER (CMS) ---

// GET /api/v1/admin/homepage-sections
router.get('/homepage-sections', (req, res) => {
  try {
    const sections = db.prepare('SELECT * FROM homepage_sections ORDER BY display_order ASC').all();
    const enriched = sections.map(s => {
      let metadata = {};
      try { metadata = JSON.parse(s.metadata_json); } catch (e) {}
      return { ...s, metadata };
    });
    res.json({ success: true, sections: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching homepage sections.' });
  }
});

// POST /api/v1/admin/homepage-sections/:id/toggle
router.post('/homepage-sections/:id/toggle', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const section = db.prepare('SELECT * FROM homepage_sections WHERE id = ?').get(id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found.' });
    }

    const newStatus = section.enabled === 1 ? 0 : 1;
    db.prepare('UPDATE homepage_sections SET enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, id);

    res.json({
      success: true,
      message: `Section "${section.title || section.section_key}" is now ${newStatus === 1 ? 'ENABLED' : 'DISABLED'}.`,
      enabled: newStatus === 1
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error toggling section.' });
  }
});

// PUT /api/v1/admin/homepage-sections/:id
router.put('/homepage-sections/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const {
      title,
      subtitle,
      description,
      image_url,
      cta_text,
      cta_url,
      background_style,
      enabled,
      display_order,
      metadata
    } = req.body;

    const metaString = metadata ? JSON.stringify(metadata) : undefined;

    db.prepare(`
      UPDATE homepage_sections SET
        title = COALESCE(?, title),
        subtitle = COALESCE(?, subtitle),
        description = COALESCE(?, description),
        image_url = COALESCE(?, image_url),
        cta_text = COALESCE(?, cta_text),
        cta_url = COALESCE(?, cta_url),
        background_style = COALESCE(?, background_style),
        enabled = COALESCE(?, enabled),
        display_order = COALESCE(?, display_order),
        metadata_json = COALESCE(?, metadata_json),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title, subtitle, description, image_url, cta_text, cta_url, background_style,
      enabled !== undefined ? (enabled ? 1 : 0) : null,
      display_order !== undefined ? parseInt(display_order, 10) : null,
      metaString || null,
      id
    );

    res.json({ success: true, message: 'Section updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating section.' });
  }
});

// PUT /api/v1/admin/homepage-sections/reorder
router.put('/homepage-sections/reorder', (req, res) => {
  try {
    const { order } = req.body; // array of { id, display_order }
    if (!Array.isArray(order)) {
      return res.status(400).json({ success: false, message: 'Order array required.' });
    }

    const stmt = db.prepare('UPDATE homepage_sections SET display_order = ? WHERE id = ?');
    const tx = db.transaction(() => {
      for (const item of order) {
        stmt.run(item.display_order, item.id);
      }
    });
    tx();

    res.json({ success: true, message: 'Sections reordered successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error reordering sections.' });
  }
});

// --- NAVIGATION MENU CMS ---

// GET /api/v1/admin/navigation
router.get('/navigation', (req, res) => {
  const items = db.prepare('SELECT * FROM navigation_menu ORDER BY display_order ASC').all();
  res.json({ success: true, menu: items });
});

// POST /api/v1/admin/navigation
router.post('/navigation', (req, res) => {
  try {
    const { label, url, target_type = 'link', display_order = 1, enabled = 1 } = req.body;
    const resId = db.prepare(`
      INSERT INTO navigation_menu (label, url, target_type, display_order, enabled)
      VALUES (?, ?, ?, ?, ?)
    `).run(label, url, target_type, display_order, enabled ? 1 : 0);
    res.json({ success: true, id: resId.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/v1/admin/navigation/:id
router.put('/navigation/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { label, url, target_type, display_order, enabled } = req.body;
    db.prepare(`
      UPDATE navigation_menu SET
        label = COALESCE(?, label),
        url = COALESCE(?, url),
        target_type = COALESCE(?, target_type),
        display_order = COALESCE(?, display_order),
        enabled = COALESCE(?, enabled)
      WHERE id = ?
    `).run(label, url, target_type, display_order, enabled !== undefined ? (enabled ? 1 : 0) : null, id);
    res.json({ success: true, message: 'Menu item updated.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/v1/admin/navigation/:id
router.delete('/navigation/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM navigation_menu WHERE id = ?').run(parseInt(req.params.id, 10));
    res.json({ success: true, message: 'Menu item deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting menu item.' });
  }
});

// --- STORE SETTINGS CMS ---

// GET /api/v1/admin/settings
router.get('/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value, group_name FROM settings').all();
    const settings = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving store settings.' });
  }
});

// PUT /api/v1/admin/settings
router.put('/settings', (req, res) => {
  try {
    const { settings } = req.body; // key-value object
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, message: 'Settings object required.' });
    }

    const upsertStmt = db.prepare(`
      INSERT INTO settings (key, value, group_name, updated_at)
      VALUES (?, ?, 'custom', CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `);

    const tx = db.transaction(() => {
      for (const [key, val] of Object.entries(settings)) {
        upsertStmt.run(key, String(val));
      }
    });
    tx();

    res.json({ success: true, message: 'Store settings saved successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error saving settings.' });
  }
});

// --- REVIEWS MODERATION ---

router.get('/reviews', (req, res) => {
  const reviews = db.prepare(`
    SELECT r.*, p.name as product_name
    FROM reviews r
    JOIN products p ON r.product_id = p.id
    ORDER BY r.created_at DESC
  `).all();
  res.json({ success: true, reviews });
});

router.put('/reviews/:id/status', (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    db.prepare('UPDATE reviews SET status = ? WHERE id = ?').run(status, parseInt(req.params.id, 10));
    res.json({ success: true, message: `Review ${status}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating review status.' });
  }
});

router.delete('/reviews/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM reviews WHERE id = ?').run(parseInt(req.params.id, 10));
    res.json({ success: true, message: 'Review deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting review.' });
  }
});

// --- COUPONS MANAGEMENT ---

router.get('/coupons', (req, res) => {
  const coupons = db.prepare('SELECT * FROM coupons ORDER BY id DESC').all();
  res.json({ success: true, coupons });
});

router.post('/coupons', (req, res) => {
  try {
    const { code, discount_type, discount_value, min_order_amount, max_discount, usage_limit, is_active } = req.body;
    db.prepare(`
      INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount, usage_limit, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      code.toUpperCase().trim(),
      discount_type,
      parseFloat(discount_value),
      parseFloat(min_order_amount || 0),
      parseFloat(max_discount || 0),
      parseInt(usage_limit || 100, 10),
      is_active ? 1 : 0
    );
    res.json({ success: true, message: 'Coupon created.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/coupons/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM coupons WHERE id = ?').run(parseInt(req.params.id, 10));
    res.json({ success: true, message: 'Coupon deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting coupon.' });
  }
});

// --- TESTING & DEMO CONTROLS ---

// Seed demo catalog
router.post('/seed-sample-catalog', (req, res) => {
  try {
    seedSampleCatalog();
    res.json({ success: true, message: 'Sample artisanal denim catalog and verified reviews seeded.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Clear catalog for pristine 0-state testing (Requirement 5 & 17)
router.post('/clear-catalog', (req, res) => {
  try {
    clearCatalogData();
    res.json({ success: true, message: 'Catalog cleared. Storefront is now at 0 products for empty-state verification.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
