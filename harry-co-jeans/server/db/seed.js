'use strict';

const path = require('node:path');
const fs = require('node:fs');
const { db, run, get, all, exec, migrate } = require('./database');
const password = require('../lib/password');

const isReset = process.argv.includes('--reset');

if (isReset) {
  console.log('Resetting database...');
  // Drop tables in dependency order or wipe DB file
  const tables = [
    'redemption_events', 'reward_redemptions', 'loyalty_ledger', 'loyalty_rewards',
    'support_messages', 'support_conversations', 'order_events', 'order_items', 'orders',
    'cart_items', 'wishlist_items', 'reviews', 'product_variants', 'product_images',
    'products', 'collections', 'promotion_uses', 'promotions', 'addresses', 'segments',
    'subscribers', 'kb_articles', 'users', 'loyalty_tiers', 'loyalty_config', 'store_settings'
  ];
  for (const t of tables) {
    try { exec(`DROP TABLE IF EXISTS ${t};`); } catch (e) { /* ignore */ }
  }
}

// Re-apply schema
migrate();

console.log('Seeding initial data for HARRY & CO JEANS...');

// 1. Store Settings
run(`
  INSERT OR REPLACE INTO store_settings (id, store_name, support_email, contact_phone, address, base_currency, weight_unit, timezone, theme)
  VALUES (1, 'HARRY & CO JEANS', 'care@hcjeans.com', '+91 8000 123 456', 'Studio 4, Indiranagar, Bengaluru, KA 560038, India', 'INR', 'KG', 'IST', 'light')
`);

// 2. Loyalty Tiers & Config
run(`INSERT OR IGNORE INTO loyalty_tiers (id, name, min_points, benefits, color, position) VALUES
  (1, 'Indigo Member', 0, '["Free standard delivery","Early access to sales","Earn 1 pt per ₹1"]', '#3b82f6', 1),
  (2, 'Raw Reserve', 5000, '["Free express shipping","Exclusive member fits","Earn 1.5 pts per ₹1","Free hems & repairs"]', '#6366f1', 2),
  (3, 'Selvedge Guild', 15000, '["VIP concierge support","Bespoke monogramming","Double point drop days","Annual archive gift"]', '#000000', 3)
`);

run(`INSERT OR REPLACE INTO loyalty_config (id, earn_rate, expiration_months, calculation_period) VALUES (1, 1.0, 12, 'rolling_12')`);

// 3. Default Users
const adminHash = password.hash('admin123');
const customerHash = password.hash('customer123');

run(`
  INSERT OR IGNORE INTO users (email, password_hash, full_name, phone, role, status, loyalty_points, loyalty_tier_id)
  VALUES
    ('admin@hcjeans.com', ?, 'Harry Admin', '+91 9876543210', 'admin', 'active', 25000, 3),
    ('customer@hcjeans.com', ?, 'Arjun Verma', '+91 9812345678', 'customer', 'active', 1250, 1)
`, [adminHash, customerHash]);

// 4. Collections
run(`
  INSERT OR IGNORE INTO collections (id, name, slug, description, hero_image, is_series) VALUES
  (1, 'The Selvedge Series', 'the-selvedge-series', 'Woven on vintage shuttle looms in Kojima, Japan. 100% long-staple cotton with authentic red-line selvedge ticker.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUpaGt7gyXrPHSofDWiAWHo8epiDMItA3R6Xb8GvR5j5AC9bHPX0RC-Ua9xoOJ6SZX3SNXES4Cr6RmgkFs5kyQfh2t7NGdau34UOe0e5ldAhkOH7zjhG7ckg3bnn7Yhe_WezzKi6NsXDdpCQ-I6LIwyaih1YOiliriZTndnZ1OoYyxBDusHBbMTxvg2L0Om53wTTOFapUTIzAEqV6vEixYU-ODdcj3GafcH1oL9SQpLfob2B3VAmHQ', 1),
  (2, 'Core Essentials', 'core-essentials', 'Precision cut jeans tailored for everyday versatility and timeless longevity.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZQ9cGA6_EiNxM_DdO2Z-Ft4Y3COLMf2s-P-vCeJ5mIYev8UNbk9BZVuB-LRKdqJpmMmAbs8K9uiKNL9QjNfdKcS9nOR1PbDWKWEHaL6BS5XC7yXqIp35bzfZg4LmXKikuAtbGKV72162mr2rd6E_ojE6iFH1_GSL_tRMzV4TH-D0BBmY9mpz4GWqLI0Tz8hMG-DPx_BvJm-DF-PgbzAOjZnkQyRUTNC6mlkQjNAjyODo-xeWfFheW', 0)
`);

