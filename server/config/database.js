import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'data', 'store.db');

export const db = new Database(dbPath);

// Enable WAL mode & foreign keys for high performance and integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    -- Store general settings (key-value)
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      group_name TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Payment method configuration
    CREATE TABLE IF NOT EXISTS payment_methods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      enabled INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 1,
      minimum_order_value REAL DEFAULT 0,
      maximum_order_value REAL DEFAULT 100000,
      fee REAL DEFAULT 0,
      free_threshold REAL DEFAULT 0,
      config_json TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Dynamic homepage sections
    CREATE TABLE IF NOT EXISTS homepage_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_key TEXT UNIQUE NOT NULL,
      section_type TEXT NOT NULL,
      title TEXT,
      subtitle TEXT,
      description TEXT,
      image_url TEXT,
      cta_text TEXT,
      cta_url TEXT,
      background_style TEXT DEFAULT 'dark',
      enabled INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 1,
      metadata_json TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Dynamic navigation menu
    CREATE TABLE IF NOT EXISTS navigation_menu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      target_type TEXT DEFAULT 'link',
      target_id TEXT,
      parent_id INTEGER DEFAULT NULL,
      display_order INTEGER DEFAULT 1,
      enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Categories
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      image_url TEXT,
      display_order INTEGER DEFAULT 1,
      enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Collections
    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      banner_image TEXT,
      display_order INTEGER DEFAULT 1,
      enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Products (enhanced with fabric details, video, care instructions)
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      short_description TEXT,
      price REAL NOT NULL,
      compare_at_price REAL,
      cost_price REAL DEFAULT 0,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      collection_id INTEGER REFERENCES collections(id) ON DELETE SET NULL,
      fit TEXT,
      wash TEXT,
      fabric TEXT,
      fabric_composition TEXT,
      stretch_percentage INTEGER DEFAULT 0,
      gsm INTEGER DEFAULT 0,
      weight_grams INTEGER DEFAULT 0,
      feel TEXT,
      breathability TEXT,
      care_instructions TEXT,
      video_url TEXT,
      sku TEXT UNIQUE NOT NULL,
      images TEXT DEFAULT '[]',
      tags TEXT DEFAULT '[]',
      total_stock INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      is_new_arrival INTEGER DEFAULT 0,
      is_bestseller INTEGER DEFAULT 0,
      is_sale INTEGER DEFAULT 0,
      seo_title TEXT,
      seo_description TEXT,
      status TEXT DEFAULT 'active',
      views INTEGER DEFAULT 0,
      add_to_cart_count INTEGER DEFAULT 0,
      purchase_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Product variants (enhanced with color, price override, image)
    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      size TEXT NOT NULL,
      color TEXT DEFAULT '',
      fit TEXT DEFAULT '',
      length TEXT DEFAULT '',
      sku TEXT UNIQUE,
      stock INTEGER DEFAULT 0,
      price_override REAL DEFAULT NULL,
      additional_price REAL DEFAULT 0,
      image_url TEXT DEFAULT ''
    );

    -- Orders (enhanced with order notes, exchange info)
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      billing_address TEXT,
      items TEXT NOT NULL,
      subtotal REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      coupon_code TEXT,
      shipping_fee REAL DEFAULT 0,
      cod_fee REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT DEFAULT 'PENDING',
      order_status TEXT DEFAULT 'CONFIRMED',
      tracking_number TEXT,
      courier_name TEXT,
      estimated_delivery TEXT,
      customer_notes TEXT,
      admin_notes TEXT,
      return_status TEXT DEFAULT NULL,
      return_reason TEXT,
      return_requested_at DATETIME,
      exchange_requested_at DATETIME,
      is_first_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Order timeline events
    CREATE TABLE IF NOT EXISTS order_timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      created_by TEXT DEFAULT 'system',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Customer Reviews (enhanced)
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      title TEXT,
      comment TEXT NOT NULL,
      fit_feedback TEXT DEFAULT 'true_to_size',
      images TEXT DEFAULT '[]',
      verified_purchase INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      status TEXT DEFAULT 'approved',
      helpful_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Promo Coupons (enhanced)
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT NOT NULL,
      discount_value REAL NOT NULL,
      min_order_amount REAL DEFAULT 0,
      max_discount REAL DEFAULT 0,
      usage_limit INTEGER DEFAULT 100,
      usage_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      is_first_order_only INTEGER DEFAULT 0,
      applicable_to TEXT DEFAULT 'all',
      applicable_id INTEGER DEFAULT NULL,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Admin Users (enhanced with roles)
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      permissions TEXT DEFAULT '[]',
      last_login DATETIME,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Admin Activity Log
    CREATE TABLE IF NOT EXISTS admin_activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER REFERENCES admins(id),
      admin_name TEXT,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Wishlist
    CREATE TABLE IF NOT EXISTS wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      customer_email TEXT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      notify_price_drop INTEGER DEFAULT 0,
      notify_restock INTEGER DEFAULT 0,
      size_alert TEXT DEFAULT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(session_id, product_id)
    );

    -- Back-in-stock notifications
    CREATE TABLE IF NOT EXISTS restock_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      variant_id INTEGER REFERENCES product_variants(id) ON DELETE CASCADE,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      size TEXT,
      is_notified INTEGER DEFAULT 0,
      notified_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(product_id, customer_email, size)
    );

    -- Abandoned carts
    CREATE TABLE IF NOT EXISTS abandoned_carts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT UNIQUE NOT NULL,
      customer_email TEXT,
      customer_name TEXT,
      customer_phone TEXT,
      cart_data TEXT NOT NULL,
      cart_value REAL DEFAULT 0,
      item_count INTEGER DEFAULT 0,
      last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_recovered INTEGER DEFAULT 0,
      recovered_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Newsletter subscribers
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      is_active INTEGER DEFAULT 1,
      source TEXT DEFAULT 'website',
      subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Flash sales / scheduled promotions
    CREATE TABLE IF NOT EXISTS promotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      discount_type TEXT NOT NULL,
      discount_value REAL NOT NULL,
      applicable_to TEXT DEFAULT 'all',
      applicable_id INTEGER,
      start_at DATETIME NOT NULL,
      end_at DATETIME NOT NULL,
      banner_text TEXT,
      banner_color TEXT DEFAULT '#B8860B',
      countdown_enabled INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Product views & analytics events
    CREATE TABLE IF NOT EXISTS product_analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      session_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Complete-the-look relationships
    CREATE TABLE IF NOT EXISTS product_lookbook (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      related_product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      relation_type TEXT DEFAULT 'complete_look',
      display_order INTEGER DEFAULT 1,
      UNIQUE(product_id, related_product_id)
    );

    -- Return & exchange requests
    CREATE TABLE IF NOT EXISTS return_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      order_number TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      request_type TEXT NOT NULL,
      reason TEXT NOT NULL,
      description TEXT,
      current_size TEXT,
      exchange_size TEXT,
      images TEXT DEFAULT '[]',
      status TEXT DEFAULT 'PENDING',
      admin_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Product comparison sessions
    CREATE TABLE IF NOT EXISTS comparison_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      product_ids TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Order timeline events
    CREATE TABLE IF NOT EXISTS order_timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      location TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Customer Accounts
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Run migrations for existing tables
  runMigrations();

  seedDefaultSettings();
  seedDefaultAdmin();
  seedDefaultPaymentMethods();
  seedDefaultHomepageSections();
  seedDefaultNavigation();
}

