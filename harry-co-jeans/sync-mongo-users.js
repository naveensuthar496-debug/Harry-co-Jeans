'use strict';

require('dotenv').config();
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

async function syncUsers() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log(' Connected to MongoDB Atlas');

    const db = client.db(process.env.MONGODB_DB_NAME || 'harry_co_jeans');
    const usersCol = db.collection('users');

    // Create unique index on email
    await usersCol.createIndex({ email: 1 }, { unique: true });

    // Seed default admin and customer if not present
    const defaultAccounts = [
      {
        fullName: 'Harry Admin',
        email: 'admin@hcjeans.com',
        passwordHash: bcrypt.hashSync('admin123', 10),
        role: 'admin',
        phone: '+91 99999 00001',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        fullName: 'Arjun Verma',
        email: 'customer@hcjeans.com',
        passwordHash: bcrypt.hashSync('customer123', 10),
        role: 'customer',
        phone: '+91 98765 43210',
        loyaltyPoints: 500,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const acc of defaultAccounts) {
      const exists = await usersCol.findOne({ email: acc.email });
      if (!exists) {
        await usersCol.insertOne(acc);
        console.log(` Created account in MongoDB [${acc.role}]: ${acc.email}`);
      } else {
        console.log(` Existing account in MongoDB [${exists.role}]: ${exists.email}`);
      }
    }

    const count = await usersCol.countDocuments();
    console.log(`\n Total users in MongoDB "harry_co_jeans.users": ${count}`);

    const all = await usersCol.find({}).project({ passwordHash: 0 }).toArray();
    console.log('All Users:', all);

  } catch (err) {
    console.error('Error syncing to MongoDB:', err.message);
  } finally {
    await client.close();
  }
}

syncUsers();
