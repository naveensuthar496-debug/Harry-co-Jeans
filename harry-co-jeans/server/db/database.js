'use strict';

const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'app.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// node:sqlite only binds null | number | bigint | string | Uint8Array.
// Normalize the values our app naturally produces (booleans, undefined,
// Date, plain objects) into bound-parameter-safe primitives.
function normalize(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object' && !(v instanceof Uint8Array)) return JSON.stringify(v);
  return v;
}

function bind(params) {
  return (Array.isArray(params) ? params : [params]).map(normalize);
}

/** Run an INSERT/UPDATE/DELETE. Returns { changes, lastInsertRowid }. */
function run(sql, params = []) {
  return db.prepare(sql).run(...bind(params));
}

/** Fetch a single row (or undefined). */
function get(sql, params = []) {
  return db.prepare(sql).get(...bind(params));
}

/** Fetch all matching rows. */
function all(sql, params = []) {
  return db.prepare(sql).all(...bind(params));
}

/** Execute raw SQL (possibly multiple statements). */
function exec(sql) {
  return db.exec(sql);
}

/** Run `fn` inside a transaction; rolls back on throw. */
function tx(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

/** Apply schema.sql (idempotent — every statement is CREATE ... IF NOT EXISTS). */
function migrate() {
  exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));
}

module.exports = { db, run, get, all, exec, tx, migrate, DB_PATH };