function runMigrations() {
  // Safe column additions - ignore if already exists
  const safeAdd = (table, col, def) => {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
    } catch (e) { /* column already exists */ }
  };

  safeAdd('products', 'cost_price', 'REAL DEFAULT 0');
  safeAdd('products', 'fabric_composition', 'TEXT');
  safeAdd('products', 'stretch_percentage', 'INTEGER DEFAULT 0');
  safeAdd('products', 'gsm', 'INTEGER DEFAULT 0');
  safeAdd('products', 'weight_grams', 'INTEGER DEFAULT 0');
  safeAdd('products', 'feel', 'TEXT');
  safeAdd('products', 'breathability', 'TEXT');
  safeAdd('products', 'care_instructions', 'TEXT');
  safeAdd('products', 'video_url', 'TEXT');
  safeAdd('products', 'tags', "TEXT DEFAULT '[]'");
  safeAdd('products', 'seo_title', 'TEXT');
  safeAdd('products', 'seo_description', 'TEXT');
  safeAdd('products', 'views', 'INTEGER DEFAULT 0');
  safeAdd('products', 'add_to_cart_count', 'INTEGER DEFAULT 0');
  safeAdd('products', 'purchase_count', 'INTEGER DEFAULT 0');

  safeAdd('product_variants', 'color', "TEXT DEFAULT ''");
  safeAdd('product_variants', 'fit', "TEXT DEFAULT ''");
  safeAdd('product_variants', 'price_override', 'REAL DEFAULT NULL');
  safeAdd('product_variants', 'image_url', "TEXT DEFAULT ''");

  safeAdd('orders', 'courier_name', 'TEXT');
  safeAdd('orders', 'estimated_delivery', 'TEXT');
  safeAdd('orders', 'return_status', 'TEXT DEFAULT NULL');
  safeAdd('orders', 'return_reason', 'TEXT');
  safeAdd('orders', 'return_requested_at', 'DATETIME');
  safeAdd('orders', 'exchange_requested_at', 'DATETIME');
  safeAdd('orders', 'is_first_order', 'INTEGER DEFAULT 0');
  safeAdd('orders', 'customer_notes', 'TEXT');

  safeAdd('reviews', 'order_id', 'INTEGER REFERENCES orders(id) ON DELETE SET NULL');
  safeAdd('reviews', 'fit_feedback', "TEXT DEFAULT 'true_to_size'");
  safeAdd('reviews', 'images', "TEXT DEFAULT '[]'");
  safeAdd('reviews', 'is_featured', 'INTEGER DEFAULT 0');
  safeAdd('reviews', 'helpful_count', 'INTEGER DEFAULT 0');

  safeAdd('coupons', 'is_first_order_only', 'INTEGER DEFAULT 0');
  safeAdd('coupons', 'applicable_to', "TEXT DEFAULT 'all'");
  safeAdd('coupons', 'applicable_id', 'INTEGER DEFAULT NULL');

  safeAdd('admins', 'permissions', "TEXT DEFAULT '[]'");
  safeAdd('admins', 'last_login', 'DATETIME');
  safeAdd('admins', 'is_active', 'INTEGER DEFAULT 1');

  safeAdd('orders', 'delivered_at', 'DATETIME');
  safeAdd('orders', 'cod_fee', 'REAL DEFAULT 0');

  // Customer Profile & Address Fields
  safeAdd('customers', 'avatar_url', "TEXT DEFAULT ''");
  safeAdd('customers', 'address', "TEXT DEFAULT ''");
  safeAdd('customers', 'city', "TEXT DEFAULT ''");
  safeAdd('customers', 'state', "TEXT DEFAULT ''");
  safeAdd('customers', 'pincode', "TEXT DEFAULT ''");
  safeAdd('customers', 'country', "TEXT DEFAULT 'India'");

  // order_timeline (safe table create if server upgraded)
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS order_timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      location TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  } catch (e) {}

  // Make product_variants.sku unique safe
  try {
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_variant_sku ON product_variants(sku) WHERE sku IS NOT NULL`);
  } catch (e) {}
}

function seedDefaultSettings() {
  const defaults = [
    ['brand_name', 'HARRY & CO', 'general'],
    ['tag_line', 'Artisanal Selvedge & Bespoke Denim Heritage', 'general'],
    ['logo_text', 'HARRY & CO', 'general'],
    ['store_email', 'harry23yt@gmail.com', 'general'],
    ['store_phone', '907617347', 'general'],
    ['store_address', 'India', 'general'],
    ['return_window_days', '14', 'policy'],
    ['currency_symbol', '₹', 'general'],
    ['currency_code', 'INR', 'general'],
    ['tax_rate', '12', 'tax'],
    ['tax_inclusive', 'true', 'tax'],
    ['free_shipping_threshold', '2499', 'shipping'],
    ['standard_shipping_fee', '149', 'shipping'],
    ['express_shipping_fee', '299', 'shipping'],
    ['min_order_value', '499', 'orders'],
    ['max_order_value', '100000', 'orders'],
    ['return_window_days', '14', 'orders'],
    ['exchange_window_days', '30', 'orders'],
    ['return_policy', 'Complimentary 14-day unworn returns and exchanges on all artisanal denim items.', 'policies'],
    ['privacy_policy', 'Your privacy is paramount. Harry & Co never shares customer information with third parties.', 'policies'],
    ['terms_conditions', 'All bespoke denim pieces are handcrafted subject to the quality standards of Harry & Co Atelier.', 'policies'],
    ['social_instagram', 'https://instagram.com/harryandcojeans', 'social'],
    ['social_facebook', 'https://facebook.com/harryandcojeans', 'social'],
    ['social_twitter', 'https://twitter.com/harryandcojeans', 'social'],
    ['social_youtube', 'https://youtube.com/harryandcojeans', 'social'],
    ['seo_title', 'HARRY & CO JEANS | Handcrafted Luxury Selvedge Denim', 'seo'],
    ['seo_description', 'Discover handcrafted Japanese selvedge denim, raw cuts, bespoke fits, and master tailoring by Harry & Co.', 'seo'],
    ['maintenance_mode', 'false', 'system'],
    ['wishlist_enabled', 'true', 'features'],
    ['comparison_enabled', 'true', 'features'],
    ['reviews_enabled', 'true', 'features'],
    ['recommendations_enabled', 'true', 'features'],
    ['abandoned_cart_timeout_hours', '24', 'features'],
    ['size_guide_enabled', 'true', 'features']
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value, group_name)
    VALUES (?, ?, ?)
  `);

  const tx = db.transaction(() => {
    for (const [key, val, grp] of defaults) {
      stmt.run(key, val, grp);
    }
  });
  tx();

  // Ensure contact info is updated to latest values
  db.prepare(`UPDATE settings SET value = ? WHERE key = 'store_phone'`).run('907617347');
  db.prepare(`UPDATE settings SET value = ? WHERE key = 'store_email'`).run('harry23yt@gmail.com');
}

