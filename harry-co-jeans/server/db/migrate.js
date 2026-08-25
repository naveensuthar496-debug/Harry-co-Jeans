'use strict';

// Standalone migration runner: applies schema.sql, then exits.
// Usage: node server/db/migrate.js
require('dotenv').config();
const { migrate, DB_PATH } = require('./database');

migrate();
console.log('[migrate] schema applied →', DB_PATH);
