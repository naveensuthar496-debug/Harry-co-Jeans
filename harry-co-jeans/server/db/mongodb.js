'use strict';

const dns = require('node:dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

const { MongoClient, ServerApiVersion } = require('mongodb');

let client = null;
let db = null;

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'harry_co_jeans';

/**
 * Connect to MongoDB Atlas
 */
async function connectMongoDB(uri = MONGODB_URI, dbName = MONGODB_DB_NAME) {
  if (!uri || uri.includes('<db_password>')) {
    return { ok: false, message: 'MONGODB_URI not configured or missing password' };
  }

  if (client && db) {
    return { ok: true, client, db };
  }

  try {
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });

    await client.connect();
    // Test ping
    await client.db('admin').command({ ping: 1 });
    db = client.db(dbName);

    console.log(`Connected to MongoDB Atlas: database "${dbName}"`);
    return { ok: true, client, db };
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Get MongoDB Database instance
 */
function getDb() {
  return db;
}

/**
 * Fetch all users from MongoDB collection (e.g., "users")
 */
async function fetchMongoUsers(collectionName = 'users') {
  if (!db) {
    const conn = await connectMongoDB();
    if (!conn.ok) throw new Error(conn.error || conn.message);
  }
  const collection = db.collection(collectionName);
  return await collection.find({}).project({ passwordHash: 0, password: 0 }).toArray();
}

/**
 * Find user by email in MongoDB
 */
async function findMongoUserByEmail(email, collectionName = 'users') {
  if (!db) {
    const conn = await connectMongoDB();
    if (!conn.ok) return null;
  }
  const collection = db.collection(collectionName);
  return await collection.findOne({ email: email.toLowerCase().trim() });
}

module.exports = {
  connectMongoDB,
  getDb,
  fetchMongoUsers,
  findMongoUserByEmail
};
