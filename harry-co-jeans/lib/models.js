import { getDb } from './mongodb.js';
import { ObjectId } from 'mongodb';
import { INITIAL_PRODUCTS, seedMongoIfEmpty } from './seed-mongo.js';

let isSeeded = false;
async function ensureDb() {
  try {
    const db = await getDb();
    if (db && !isSeeded) {
      seedMongoIfEmpty().catch(() => {});
      isSeeded = true;
    }
    return db;
  } catch (err) {
    console.warn('ensureDb warning:', err.message);
    return null;
  }
}

// ─── PRODUCTS ───────────────────────────────────────────────────

export async function getProducts({ q, fit, gender, productType, status = 'active', limit = 50, sort = 'default' } = {}) {
  try {
    const db = await ensureDb();
    if (!db) {
      let list = [...INITIAL_PRODUCTS];
      if (fit && fit !== 'all') list = list.filter(p => p.fit === fit.toLowerCase());
      if (gender && gender !== 'all') list = list.filter(p => p.gender === gender.toLowerCase() || p.gender === 'unisex');
      if (status && status !== 'all') list = list.filter(p => p.status === status);
      return list.map((p, i) => ({
        ...p,
        id: `mock-${i + 1}`,
        _id: `mock-${i + 1}`,
        mainImage: p.images?.find(img => img.isMain)?.url || p.images?.[0]?.url || '',
        totalStock: (p.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0),
      }));
    }

    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (fit && fit !== 'all') {
      filter.fit = fit.toLowerCase();
    }

    if (gender && gender !== 'all') {
      filter.gender = { $in: [gender.toLowerCase(), 'unisex'] };
    }

    if (productType && productType !== 'all') {
      filter.productType = new RegExp(`^${productType}$`, 'i');
    }

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { sku: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } }
      ];
    }

    let sortQuery = { createdAt: -1 };
    if (sort === 'price-asc') sortQuery = { basePrice: 1 };
    if (sort === 'price-desc') sortQuery = { basePrice: -1 };
    if (sort === 'rating') sortQuery = { rating: -1 };

    const products = await db.collection('products')
      .find(filter)
      .sort(sortQuery)
      .limit(limit)
      .toArray();

    if (products.length === 0 && (!status || status === 'active' || status === 'all')) {
      return INITIAL_PRODUCTS.map((p, i) => ({
        ...p,
        id: `init-${i + 1}`,
        _id: `init-${i + 1}`,
        mainImage: p.images?.find(img => img.isMain)?.url || p.images?.[0]?.url || '',
        totalStock: (p.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0),
      }));
    }

    return products.map(p => ({
      ...p,
      id: p._id.toString(),
      _id: p._id.toString(),
      mainImage: p.images?.find(img => img.isMain)?.url || p.images?.[0]?.url || '',
      totalStock: (p.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0),
    }));
  } catch (err) {
    console.warn('getProducts fallback:', err.message);
    return INITIAL_PRODUCTS.map((p, i) => ({
      ...p,
      id: `fallback-${i + 1}`,
      _id: `fallback-${i + 1}`,
      mainImage: p.images?.find(img => img.isMain)?.url || p.images?.[0]?.url || '',
      totalStock: (p.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0),
    }));
  }
}

export async function getProductBySlugOrId(identifier) {
  try {
    const db = await ensureDb();
    if (!db) {
      const found = INITIAL_PRODUCTS.find(p => p.slug === identifier || p.sku === identifier);
      if (found) {
        return {
          ...found,
          id: identifier,
          _id: identifier,
          mainImage: found.images?.[0]?.url || '',
          totalStock: (found.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0),
        };
      }
      return null;
    }

    let query = { slug: identifier };
    if (ObjectId.isValid(identifier)) {
      query = { $or: [{ slug: identifier }, { _id: new ObjectId(identifier) }, { sku: identifier }] };
    } else {
      query = { $or: [{ slug: identifier }, { sku: identifier }] };
    }

    const product = await db.collection('products').findOne(query);
    if (!product) {
      const found = INITIAL_PRODUCTS.find(p => p.slug === identifier || p.sku === identifier);
      if (found) {
        return {
          ...found,
          id: identifier,
          _id: identifier,
          mainImage: found.images?.[0]?.url || '',
          totalStock: (found.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0),
        };
      }
      return null;
    }

    return {
      ...product,
      id: product._id.toString(),
      _id: product._id.toString(),
      mainImage: product.images?.find(img => img.isMain)?.url || product.images?.[0]?.url || '',
      totalStock: (product.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0),
    };
  } catch (err) {
    console.warn('getProductBySlugOrId fallback:', err.message);
    const found = INITIAL_PRODUCTS.find(p => p.slug === identifier || p.sku === identifier);
    if (found) {
      return {
        ...found,
        id: identifier,
        _id: identifier,
        mainImage: found.images?.[0]?.url || '',
        totalStock: (found.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0),
      };
    }
    return null;
  }
}

