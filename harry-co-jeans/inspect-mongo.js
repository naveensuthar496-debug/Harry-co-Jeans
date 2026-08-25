'use strict';

require('dotenv').config();
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const { MongoClient } = require('mongodb');

async function inspectCluster() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const adminDb = client.db().admin();
    const dbsList = await adminDb.listDatabases();

    console.log('=== MONGODB ATLAS DATABASES & COLLECTIONS ===\n');

    for (const d of dbsList.databases) {
      if (['admin', 'local', 'config'].includes(d.name)) continue;
      const targetDb = client.db(d.name);
      const collections = await targetDb.listCollections().toArray();
      console.log(`Database: [${d.name}]`);
      for (const col of collections) {
        const count = await targetDb.collection(col.name).countDocuments();
        console.log(`  - Collection: "${col.name}" (${count} documents)`);
        if (count > 0) {
          const sample = await targetDb.collection(col.name).findOne({});
          const keys = Object.keys(sample || {});
          console.log(`    Fields: ${keys.join(', ')}`);
        }
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.close();
  }
}

inspectCluster();
