'use strict';

require('dotenv').config();
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const { MongoClient } = require('mongodb');

async function testFetch() {
  const uri = process.env.MONGODB_URI;
  console.log('Testing connection to MongoDB Atlas with new credentials...\n');

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log(' Successfully connected to MongoDB Atlas!\n');

    const adminDb = client.db().admin();
    const dbsList = await adminDb.listDatabases();
    console.log('Databases available in your cluster:');
    dbsList.databases.forEach(db => console.log(` • ${db.name} (${db.sizeOnDisk} bytes)`));

    console.log('\nInspecting collections and documents:');
    for (const d of dbsList.databases) {
      if (['admin', 'local', 'config'].includes(d.name)) continue;
      const targetDb = client.db(d.name);
      const collections = await targetDb.listCollections().toArray();
      console.log(`\n Database: "${d.name}" (${collections.length} collection(s))`);
      for (const col of collections) {
        const count = await targetDb.collection(col.name).countDocuments();
        console.log(`   └─ Collection: "${col.name}" -> ${count} document(s)`);
        if (count > 0) {
          const docs = await targetDb.collection(col.name).find({}).limit(5).toArray();
          console.log(`      Documents preview:`, JSON.stringify(docs, null, 2));
        }
      }
    }

  } catch (err) {
    console.error(' MongoDB Connection Error:', err.message);
  } finally {
    await client.close();
  }
}

testFetch();