export async function createProduct(productData) {
  const db = await ensureDb();
  if (!db) throw new Error('Database connection unavailable');

  const now = new Date();
  const slug = productData.slug || productData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const doc = {
    ...productData,
    slug,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection('products').insertOne(doc);
  return { ...doc, id: result.insertedId.toString(), _id: result.insertedId.toString() };
}

export async function updateProduct(id, updates) {
  const db = await ensureDb();
  if (!db) throw new Error('Database connection unavailable');

  const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { slug: id };
  const updateDoc = {
    ...updates,
    updatedAt: new Date(),
  };

  delete updateDoc._id;
  delete updateDoc.id;

  await db.collection('products').updateOne(query, { $set: updateDoc });
  return getProductBySlugOrId(id);
}

export async function deleteProduct(id) {
  const db = await ensureDb();
  if (!db) throw new Error('Database connection unavailable');

  const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { slug: id };
  const result = await db.collection('products').deleteOne(query);
  return result.deletedCount > 0;
}

// ─── ORDERS ─────────────────────────────────────────────────────

export async function createOrder(orderData) {
  const db = await ensureDb();
  if (!db) throw new Error('Database connection unavailable');

  const orderNumber = orderData.orderNumber || `HC-${Date.now().toString().slice(-6)}`;
  const now = new Date();

  const doc = {
    orderNumber,
    ...orderData,
    status: orderData.status || 'placed',
    placedAt: now,
    updatedAt: now,
  };

  const result = await db.collection('orders').insertOne(doc);

  // Decrement variant stock
  if (Array.isArray(orderData.items)) {
    for (const item of orderData.items) {
      if (item.productId && item.size) {
        const prodQuery = ObjectId.isValid(item.productId) ? { _id: new ObjectId(item.productId) } : { slug: item.productId };
        await db.collection('products').updateOne(
          { ...prodQuery, 'variants.size': String(item.size) },
          { $inc: { 'variants.$.stock': -Number(item.quantity || 1) } }
        );
      }
    }
  }

  return { ...doc, id: result.insertedId.toString(), _id: result.insertedId.toString() };
}

export async function getOrders({ customerEmail, status, limit = 50 } = {}) {
  try {
    const db = await ensureDb();
    if (!db) return [];

    const filter = {};
    if (customerEmail) filter.customerEmail = customerEmail;
    if (status && status !== 'all') filter.status = status;

    const orders = await db.collection('orders')
      .find(filter)
      .sort({ placedAt: -1 })
      .limit(limit)
      .toArray();

    return orders.map(o => ({
      ...o,
      id: o._id.toString(),
      _id: o._id.toString(),
    }));
  } catch (err) {
    return [];
  }
}

export async function getOrderByNumber(orderNumber) {
  try {
    const db = await ensureDb();
    if (!db) return null;

    const order = await db.collection('orders').findOne({ orderNumber });
    if (!order) return null;

    return {
      ...order,
      id: order._id.toString(),
      _id: order._id.toString(),
    };
  } catch (err) {
    return null;
  }
}

export async function updateOrderStatus(orderId, status) {
  const db = await ensureDb();
  if (!db) throw new Error('Database connection unavailable');

  const query = ObjectId.isValid(orderId) ? { _id: new ObjectId(orderId) } : { orderNumber: orderId };
  await db.collection('orders').updateOne(query, { $set: { status, updatedAt: new Date() } });
  return true;
}

// ─── ANALYTICS ──────────────────────────────────────────────────

export async function getAnalyticsSummary() {
  try {
    const db = await ensureDb();
    if (!db) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        totalProducts: 4,
        totalCustomers: 0,
        recentOrders: [],
        productBreakdown: [],
      };
    }

    const orders = await db.collection('orders').find({}).toArray();
    const productCount = await db.collection('products').countDocuments({});
    const customerCount = await db.collection('users').countDocuments({ role: 'customer' });

    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const totalOrders = orders.length;

    // Calculate real sales per product
    const productSalesMap = {};
    for (const order of orders) {
      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          const key = item.title || 'Other';
          const qty = Number(item.quantity) || 1;
          const price = Number(item.price) || 0;
          if (!productSalesMap[key]) {
            productSalesMap[key] = { title: key, revenue: 0, count: 0 };
          }
          productSalesMap[key].revenue += price * qty;
          productSalesMap[key].count += qty;
        }
      }
    }

    const productBreakdown = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue);

    const recentOrders = await db.collection('orders')
      .find({})
      .sort({ placedAt: -1 })
      .limit(5)
      .toArray();

    return {
      totalRevenue,
      totalOrders,
      totalProducts: productCount || 0,
      totalCustomers: customerCount || 0,
      recentOrders: recentOrders.map(o => ({
        ...o,
        id: o._id.toString(),
        _id: o._id.toString(),
      })),
      productBreakdown,
    };
  } catch (err) {
    return {
      totalRevenue: 0,
      totalOrders: 0,
      totalProducts: 0,
      totalCustomers: 0,
      recentOrders: [],
      productBreakdown: [],
    };
  }
}
