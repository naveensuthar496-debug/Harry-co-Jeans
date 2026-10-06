/**
 * HARRY & CO JEANS - ORIGIN SHIELD & REVERSE PROXY VERIFICATION MIDDLEWARE
 * 
 * Prevents attackers from directly discovering and communicating with the origin server IP.
 * Enforces that all inbound traffic must pass through Azure Front Door / CDN / Reverse Proxy.
 * Provides client IP resolution, admin subnet protection, and origin masking.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const auditLogFile = path.join(__dirname, '..', 'data', 'security_audit.log');

// Log security events for auditing
export function logSecurityEvent(type, details) {
  const timestamp = new Date().toISOString();
  const logEntry = JSON.stringify({
    timestamp,
    type,
    ...details
  }) + '\n';

  fs.appendFile(auditLogFile, logEntry, err => {
    if (err) console.error('Failed to write security audit log:', err.message);
  });
}

/**
 * Origin Shield Middleware
 */
export function originShield(req, res, next) {
  // 1. Resolve true client IP through trusted reverse proxy headers
  const clientIp = (
    req.headers['x-azure-clientip'] ||
    req.headers['cf-connecting-ip'] ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket.remoteAddress ||
    '127.0.0.1'
  );
  req.clientIp = clientIp;

  // 2. Allow public health probe without edge verification
  if (req.path === '/health' || req.path === '/api/v1/health') {
    return next();
  }

  // 3. Edge Proxy Validation (Origin IP Masking)
  // When REQUIRE_EDGE_PROXY is enabled, verify incoming request originated from Front Door or Reverse Proxy
  const requireEdge = process.env.REQUIRE_EDGE_PROXY === 'true';
  const expectedFdid = process.env.AZURE_FRONT_DOOR_ID;
  const expectedSecret = process.env.ORIGIN_VERIFY_SECRET;

  if (requireEdge) {
    const receivedFdid = req.headers['x-azure-fdid'];
    const receivedSecret = req.headers['x-origin-verify'];

    let isAuthorizedEdge = false;

    if (expectedFdid && receivedFdid === expectedFdid) {
      isAuthorizedEdge = true;
    }
    if (expectedSecret && receivedSecret === expectedSecret) {
      isAuthorizedEdge = true;
    }

    if (!isAuthorizedEdge) {
      logSecurityEvent('DIRECT_ORIGIN_ACCESS_ATTEMPT', {
        ip: clientIp,
        path: req.path,
        method: req.method,
        host: req.headers.host,
        userAgent: req.headers['user-agent']
      });

      return res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Direct origin IP communication is prohibited. Traffic must route through the secure edge proxy / WAF.'
      });
    }
  }

  // 4. Admin Network Isolation (Optional IP Allowlist for admin console & API)
  const isAdminPath = req.path.startsWith('/admin') || req.path.startsWith('/api/v1/admin');
  const adminAllowedIps = process.env.ADMIN_ALLOWED_IPS ? process.env.ADMIN_ALLOWED_IPS.split(',').map(s => s.trim()) : null;

  if (isAdminPath && adminAllowedIps && adminAllowedIps.length > 0) {
    const isAllowed = adminAllowedIps.some(allowed => {
      if (allowed === '*' || allowed === clientIp) return true;
      // Handle local development access
      if (allowed === '127.0.0.1' && (clientIp === '::1' || clientIp === '127.0.0.1' || clientIp === '::ffff:127.0.0.1')) return true;
      return false;
    });

    if (!isAllowed) {
      logSecurityEvent('ADMIN_ACCESS_BLOCKED_BY_IP', {
        ip: clientIp,
        path: req.path
      });

      return res.status(403).json({
        success: false,
        message: 'Access to administrative services is restricted to authorized network locations.'
      });
    }
  }

  // 5. Mask internal origin IP and host in response headers
  res.setHeader('X-Edge-Origin-Shield', 'Active');

  next();
}
