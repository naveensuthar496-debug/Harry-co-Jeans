-- ═══════════════════════════════════════════════════════════════
--  HARRY & CO JEANS — SQLite schema (node:sqlite)
--  All prices are whole INR rupees (INTEGER). Booleans are 0/1.
--  JSON is stored as TEXT. Every statement is idempotent.
-- ═══════════════════════════════════════════════════════════════

-- ─── Identity ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  full_name      TEXT NOT NULL DEFAULT '',
  phone          TEXT,
  avatar_url     TEXT,
  role           TEXT NOT NULL DEFAULT 'customer',   -- customer | admin | manager | editor
  status         TEXT NOT NULL DEFAULT 'active',      -- active | inactive | premium
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  loyalty_tier_id INTEGER,
  member_since   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ─── Catalog ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS collections (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  hero_image  TEXT,
  is_series   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  sku              TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  brand            TEXT NOT NULL DEFAULT 'H&C',
  fit              TEXT,                               -- slim | straight | relaxed | baggy | oversized
  product_type     TEXT NOT NULL DEFAULT 'Jeans',      -- Jeans | Jackets | Shirts | Accessories
  gender           TEXT NOT NULL DEFAULT 'unisex',     -- men | women | unisex
  description      TEXT,
  fit_styling      TEXT,                               -- JSON array of bullet strings
  fabric_care      TEXT,
  base_price       INTEGER NOT NULL DEFAULT 0,
  compare_at_price INTEGER,
  rating           REAL NOT NULL DEFAULT 0,
  review_count     INTEGER NOT NULL DEFAULT 0,
  is_new           INTEGER NOT NULL DEFAULT 0,
  tags             TEXT,                               -- JSON array
  collection_id    INTEGER REFERENCES collections(id) ON DELETE SET NULL,
  status           TEXT NOT NULL DEFAULT 'active',     -- active | draft | archived
  created_at       TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_products_fit ON products(fit);
CREATE INDEX IF NOT EXISTS idx_products_gender ON products(gender);
CREATE INDEX IF NOT EXISTS idx_products_collection ON products(collection_id);

CREATE TABLE IF NOT EXISTS product_images (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  alt        TEXT,
  is_main    INTEGER NOT NULL DEFAULT 0,
  position   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_images_product ON product_images(product_id);

CREATE TABLE IF NOT EXISTS product_variants (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id    INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size          TEXT NOT NULL,
  color         TEXT NOT NULL DEFAULT 'Default',
  color_hex     TEXT,
  sku           TEXT NOT NULL UNIQUE,
  price         INTEGER NOT NULL,
  stock         INTEGER NOT NULL DEFAULT 0,
  reorder_point INTEGER NOT NULL DEFAULT 10,
  location      TEXT NOT NULL DEFAULT 'Warehouse A'
);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);

CREATE TABLE IF NOT EXISTS reviews (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  author     TEXT,
  rating     INTEGER NOT NULL,
  title      TEXT,
  body       TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);

-- ─── Shopping ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  variant_id INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL DEFAULT 1,
  added_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, variant_id)
);

CREATE TABLE IF NOT EXISTS wishlist_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS addresses (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name  TEXT NOT NULL,
  phone      TEXT,
  line1      TEXT NOT NULL,
  line2      TEXT,
  city       TEXT NOT NULL,
  state      TEXT NOT NULL,
  zip        TEXT NOT NULL,
  country    TEXT NOT NULL DEFAULT 'India',
  is_default INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);