function seedDefaultAdmin() {
  const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get('admin');
  if (!existing) {
    const passwordHash = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO admins (username, email, password_hash, name, role, permissions)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('admin', 'admin@harryandcojeans.com', passwordHash, 'Master Tailor & Admin', 'superadmin', JSON.stringify(['*']));
  }
}

function seedDefaultPaymentMethods() {
  const methods = [
    {
      code: 'RAZORPAY',
      name: 'Razorpay (UPI / QR / Cards / Net Banking)',
      description: 'Instant secure checkout via Google Pay, PhonePe, Paytm, All Cards & 50+ Banks.',
      enabled: 1,
      display_order: 1,
      minimum_order_value: 1,
      maximum_order_value: 500000,
      fee: 0,
      free_threshold: 0
    },
    {
      code: 'COD',
      name: 'Cash on Delivery',
      description: 'Pay with cash or UPI QR upon doorstep delivery. Subject to order limit verification.',
      enabled: 1,
      display_order: 2,
      minimum_order_value: 500,
      maximum_order_value: 10000,
      fee: 49,
      free_threshold: 3000
    },
    {
      code: 'ONLINE',
      name: 'Online Payment (Razorpay / Cards / Net Banking)',
      description: 'Instant secure checkout via UPI, Credit/Debit cards, and 50+ Net Banking options.',
      enabled: 1,
      display_order: 2,
      minimum_order_value: 1,
      maximum_order_value: 200000,
      fee: 0,
      free_threshold: 0
    },
    {
      code: 'UPI',
      name: 'Instant UPI (GPay, PhonePe, Paytm)',
      description: 'Zero transaction fee, direct bank transfer with instant approval.',
      enabled: 1,
      display_order: 3,
      minimum_order_value: 1,
      maximum_order_value: 100000,
      fee: 0,
      free_threshold: 0
    },
    {
      code: 'CARD',
      name: 'Credit & Debit Cards (Visa / Mastercard / RuPay / Amex)',
      description: 'Encrypted 256-bit payment gateway with instant EMI eligibility.',
      enabled: 1,
      display_order: 4,
      minimum_order_value: 1,
      maximum_order_value: 200000,
      fee: 0,
      free_threshold: 0
    },
    {
      code: 'NETBANKING',
      name: 'Net Banking',
      description: 'Direct payment from HDFC, ICICI, SBI, Axis, Kotak and all major Indian banks.',
      enabled: 0,
      display_order: 5,
      minimum_order_value: 1,
      maximum_order_value: 200000,
      fee: 0,
      free_threshold: 0
    }
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO payment_methods (code, name, description, enabled, display_order, minimum_order_value, maximum_order_value, fee, free_threshold)
    VALUES (@code, @name, @description, @enabled, @display_order, @minimum_order_value, @maximum_order_value, @fee, @free_threshold)
  `);

  const tx = db.transaction(() => {
    for (const m of methods) {
      stmt.run(m);
    }
  });
  tx();
}

function seedDefaultHomepageSections() {
  const sections = [
    {
      section_key: 'announcement',
      section_type: 'announcement_bar',
      title: 'COMPLIMENTARY NATIONWIDE EXPRESS SHIPPING ON ORDERS OVER ₹2,499 | CASH ON DELIVERY AVAILABLE',
      subtitle: '',
      description: '',
      image_url: '',
      cta_text: 'EXPLORE BESPOKE CUTS',
      cta_url: '#shop',
      background_style: 'accent',
      enabled: 1,
      display_order: 1,
      metadata_json: JSON.stringify({ ticker: true, speed: 'medium' })
    },
    {
      section_key: 'hero_banner',
      section_type: 'hero_banner',
      title: 'MASTERPIECES IN INDIGO',
      subtitle: 'AUTUMN / WINTER HERITAGE EDITION',
      description: 'Spun from rare 14.5oz shuttle-loom Japanese selvedge. Cut and stitched with surgical precision for individuals who demand raw authenticity.',
      image_url: 'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=1600&auto=format&fit=crop',
      cta_text: 'SHOP SIGNATURE CUTS',
      cta_url: '#shop',
      background_style: 'dark',
      enabled: 1,
      display_order: 2,
      metadata_json: JSON.stringify({
        badge: 'HANDCRAFTED ATELIER',
        secondary_cta_text: 'DISCOVER OUR STORY',
        secondary_cta_url: '#about'
      })
    },
    {
      section_key: 'featured_categories',
      section_type: 'featured_categories',
      title: 'CURATED SILHOUETTES',
      subtitle: 'ARCHITECTURAL FIT EXPLORATION',
      description: 'From narrow selvedge taper to relaxed heritage wide leg. Engineered around masculine anatomy and movement.',
      image_url: '',
      cta_text: 'VIEW ALL CATEGORIES',
      cta_url: '#shop',
      background_style: 'light',
      enabled: 1,
      display_order: 3,
      metadata_json: JSON.stringify({ columns: 4 })
    },
    {
      section_key: 'new_arrivals',
      section_type: 'product_carousel',
      title: 'FRESH OFF THE LOOM',
      subtitle: 'NEW ARRIVALS',
      description: 'Limited seasonal wash drops and heavyweight raw selvedge releases.',
      image_url: '',
      cta_text: 'VIEW ALL NEW DROPS',
      cta_url: '#shop?filter=new',
      background_style: 'light',
      enabled: 1,
      display_order: 4,
      metadata_json: JSON.stringify({ filter: 'new_arrivals', limit: 8 })
    },
    {
      section_key: 'promotional_banner',
      section_type: 'promo_banner',
      title: 'KURABO SELVEDGE COLLECTION',
      subtitle: 'THE PINNACLE OF JAPANESE WEAVING',
      description: 'Woven slowly on 1960s vintage Toyoda shuttle looms in Kojima, Okayama. Rich irregular texture that ages into personal patina with every wear.',
      image_url: 'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?q=80&w=1600&auto=format&fit=crop',
      cta_text: 'DISCOVER THE CRAFT',
      cta_url: '#shop?collection=kurabo-selvedge',
      background_style: 'indigo',
      enabled: 1,
      display_order: 5,
      metadata_json: JSON.stringify({ discount_code: 'RAWHERITAGE10', banner_badge: 'LIMITED ARCHIVE' })
    },
    {
      section_key: 'best_sellers',
      section_type: 'product_carousel',
      title: 'THE TIMELESS ICONS',
      subtitle: 'BEST SELLERS',
      description: 'Our most lauded signatures, celebrated by denim purists worldwide.',
      image_url: '',
      cta_text: 'EXPLORE BEST SELLERS',
      cta_url: '#shop?filter=bestseller',
      background_style: 'light',
      enabled: 1,
      display_order: 6,
      metadata_json: JSON.stringify({ filter: 'best_sellers', limit: 8 })
    },
    {
      section_key: 'brand_story',
      section_type: 'brand_story',
      title: 'THE HARRY & CO PHILOSOPHY',
      subtitle: 'BUILT TO OUTLIVE FAST FASHION',
      description: 'We believe genuine denim is an organic second skin. Every rivet is solid copper, every button is custom forged brass, and every seam is bound with poly-core cotton thread that weathers gracefully alongside the denim.',
      image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop',
      cta_text: 'READ OUR MANIFESTO',
      cta_url: '#about',
      background_style: 'dark',
      enabled: 1,
      display_order: 7,
      metadata_json: JSON.stringify({ stats: [{ label: 'Weight', value: '14.5 oz' }, { label: 'Origins', value: 'Kojima & Kurashiki' }, { label: 'Durability', value: 'Lifetime Guarantee' }] })
    },
    {
      section_key: 'customer_reviews',
      section_type: 'customer_reviews',
      title: 'ACCLAIM FROM THE ATELIER',
      subtitle: 'VERIFIED PATRONS',
      description: 'Unfiltered feedback from denim connoisseurs and everyday wearers.',
      image_url: '',
      cta_text: 'LEAVE A REVIEW',
      cta_url: '#reviews',
      background_style: 'light',
      enabled: 1,
      display_order: 8,
      metadata_json: JSON.stringify({ limit: 6 })
    },
    {
      section_key: 'newsletter',
      section_type: 'newsletter',
      title: 'JOIN THE HARRY & CO ARCHIVE',
      subtitle: 'EXCLUSIVE ARCHIVE RELEASES & EARLY ACCESS',
      description: 'Subscribers receive confidential invitations to small-batch shuttle loom runs, private sample sales, and bespoke denim care guides.',
      image_url: '',
      cta_text: 'SUBSCRIBE',
      cta_url: '',
      background_style: 'dark',
      enabled: 1,
      display_order: 9,
      metadata_json: JSON.stringify({ placeholder: 'Enter your private email address...' })
    }
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO homepage_sections (
      section_key, section_type, title, subtitle, description,
      image_url, cta_text, cta_url, background_style, enabled,
      display_order, metadata_json
    ) VALUES (
      @section_key, @section_type, @title, @subtitle, @description,
      @image_url, @cta_text, @cta_url, @background_style, @enabled,
      @display_order, @metadata_json
    )
  `);

  const tx = db.transaction(() => {
    for (const s of sections) {
      stmt.run(s);
    }
  });
  tx();
}

