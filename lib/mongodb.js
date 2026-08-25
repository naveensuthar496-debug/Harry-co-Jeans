import { MongoClient, ServerApiVersion } from 'mongodb';
import dns from 'node:dns';

function ensureDns() {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
    if (dns.setDefaultResultOrder) {
      dns.setDefaultResultOrder('ipv4first');
    }
  } catch {}
}

ensureDns();

const uri = process.env.MONGODB_URI || '';
const dbName = process.env.MONGODB_DB_NAME || 'harry_co_jeans';

let client = null;
let clientPromise = null;

export async function getMongoClient() {
  ensureDns();
  if (!uri) return null;

  if (client && client.topology && client.topology.isConnected()) {
    return client;
  }

  const options = {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  };

  try {
    client = new MongoClient(uri, options);
    await client.connect();
    return client;
  } catch (err) {
    console.warn('MongoDB connection warning:', err.message);
    return null;
  }
}

export async function getDb() {
  const c = await getMongoClient();
  if (!c) return null;
  return c.db(dbName);
}

export default getDb;