-- ─── Orders ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number       TEXT NOT NULL UNIQUE,
  user_id            INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status             TEXT NOT NULL DEFAULT 'placed',   -- placed|confirmed|processing|shipped|out_for_delivery|delivered|cancelled
  payment_method     TEXT NOT NULL DEFAULT 'card',     -- card|upi|netbanking|cod
  payment_status     TEXT NOT NULL DEFAULT 'pending',  -- paid|pending|failed
  subtotal           INTEGER NOT NULL DEFAULT 0,
  discount           INTEGER NOT NULL DEFAULT 0,
  coupon_code        TEXT,
  shipping           INTEGER NOT NULL DEFAULT 0,
  tax                INTEGER NOT NULL DEFAULT 0,
  total              INTEGER NOT NULL DEFAULT 0,
  shipping_address   TEXT,                             -- JSON snapshot
  estimated_delivery TEXT,
  carrier            TEXT,
  tracking_number    TEXT,
  razorpay_order_id  TEXT,
  razorpay_payment_id TEXT,
  placed_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  color      TEXT,
  size       TEXT,
  unit_price INTEGER NOT NULL,
  quantity   INTEGER NOT NULL DEFAULT 1,
  image_url  TEXT
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS order_events (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  label    TEXT NOT NULL,
  state    TEXT NOT NULL DEFAULT 'pending',  -- done | current | pending
  detail   TEXT,
  at       TEXT,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_events(order_id);

-- ─── Promotions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promotions (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  name               TEXT NOT NULL,
  code               TEXT NOT NULL UNIQUE,
  description        TEXT,
  discount_type      TEXT NOT NULL DEFAULT 'percentage', -- percentage | fixed | shipping
  discount_value     INTEGER NOT NULL DEFAULT 0,
  applies_to         TEXT NOT NULL DEFAULT 'order',      -- order | collection | product
  applies_ids        TEXT,                               -- JSON array of ids
  min_order          INTEGER NOT NULL DEFAULT 0,
  start_date         TEXT,
  end_date           TEXT,
  no_expiry          INTEGER NOT NULL DEFAULT 0,
  usage_limit        INTEGER,
  per_customer_limit INTEGER,
  usage_count        INTEGER NOT NULL DEFAULT 0,
  status             TEXT NOT NULL DEFAULT 'active',      -- active | scheduled | expired
  created_at         TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promotion_uses (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  promotion_id INTEGER NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  order_id     INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  used_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── Loyalty ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  min_points INTEGER NOT NULL DEFAULT 0,
  benefits   TEXT,           -- JSON array
  color      TEXT,
  position   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS loyalty_config (
  id                   INTEGER PRIMARY KEY CHECK (id = 1),
  earn_rate            REAL NOT NULL DEFAULT 1,     -- points per ₹1
  expiration_months    INTEGER NOT NULL DEFAULT 12,
  downgrade_buffer_days INTEGER NOT NULL DEFAULT 30,
  calculation_period   TEXT NOT NULL DEFAULT 'rolling_12',
  bonus_multiplier_active INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  point_cost INTEGER NOT NULL,
  type       TEXT NOT NULL DEFAULT 'digital',   -- digital | physical
  sku        TEXT,
  image_url  TEXT,
  active     INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS loyalty_ledger (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delta      INTEGER NOT NULL,
  reason     TEXT NOT NULL,
  order_id   INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  reward_id  INTEGER REFERENCES loyalty_rewards(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ledger_user ON loyalty_ledger(user_id);

CREATE TABLE IF NOT EXISTS reward_redemptions (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  code             TEXT NOT NULL UNIQUE,
  reward_id        INTEGER REFERENCES loyalty_rewards(id) ON DELETE SET NULL,
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_spent     INTEGER NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending',  -- pending|processing|label_created|shipped
  shipping_address TEXT,                             -- JSON
  member_notes     TEXT,
  redeemed_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS redemption_events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  redemption_id INTEGER NOT NULL REFERENCES reward_redemptions(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,
  state         TEXT NOT NULL DEFAULT 'pending',
  at            TEXT,
  position      INTEGER NOT NULL DEFAULT 0
);

-- ─── Support / CMS / Marketing ─────────────────────────────────
CREATE TABLE IF NOT EXISTS support_conversations (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  subject         TEXT,
  status          TEXT NOT NULL DEFAULT 'open',   -- open | pending | resolved
  assigned_to     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  order_id        INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  last_message_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS support_messages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  sender_type     TEXT NOT NULL DEFAULT 'customer', -- customer | agent | system
  sender_id       INTEGER,
  body            TEXT NOT NULL,
  is_internal_note INTEGER NOT NULL DEFAULT 0,
  attachments     TEXT,                             -- JSON array
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON support_messages(conversation_id);

CREATE TABLE IF NOT EXISTS kb_articles (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  category         TEXT,
  body             TEXT,
  status           TEXT NOT NULL DEFAULT 'draft',   -- published | draft | archived
  visibility       TEXT NOT NULL DEFAULT 'public',  -- public | internal
  meta_title       TEXT,
  meta_description TEXT,
  tags             TEXT,                             -- JSON array
  author_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at       TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS segments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  description  TEXT,
  rules        TEXT,                                 -- JSON: { tier, spendOp, spendValue, recency, returnOp, returnValue }
  last_used_at TEXT,
  created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscribers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS store_settings (
  id                 INTEGER PRIMARY KEY CHECK (id = 1),
  store_name         TEXT NOT NULL DEFAULT 'HARRY & CO JEANS',
  support_email      TEXT NOT NULL DEFAULT 'support@hcjeans.com',
  contact_phone      TEXT,
  address            TEXT,
  base_currency      TEXT NOT NULL DEFAULT 'INR',
  weight_unit        TEXT NOT NULL DEFAULT 'KG',
  timezone           TEXT NOT NULL DEFAULT 'IST',
  theme              TEXT NOT NULL DEFAULT 'light',
  logo_url           TEXT,
  two_factor_enabled INTEGER NOT NULL DEFAULT 1
);