function seedDefaultNavigation() {
  const menu = [
    { label: 'Home', url: '#home', target_type: 'link', display_order: 1, enabled: 1 },
    { label: 'All Denim', url: '#shop', target_type: 'link', display_order: 2, enabled: 1 },
    { label: 'Selvedge Collection', url: '#shop?category=selvedge', target_type: 'category', display_order: 3, enabled: 1 },
    { label: 'Slim & Tapered', url: '#shop?fit=slim', target_type: 'link', display_order: 4, enabled: 1 },
    { label: 'Relaxed Vintage', url: '#shop?fit=relaxed', target_type: 'link', display_order: 5, enabled: 1 },
    { label: 'New Arrivals', url: '#shop?filter=new', target_type: 'link', display_order: 6, enabled: 1 },
    { label: 'Atelier Story', url: '#about', target_type: 'page', display_order: 7, enabled: 1 },
    { label: 'Track Order', url: '#track', target_type: 'page', display_order: 8, enabled: 1 }
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO navigation_menu (label, url, target_type, display_order, enabled)
    VALUES (@label, @url, @target_type, @display_order, @enabled)
  `);

  const count = db.prepare('SELECT COUNT(*) as c FROM navigation_menu').get();
  if (count.c === 0) {
    const tx = db.transaction(() => {
      for (const m of menu) {
        stmt.run(m);
      }
    });
    tx();
  }
}

// Function to populate rich sample catalog for testing/demo
export function seedSampleCatalog() {
  const tx = db.transaction(() => {
    // Clean old demo rows so re-seeding is idempotent
    db.prepare('DELETE FROM reviews').run();
    db.prepare('DELETE FROM product_variants').run();
    db.prepare('DELETE FROM products').run();
    db.prepare('DELETE FROM categories').run();
    db.prepare('DELETE FROM collections').run();

    // 1. Insert Categories
    const categories = [
      { name: 'Japanese Selvedge', slug: 'selvedge', description: 'Heavyweight loom-state shuttle woven denim from Okayama, Japan.', image_url: 'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=800&auto=format&fit=crop', display_order: 1 },
      { name: 'Raw & Rigid Denim', slug: 'raw-denim', description: 'Unwashed, untreated pure indigo denim that fades uniquely to your lifestyle.', image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop', display_order: 2 },
      { name: 'Vintage Washed Cuts', slug: 'vintage-washed', description: 'Stone-washed and hand-distressed for a lived-in 1970s archive drape.', image_url: 'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?q=80&w=800&auto=format&fit=crop', display_order: 3 },
      { name: 'Denim Jackets & Overshirts', slug: 'jackets-outerwear', description: 'Type II and Type III trucker jackets built with reinforced stitching.', image_url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=800&auto=format&fit=crop', display_order: 4 }
    ];

    const catStmt = db.prepare(`
      INSERT OR REPLACE INTO categories (id, name, slug, description, image_url, display_order, enabled)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    categories.forEach((c, idx) => {
      catStmt.run(idx + 1, c.name, c.slug, c.description, c.image_url, c.display_order);
    });

    // 2. Insert Collections
    const collections = [
      { name: 'Okayama Heritage Collection', slug: 'okayama-heritage', description: 'Direct from Kojima denim street mills.', banner_image: 'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=1200&auto=format&fit=crop', display_order: 1 },
      { name: 'The Obsidian Black Series', slug: 'obsidian-black', description: 'Double black sulfur-dyed warp and weft.', banner_image: 'https://images.unsplash.com/photo-1511105612320-2e62a04dd044?q=80&w=1200&auto=format&fit=crop', display_order: 2 }
    ];

    const colStmt = db.prepare(`
      INSERT OR REPLACE INTO collections (id, name, slug, description, banner_image, display_order, enabled)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    collections.forEach((c, idx) => {
      colStmt.run(idx + 1, c.name, c.slug, c.description, c.banner_image, c.display_order);
    });

    // 3. Insert Products with full fabric details
    const products = [
      {
        name: 'Harry & Co 14.5oz Kojima Raw Selvedge',
        slug: 'harry-co-14-5oz-kojima-raw-selvedge',
        description: 'Our iconic flagship piece. Woven in Kojima on restored vintage Toyoda shuttle looms with natural indigo warp and unbleached ecru weft. Features custom debossed copper rivets, button fly with antique brass donut buttons, and a thick vegetable-tanned Italian leather patch.',
        short_description: 'Flagship 14.5oz Japanese shuttle loom raw selvedge with copper hardware.',
        price: 4999,
        compare_at_price: 6499,
        cost_price: 2200,
        category_id: 1,
        collection_id: 1,
        fit: 'Slim Straight',
        wash: 'Raw Deep Indigo',
        fabric: '100% Cotton (Okayama Shuttle Loom Selvedge 14.5oz)',
        fabric_composition: '100% Organic Long Staple Cotton',
        stretch_percentage: 0,
        gsm: 490,
        weight_grams: 650,
        feel: 'Stiff & Structured',
        breathability: 'High',
        care_instructions: 'Machine wash cold inside out. Hang dry only. Iron on low. Dry clean recommended for first 6 months.',
        sku: 'HC-SEL-001',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=900&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=900&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?q=80&w=900&auto=format&fit=crop'
        ]),
        tags: JSON.stringify(['selvedge', 'raw', 'japanese', 'flagship', 'heavyweight']),
        is_featured: 1,
        is_new_arrival: 1,
        is_bestseller: 1,
        is_sale: 0,
        seo_title: 'Harry & Co 14.5oz Kojima Raw Selvedge Denim | Japanese Heritage Jeans',
        seo_description: 'Authentic 14.5oz Japanese selvedge denim from Kojima mills. Copper hardware, button fly, Italian leather patch.',
        variants: [
          { size: '28', color: 'Indigo', stock: 12, additional_price: 0 },
          { size: '30', color: 'Indigo', stock: 18, additional_price: 0 },
          { size: '32', color: 'Indigo', stock: 25, additional_price: 0 },
          { size: '34', color: 'Indigo', stock: 14, additional_price: 0 },
          { size: '36', color: 'Indigo', stock: 8, additional_price: 0 },
          { size: '38', color: 'Indigo', stock: 4, additional_price: 0 }
        ]
      },
      {
        name: 'The Artisan Type-II Selvedge Denim Jacket',
        slug: 'the-artisan-type-ii-selvedge-denim-jacket',
        description: 'A tribute to 1953 workwear, reimagined for modern proportions. Pleated front with box-stitching, twin flap chest pockets, and selvedge ID visible along the interior button placket. Tailored from 13.5oz ring-spun denim.',
        short_description: '13.5oz selvedge jacket with knife pleats and antique brass accents.',
        price: 6499,
        compare_at_price: 7999,
        cost_price: 2800,
        category_id: 4,
        collection_id: 1,
        fit: 'Boxy Tailored',
        wash: 'One-Wash Raw Indigo',
        fabric: '100% Ring-Spun Zimbabwe Long-Staple Cotton',
        fabric_composition: '100% Zimbabwe Long-Staple Cotton',
        stretch_percentage: 0,
        gsm: 450,
        weight_grams: 850,
        feel: 'Firm & Sturdy',
        breathability: 'Medium',
        care_instructions: 'Cold machine wash separately. Do not bleach. Tumble dry low. Warm iron.',
        sku: 'HC-JKT-002',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=900&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?q=80&w=900&auto=format&fit=crop'
        ]),
        tags: JSON.stringify(['jacket', 'selvedge', 'type-ii', 'outerwear', 'workwear']),
        is_featured: 1,
        is_new_arrival: 1,
        is_bestseller: 0,
        is_sale: 0,
        variants: [
          { size: 'S', color: 'Indigo', stock: 6, additional_price: 0 },
          { size: 'M', color: 'Indigo', stock: 15, additional_price: 0 },
          { size: 'L', color: 'Indigo', stock: 12, additional_price: 0 },
          { size: 'XL', color: 'Indigo', stock: 5, additional_price: 0 }
        ]
      },
      {
        name: 'Obsidian Sulfur-Dyed Heavyweight Denim',
        slug: 'obsidian-sulfur-dyed-heavyweight-denim',
        description: 'Stealth and substance. Both the warp and weft yarns are submerged in deep sulfur black dye, engineered to maintain their rich midnight hue through hundreds of wear cycles. Finished with matte black powder-coated hardware.',
        short_description: 'Double black sulfur-dyed 13.8oz denim with matte midnight hardware.',
        price: 4499,
        compare_at_price: 5499,
        cost_price: 1900,
        category_id: 2,
        collection_id: 2,
        fit: 'Slim Tapered',
        wash: 'Sulfur Jet Black',
        fabric: '99% Organic Cotton, 1% Comfort Stretch',
        fabric_composition: '99% Organic Cotton, 1% Elastane',
        stretch_percentage: 5,
        gsm: 460,
        weight_grams: 620,
        feel: 'Smooth & Dense',
        breathability: 'Medium',
        care_instructions: 'Wash inside out in cold water. Use dark fabric detergent. Air dry to preserve black tone.',
        sku: 'HC-OBS-003',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1511105612320-2e62a04dd044?q=80&w=900&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=900&auto=format&fit=crop'
        ]),
        tags: JSON.stringify(['black', 'sulfur-dyed', 'slim', 'tapered', 'obsidian']),
        is_featured: 1,
        is_new_arrival: 0,
        is_bestseller: 1,
        is_sale: 0,
        variants: [
          { size: '30', color: 'Black', stock: 14, additional_price: 0 },
          { size: '32', color: 'Black', stock: 22, additional_price: 0 },
          { size: '34', color: 'Black', stock: 16, additional_price: 0 },
          { size: '36', color: 'Black', stock: 10, additional_price: 0 }
        ]
      },
      {
        name: '1974 Vintage Archive Fade Relaxed Jean',
        slug: '1974-vintage-archive-fade-relaxed-jean',
        description: 'Painstakingly reproduced from a 1974 thrift archive pair. Features natural whisker patterning, roping on the hem, and soft hand-buffed honeycombs behind the knees. Gentle relaxed thigh with a straight leg opening.',
        short_description: 'Authentic 1970s archive wash with handcrafted whiskers and roping.',
        price: 3999,
        compare_at_price: 4999,
        cost_price: 1700,
        category_id: 3,
        collection_id: 1,
        fit: 'Relaxed Straight',
        wash: 'Vintage Sun-Faded Medium Blue',
        fabric: '100% Combed Cotton 13oz',
        fabric_composition: '100% Egyptian Combed Cotton',
        stretch_percentage: 0,
        gsm: 430,
        weight_grams: 590,
        feel: 'Soft & Worn-In',
        breathability: 'High',
        care_instructions: 'Machine wash warm. Tumble dry medium. Ironing not required to maintain vintage character.',
        sku: 'HC-VNT-004',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?q=80&w=900&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=900&auto=format&fit=crop'
        ]),
        tags: JSON.stringify(['vintage', 'relaxed', 'archive', 'faded', '1974']),
        is_featured: 0,
        is_new_arrival: 1,
        is_bestseller: 1,
        is_sale: 1,
        variants: [
          { size: '28', color: 'Medium Blue', stock: 5, additional_price: 0 },
          { size: '30', color: 'Medium Blue', stock: 12, additional_price: 0 },
          { size: '32', color: 'Medium Blue', stock: 20, additional_price: 0 },
          { size: '34', color: 'Medium Blue', stock: 15, additional_price: 0 },
          { size: '36', color: 'Medium Blue', stock: 7, additional_price: 0 }
        ]
      },
      {
        name: 'Kurabo Mill 16oz Heavy Boro Selvedge',
        slug: 'kurabo-mill-16oz-heavy-boro-selvedge',
        description: 'For the ultimate denim purist. An uncompromising 16oz heavyweight weave that stands on its own when new. High rise, roomy top block, and classic taper. Features green and red twin selvedge line ID.',
        short_description: '16oz heavyweight loom-state selvedge with twin green/red ID ticker.',
        price: 5999,
        compare_at_price: 7499,
        cost_price: 2600,
        category_id: 1,
        collection_id: 1,
        fit: 'Classic High Taper',
        wash: 'Rigid Unsanforized Raw',
        fabric: '100% Extra Long Staple Kurabo Cotton 16oz',
        fabric_composition: '100% Kurabo Extra Long Staple Cotton',
        stretch_percentage: 0,
        gsm: 540,
        weight_grams: 720,
        feel: 'Very Stiff & Structural',
        breathability: 'Medium',
        care_instructions: 'Do not wash for first 6 months. When washing, soak in cold water only. Never tumble dry. Air dry flat.',
        sku: 'HC-SEL-005',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=900&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=900&auto=format&fit=crop'
        ]),
        tags: JSON.stringify(['heavyweight', '16oz', 'kurabo', 'selvedge', 'boro', 'raw']),
        is_featured: 1,
        is_new_arrival: 0,
        is_bestseller: 0,
        is_sale: 0,
        variants: [
          { size: '30', color: 'Raw Indigo', stock: 8, additional_price: 0 },
          { size: '32', color: 'Raw Indigo', stock: 14, additional_price: 0 },
          { size: '34', color: 'Raw Indigo', stock: 11, additional_price: 0 },
          { size: '36', color: 'Raw Indigo', stock: 6, additional_price: 0 }
        ]
      },
      {
        name: 'Atlantic Coast Stonewash Bootcut Jean',
        slug: 'atlantic-coast-stonewash-bootcut-jean',
        description: 'Subtle boot flare designed to sit effortlessly over leather boots. Stonewashed with pumice stones for authentic abrasion and marbling across the seams.',
        short_description: 'Subtle flared bootcut in nautical stonewash blue.',
        price: 3799,
        compare_at_price: 4499,
        cost_price: 1600,
        category_id: 3,
        collection_id: 1,
        fit: 'Subtle Bootcut',
        wash: 'Mid-Blue Stonewash',
        fabric: '98% Cotton 2% Spandex',
        fabric_composition: '98% Combed Cotton, 2% Spandex',
        stretch_percentage: 10,
        gsm: 400,
        weight_grams: 550,
        feel: 'Soft & Flexible',
        breathability: 'High',
        care_instructions: 'Machine wash cold. Tumble dry low. Do not iron over embellishments.',
        sku: 'HC-BTC-006',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=900&auto=format&fit=crop'
        ]),
        tags: JSON.stringify(['bootcut', 'stonewash', 'stretch', 'flare']),
        is_featured: 0,
        is_new_arrival: 0,
        is_bestseller: 1,
        is_sale: 1,
        variants: [
          { size: '30', color: 'Mid Blue', stock: 10, additional_price: 0 },
          { size: '32', color: 'Mid Blue', stock: 15, additional_price: 0 },
          { size: '34', color: 'Mid Blue', stock: 8, additional_price: 0 }
        ]
      }
    ];

    const prodStmt = db.prepare(`
      INSERT INTO products (
        name, slug, description, short_description, price, compare_at_price, cost_price,
        category_id, collection_id, fit, wash, fabric, fabric_composition, stretch_percentage,
        gsm, weight_grams, feel, breathability, care_instructions, sku, images, tags, total_stock,
        is_featured, is_new_arrival, is_bestseller, is_sale, seo_title, seo_description, status
      ) VALUES (
        @name, @slug, @description, @short_description, @price, @compare_at_price, @cost_price,
        @category_id, @collection_id, @fit, @wash, @fabric, @fabric_composition, @stretch_percentage,
        @gsm, @weight_grams, @feel, @breathability, @care_instructions, @sku, @images, @tags, @total_stock,
        @is_featured, @is_new_arrival, @is_bestseller, @is_sale, @seo_title, @seo_description, 'active'
      )
    `);

    const variantStmt = db.prepare(`
      INSERT INTO product_variants (product_id, size, color, sku, stock, additional_price)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const createdIds = [];
    for (const p of products) {
      const totalStock = p.variants.reduce((acc, v) => acc + v.stock, 0);
      const res = prodStmt.run({
        ...p,
        total_stock: totalStock,
        seo_title: p.seo_title || p.name,
        seo_description: p.seo_description || p.short_description
      });
      const prodId = res.lastInsertRowid;
      createdIds.push(prodId);

      for (const v of p.variants) {
        variantStmt.run(prodId, v.size, v.color || '', `${p.sku}-${v.size}`, v.stock, v.additional_price || 0);
      }
    }

    // 4. Insert Verified Customer Reviews
    const reviews = [
      {
        product_id: createdIds[0],
        customer_name: 'Aditya Kashyap',
        customer_email: 'aditya.k@example.com',
        rating: 5,
        title: 'Unbelievable shuttle loom quality',
        comment: 'I own raw denim from Japanese brands costing 3x this. The Kojima 14.5oz selvedge from Harry & Co is right up there. Crisp, heavy, beautiful chainstitching at the hem. 10/10.',
        fit_feedback: 'true_to_size',
        verified_purchase: 1,
        status: 'approved'
      },
      {
        product_id: createdIds[0],
        customer_name: 'Rohan Mehra',
        customer_email: 'rohan.m@example.com',
        rating: 5,
        title: 'Best jeans in my wardrobe',
        comment: 'Wore these continuously for 3 months now. The honeycombs and whiskers coming in are razor sharp. Cash on delivery was seamless.',
        fit_feedback: 'true_to_size',
        verified_purchase: 1,
        status: 'approved'
      },
      {
        product_id: createdIds[1] || createdIds[0],
        customer_name: 'Vikramaditya Rao',
        customer_email: 'vikram.rao@example.com',
        rating: 5,
        title: 'The Type-II Jacket is sheer perfection',
        comment: 'Boxy cut fits hoodies or t-shirts underneath with ease. The copper rivets and pleats make it an instant conversation starter.',
        fit_feedback: 'true_to_size',
        verified_purchase: 1,
        status: 'approved'
      },
      {
        product_id: createdIds[2] || createdIds[0],
        customer_name: 'Sameer Sen',
        customer_email: 'sameer.s@example.com',
        rating: 4,
        title: 'Black stays black — finally',
        comment: 'Most black jeans fade after 3-4 washes. The Obsidian is still pitch black after 8 washes. Goes perfect with my Chelsea boots.',
        fit_feedback: 'runs_small',
        verified_purchase: 1,
        status: 'approved'
      },
      {
        product_id: createdIds[3] || createdIds[0],
        customer_name: 'Priya Nambiar',
        customer_email: 'priya.n@example.com',
        rating: 5,
        title: 'The vintage fades are spectacular',
        comment: 'I gifted these to my husband and he absolutely loves them. The hand-buffed honeycombs look incredibly authentic. Ships fast too!',
        fit_feedback: 'runs_large',
        verified_purchase: 0,
        status: 'approved'
      }
    ];

    const reviewStmt = db.prepare(`
      INSERT INTO reviews (product_id, customer_name, customer_email, rating, title, comment, fit_feedback, verified_purchase, status)
      VALUES (@product_id, @customer_name, @customer_email, @rating, @title, @comment, @fit_feedback, @verified_purchase, @status)
    `);

    for (const r of reviews) {
      reviewStmt.run(r);
    }

    // 5. Seed complete-the-look relationships
    try {
      const lookStmt = db.prepare(`
        INSERT OR IGNORE INTO product_lookbook (product_id, related_product_id, relation_type, display_order)
        VALUES (?, ?, ?, ?)
      `);
      // Jeans -> Jacket
      if (createdIds[0] && createdIds[1]) {
        lookStmt.run(createdIds[0], createdIds[1], 'complete_look', 1);
        lookStmt.run(createdIds[1], createdIds[0], 'complete_look', 1);
      }
      // Also bought together
      if (createdIds[0] && createdIds[2]) {
        lookStmt.run(createdIds[0], createdIds[2], 'also_bought', 1);
      }
    } catch (e) { /* ignore */ }
  });
  tx();
}

export function clearCatalogData() {
  db.prepare('DELETE FROM reviews').run();
  db.prepare('DELETE FROM product_variants').run();
  db.prepare('DELETE FROM products').run();
  db.prepare('DELETE FROM categories').run();
  db.prepare('DELETE FROM collections').run();
}