// 5. Initial 4 Flagship Denim Products
const initialProducts = [
  {
    sku: 'HC-VSS-001',
    title: 'The 1968 Vintage Straight Selvedge',
    slug: '1968-vintage-straight-selvedge',
    brand: 'H&C Selvedge',
    fit: 'straight',
    product_type: 'Jeans',
    gender: 'unisex',
    description: 'Crafted from 14oz Japanese Kaihara raw selvedge denim. This flagship straight cut features a medium-high rise, room through the thigh, and a clean classic leg that stacks perfectly over boots or sneakers. Develops rich, high-contrast fades over time.',
    fit_styling: JSON.stringify([
      'Straight leg silhouette with a mid-high rise',
      'Button fly with custom anti-rust brass donut buttons',
      'Hidden back-pocket copper rivets and chainstitched hems',
      'True to size; will stretch 0.5 inches in the waist with wear'
    ]),
    fabric_care: '14oz 100% Cotton Kaihara Mills (Hiroshima, Japan). Red-line selvedge ticker. Wash inside out in cold water after 6 months of wear. Hang dry only.',
    base_price: 4990,
    compare_at_price: 6490,
    rating: 4.9,
    review_count: 28,
    is_new: 1,
    tags: JSON.stringify(['selvedge', 'kaihara', 'raw denim', 'straight fit', 'bestseller']),
    collection_id: 1,
    status: 'active',
    images: [
      { url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdfwemnRapY-vyeAjWEz3r219w81Ab4vPUNY7KyrOw2iNHjkB83Va2Ag99ZUTaGZ9TA3BDtN5IaYBopnZCE08sNwD50gVcutAa6cN9rWQMptFBt9D9Ckf_MtryPuTqxm6_5GRRpNYMKvuBo2dNkFdygGhFMvgNODE1699fIMFv6wpsNDQbhd-J9BKesbicsQhnElFKF9vsZRmR5o2HOEjtIbZ9_M17CIsW6EEh2tUQ7ehOft19sNcN', alt: 'The 1968 Vintage Straight Selvedge Front View', is_main: 1, position: 0 },
      { url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyv0MsK6_5iXJyxh47vx-thQG48k2BRlciQ4wKZmzc0iZ6EKx0K1dA42y-X-GM9VdUUS7l5YhzVL4bGLG2jCHV9Y10Ktod3y7Kfcde9Cu633lVvHX6-TQkKlLTQhR8EzaTtlXUzdmoGIpJm-XfrWvMC8Vux_tQBjKKIKsSHw33ZnnRg8S17rSStDxmdylxG4DoMeEgrfMAGPB0tDkPFZbmuIjCPVgPbaZTqJn2wiiWZvq-PLuykofz', alt: 'The 1968 Vintage Straight Model Silhouette', is_main: 0, position: 1 },
      { url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0X-X6Lp16fG29EJpIxcv8V8VpIJ4Bz7WG_zXZsKRu4rySG8bJ6_0b-djg_yuEaDuS7u4WgPDgh8ze_0gk0gAin65jYFva6aJzurAOkUmAuggKprwOEw86GiOSyCIb1x1exTr5-nk45SsbeUqYyNb0DgkF6CckyIjNZ2A-j6bKV2ZZA35HJ62zKIAozNIbxztlcK-Eqc3J1pkOnCPnFeTbCVwdqNHK_gQiERj0228z1Uz3pz4nKXC7', alt: 'Artisan Crafting Kaihara Denim Detail', is_main: 0, position: 2 }
    ],
    sizes: ['28', '30', '32', '34', '36', '38'],
    color: 'Raw Indigo',
    color_hex: '#1e293b'
  },
  {
    sku: 'HC-CTK-002',
    title: 'The Chelsea Tapered Kuroki Black',
    slug: 'chelsea-tapered-kuroki-black',
    brand: 'H&C Raw',
    fit: 'slim',
    product_type: 'Jeans',
    gender: 'men',
    description: 'Constructed from 13.5oz Kuroki Mills black warp & weft sulfur-dyed selvedge denim. Modern slim-tapered cut that fits neatly at the hips with a subtle taper from knee to hem. Retains deep midnight black tone through hundreds of wears.',
    fit_styling: JSON.stringify([
      'Slim tapered fit with narrow leg opening',
      'Matte black oxide hardware and tonal black stitching',
      'Embossed vegetable-tanned black leather back patch',
      'Comfortable mid-rise waist'
    ]),
    fabric_care: '13.5oz 100% Long-Staple Cotton Kuroki Mills (Okayama, Japan). White ticker selvedge. Cold wash separately with mild detergent to preserve sulfur dye.',
    base_price: 5490,
    compare_at_price: 6990,
    rating: 4.8,
    review_count: 19,
    is_new: 1,
    tags: JSON.stringify(['black denim', 'kuroki', 'slim tapered', 'modern fit']),
    collection_id: 1,
    status: 'active',
    images: [
      { url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-OxMTLyH972c0eUfePzCXoQr7X2ymiQeWNrrINYK1cTQ1wJ6Vsg0ucBfN4Szio8m6y3NK290g_sv2Xbu5wJdhFwfy9IaZodhialwpkK73kBQ7ox25WSOnF80vaJ69N17CWBXIp9LOMtYNtqF1p1o1l0GxZZuLUqrsR2pYHd4G3T4kWAI6Y5e6jVtNPTUgKokcwGk9q7A-1uvgamlj9ROkB66wvJ2iKxviut21Pqf1nbwf2eT0pJbr', alt: 'The Chelsea Tapered Kuroki Black Silhouette', is_main: 1, position: 0 },
      { url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXZS0Cd_aDLXkEpvhEAOBVQAxOcRW8IYNjUeJXwAGkoAwbWW6DrPNaXIJIOe8N3lUoMrT96x8_t_Eva2VbPv392ddskdbSE84y3RnRFPBaBTF86zQpb-Ek-nT2u5GVwbe5iW2ab2ky_zKCNlMOYjcIAHF8iSWkSnsSvFBwMpUFYS4Df2rWQ6M2iyPFxEfKbOQNjECXUaVWgI0f88HTl-0pBSkWjFYcul7yPVp6vstXLjY39JAKpPfI', alt: 'Chelsea Tapered Fabric Texture Detail', is_main: 0, position: 1 }
    ],
    sizes: ['28', '30', '32', '34', '36', '38'],
    color: 'Midnight Kuroki Black',
    color_hex: '#0f172a'
  },
  {
    sku: 'HC-SWR-003',
    title: 'The Shibuya Wide-Leg Rigid',
    slug: 'shibuya-wide-leg-rigid',
    brand: 'H&C Studio',
    fit: 'baggy',
    product_type: 'Jeans',
    gender: 'unisex',
    description: 'An architectural wide-leg silhouette cut from 15oz Kurabo heavy rigid denim. Engineered with generous drape and a relaxed block inspired by Tokyo 90s street fashion. Unwashed and untreated for uncompromising structural form.',
    fit_styling: JSON.stringify([
      'Relaxed wide-leg with slight stack at hem',
      'High-rise waist designed for belt cinch or loose drape',
      'Heavyweight 15oz hand-feel with vintage loom chatter',
      'Double-stitched outseams and reinforced belt loops'
    ]),
    fabric_care: '15oz 100% Cotton Kurabo Mills. Rigid untreated finish. Dry clean or spot clean for first 12 months for sharp drape.',
    base_price: 5990,
    compare_at_price: 7490,
    rating: 5.0,
    review_count: 14,
    is_new: 1,
    tags: JSON.stringify(['wide leg', 'baggy', 'kurabo', 'heavyweight', 'streetwear']),
    collection_id: 1,
    status: 'active',
    images: [
      { url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCieojBTXItY9-zlPsoxBoe_iWR8OZh07MPE79iv1bwRLTay0MqLbDMdi6qsnUdsT23PVska5Rm7Z9LaVdUxM7mxG8GeVSGe2g7MywSByDXJcIK3dXEB0GH3qVz4LVKhyUaDlQaOqRoeQ-a3v3xtld6cvH4Gi5O_oNi-pzbu2fH6RexNxuecgHQEjRNki1dIwtuz73luQq2rAAL8R1hbaAvR4K9JDAhl86tei64upfWr-T22LAfNUI_', alt: 'The Shibuya Wide-Leg Rigid Front View', is_main: 1, position: 0 },
      { url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCESEoFRH_JiXwR9SHvKh7lLHhBSoUS1t__qgtYjdD7VC1rYhNfnRcmOkjbW8n1gHJNdqDtMWnuuB467iwxrP5PHGLL8JaLqWNGH2RQTWdL-IlttUEfLdcNkvZJKmQ-eIzjFzz8Y4CColI8jS56yXOMV3t3KMvYC8FfsUBAW2JoyULcKstpzvhjgmcTNuWvwEnBjUDGFMaAvZ_XXuedY39UUZjn4ug0xOONPSF7Gj5kmkzj8DwTIUn_', alt: 'Shibuya Wide-Leg Drape Silhouette', is_main: 0, position: 1 }
    ],
    sizes: ['30', '32', '34', '36', '38'],
    color: 'Deep Ocean Blue',
    color_hex: '#1e3a8a'
  },
  {
    sku: 'HC-ATJ-004',
    title: 'The Artisan Trucker Jacket — 90s Relaxed Classic',
    slug: 'artisan-trucker-jacket-vintage',
    brand: 'H&C Archive',
    fit: 'relaxed',
    product_type: 'Jackets',
    gender: 'unisex',
    description: 'Iconic Type II relaxed denim jacket crafted from 13oz Candiani Italian sustainable cotton. Features knife pleats, waist adjuster tabs, twin chest flap pockets, and an exposed selvedge ID on the interior placket. Finished with a subtle natural enzyme stone wash.',
    fit_styling: JSON.stringify([
      'Relaxed boxy fit ideal for layering over knitwear',
      'Exposed selvedge ticker along interior button facing',
      'Dual chest pockets with flap closure & welt hand pockets',
      'Custom stamped copper shanks'
    ]),
    fabric_care: '13oz Candiani Organic Cotton (Milan, Italy). Cold gentle machine wash inside out. Tumble dry low or air dry.',
    base_price: 4490,
    compare_at_price: 5990,
    rating: 4.9,
    review_count: 22,
    is_new: 0,
    tags: JSON.stringify(['jacket', 'candiani', 'trucker', 'outerwear', 'classic']),
    collection_id: 2,
    status: 'active',
    images: [
      { url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXZS0Cd_aDLXkEpvhEAOBVQAxOcRW8IYNjUeJXwAGkoAwbWW6DrPNaXIJIOe8N3lUoMrT96x8_t_Eva2VbPv392ddskdbSE84y3RnRFPBaBTF86zQpb-Ek-nT2u5GVwbe5iW2ab2ky_zKCNlMOYjcIAHF8iSWkSnsSvFBwMpUFYS4Df2rWQ6M2iyPFxEfKbOQNjECXUaVWgI0f88HTl-0pBSkWjFYcul7yPVp6vstXLjY39JAKpPfI', alt: 'The Artisan Trucker Jacket Vintage Wash', is_main: 1, position: 0 },
      { url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3jAd264LZR6PMwSnAMl_kySXUcOjjSx7ZQzRWt6yyv6fY6KkJjdUho-8a0SM4eEMh3sKLLxYm5ru71YMMJ3doZg8HDs6fLbnMKt6HEyydbK2nVsz2cK6-djayX94iqTK8sYnIL3VtGMbg1m4RigCvgGDhC0CzJ8ejBuEgtU-HW33rvhJIV48yMJRf2qpmwOX7s37OkhKPZcJ4QgO-Ahg9wLBS56yGEJxK5FKL-oBP81kekXIbtHbr', alt: 'Artisan Trucker Collar & Hardware Detail', is_main: 0, position: 1 }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    color: 'Vintage Stonewash',
    color_hex: '#64748b'
  }
];

for (const p of initialProducts) {
  const existing = get('SELECT id FROM products WHERE sku = ?', [p.sku]);
  let productId;

  if (existing) {
    productId = existing.id;
    run(`
      UPDATE products SET
        title = ?, slug = ?, brand = ?, fit = ?, product_type = ?, gender = ?,
        description = ?, fit_styling = ?, fabric_care = ?, base_price = ?,
        compare_at_price = ?, rating = ?, review_count = ?, is_new = ?,
        tags = ?, collection_id = ?, status = ?
      WHERE id = ?
    `, [
      p.title, p.slug, p.brand, p.fit, p.product_type, p.gender,
      p.description, p.fit_styling, p.fabric_care, p.base_price,
      p.compare_at_price, p.rating, p.review_count, p.is_new,
      p.tags, p.collection_id, p.status, productId
    ]);
  } else {
    const res = run(`
      INSERT INTO products (
        sku, title, slug, brand, fit, product_type, gender,
        description, fit_styling, fabric_care, base_price,
        compare_at_price, rating, review_count, is_new,
        tags, collection_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      p.sku, p.title, p.slug, p.brand, p.fit, p.product_type, p.gender,
      p.description, p.fit_styling, p.fabric_care, p.base_price,
      p.compare_at_price, p.rating, p.review_count, p.is_new,
      p.tags, p.collection_id, p.status
    ]);
    productId = res.lastInsertRowid;
  }

  // Insert Images
  run('DELETE FROM product_images WHERE product_id = ?', [productId]);
  for (const img of p.images) {
    run(`
      INSERT INTO product_images (product_id, url, alt, is_main, position)
      VALUES (?, ?, ?, ?, ?)
    `, [productId, img.url, img.alt, img.is_main, img.position]);
  }

  // Insert Variants (Sizes with 15-30 stock each)
  for (const sz of p.sizes) {
    const vSku = `${p.sku}-${sz}`;
    run(`
      INSERT OR REPLACE INTO product_variants (product_id, size, color, color_hex, sku, price, stock, reorder_point, location)
      VALUES (?, ?, ?, ?, ?, ?, ?, 5, 'Warehouse A')
    `, [productId, sz, p.color, p.color_hex, vSku, p.base_price, 20]);
  }
}

// 6. Promotions / Coupons
run(`
  INSERT OR IGNORE INTO promotions (name, code, description, discount_type, discount_value, min_order, status, no_expiry)
  VALUES
    ('Welcome 10% Off', 'WELCOME10', 'Enjoy 10% off your first order', 'percentage', 10, 1000, 'active', 1),
    ('Denim ₹500 Flat', 'DENIM500', 'Flat ₹500 discount on orders above ₹4,000', 'fixed', 500, 4000, 'active', 1)
`);

// 7. Seed sample reviews
const p1 = get('SELECT id FROM products WHERE sku = ?', ['HC-VSS-001']);
if (p1) {
  run(`
    INSERT OR IGNORE INTO reviews (id, product_id, author, rating, title, body) VALUES
    (1, ?, 'Rohan Mehra', 5, 'Outstanding Japanese Selvedge', 'The 14oz Kaihara denim is unbelievable. Incredible crisp drape, solid stitching, and breaking in nicely. Worth every rupee.'),
    (2, ?, 'Vikram S.', 5, 'True to size & authentic', 'Button fly feels substantial. Selvedge ticker looks crisp with boots. Arrived in 2 days.')
  `, [p1.id, p1.id]);
}

console.log('Seeding completed successfully! 4 flagship products active.');
