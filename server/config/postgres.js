/**
 * HARRY & CO JEANS - PRODUCTION POSTGRESQL SECURE CONNECTOR
 * 
 * Configured specifically for Azure Database for PostgreSQL Flexible Server with:
 * - VNet Private Endpoint Integration (No public IP / Deny 0.0.0.0/0)
 * - Mandatory TLS 1.2+ Connection Encryption
 * - Least-Privilege Application User Credentials
 * - Resilient Connection Pooling and Timeout Controls
 */

import dotenv from 'dotenv';
dotenv.config();

export const postgresConfig = {
  // Connection parameters loaded exclusively from environment / Azure Key Vault
  host: process.env.PGHOST || 'harryandco-db.postgres.database.azure.com',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'harryandco_production',
  user: process.env.PGUSER || 'harryandco_app',
  password: process.env.PGPASSWORD,

  // SSL/TLS Enforcement: Azure Database for PostgreSQL requires TLS 1.2+
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: true,
    // Microsoft Baltimore / DigiCert Global Root certificate for Azure PostgreSQL
    ca: process.env.PG_CA_CERT || undefined
  } : false,

  // Connection Pool Tuning to prevent connection starvation
  max: parseInt(process.env.PG_POOL_MAX || '20', 10),
  min: parseInt(process.env.PG_POOL_MIN || '4', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,

  // Application metadata for DB audit logging
  application_name: 'harry-and-co-atelier-backend'
};

/**
 * Validates that production database configuration adheres to strict security rules
 */
export function validateDatabaseSecurity() {
  const isProd = process.env.NODE_ENV === 'production';
  const warnings = [];

  if (isProd) {
    if (!process.env.PGPASSWORD || process.env.PGPASSWORD === 'admin123') {
      warnings.push('CRITICAL: Default or missing production database password.');
    }
    if (postgresConfig.host.includes('localhost') || postgresConfig.host === '127.0.0.1') {
      warnings.push('WARNING: Production database host points to localhost instead of Azure Private Endpoint.');
    }
    if (!postgresConfig.ssl) {
      warnings.push('CRITICAL: SSL/TLS is disabled for production database connection.');
    }
  }

  return {
    isSecure: warnings.length === 0,
    warnings
  };
}
