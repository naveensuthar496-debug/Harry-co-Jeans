/**
 * HARRY & CO JEANS - WEB APPLICATION FIREWALL (WAF) MIDDLEWARE
 * 
 * Provides deep packet and payload inspection against OWASP Top 10 web attack vectors:
 * - SQL Injection (SQLi)
 * - Cross-Site Scripting (XSS)
 * - Path Traversal / Local File Inclusion (LFI)
 * - HTTP Request Smuggling
 * - Malicious Scanners, Attack Tools & Automated Bots
 * - Automated Abuse & Malicious Payloads
 */

import { logSecurityEvent } from './originShield.js';

// Suspicious / Malicious User Agents and Security Scanners
const BLOCKED_USER_AGENTS = [
  /sqlmap/i,
  /nikto/i,
  /acunetix/i,
  /dirbuster/i,
  /gobuster/i,
  /wpscan/i,
  /masscan/i,
  /nmap/i,
  /netsparker/i,
  /havij/i,
  /pangolin/i,
  /zgrab/i,
  /shodan/i
];

// SQL Injection Signature Patterns
const SQLI_PATTERNS = [
  /(\%27)|(\')|(\-\-)|(\%23)|(#)/i, // single quote or comment markers in sensitive contexts
  /\b(UNION\s+ALL\s+SELECT|UNION\s+SELECT)\b/i,
  /\b(SELECT\s+.*\s+FROM\s+information_schema)\b/i,
  /\b(WAITFOR\s+DELAY\s+[\'\"]\d+)/i,
  /\b(BENCHMARK\s*\(\s*\d+\s*,\s*MD5)/i,
  /\b(OR\s+1\s*=\s*1|OR\s+\'1\'\s*=\s*\'1\')\b/i,
  /\b(EXEC\s*\(\s*xp_cmdshell)/i,
  /\b(DROP\s+TABLE|ALTER\s+TABLE|TRUNCATE\s+TABLE)\b/i
];

// Cross-Site Scripting (XSS) Patterns
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /on(load|error|click|mouseover|submit|focus|blur|change)\s*=/gi,
  /<(iframe|embed|object|applet)\b/gi,
  /<img\s+[^>]*src\s*=\s*["']?javascript:/gi
];

// Path Traversal & LFI Patterns
const TRAVERSAL_PATTERNS = [
  /(\.\.[\/\\])/g,
  /(%2e%2e[\/\\])/gi,
  /(%2e%2e%2f)/gi,
  /(\/etc\/passwd|\/etc\/shadow|\/proc\/self)/i,
  /(c:\\windows\\system32|win\.ini|boot\.ini)/i
];

// In-Memory IP Reputation & Temporary Ban Tracker
const ipViolationTracker = new Map();
const BANNED_IPS = new Map(); // IP -> unban timestamp

const VIOLATION_THRESHOLD = 5;
const BAN_DURATION_MS = 15 * 60 * 1000; // 15 minutes ban

/**
 * Clean up expired bans periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [ip, expiry] of BANNED_IPS.entries()) {
    if (now > expiry) {
      BANNED_IPS.delete(ip);
      ipViolationTracker.delete(ip);
    }
  }
}, 60000);

function recordViolation(ip, reason, details) {
  const now = Date.now();
  const currentCount = (ipViolationTracker.get(ip) || 0) + 1;
  ipViolationTracker.set(ip, currentCount);

  logSecurityEvent('WAF_VIOLATION', {
    ip,
    violationCount: currentCount,
    reason,
    ...details
  });

  const isLoopback = (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1');
  if (currentCount >= VIOLATION_THRESHOLD && (process.env.NODE_ENV === 'production' || !isLoopback)) {
    BANNED_IPS.set(ip, now + BAN_DURATION_MS);
    logSecurityEvent('IP_TEMPORARY_BAN', {
      ip,
      banDurationMinutes: 15,
      reason: 'Repeated WAF violations exceeding threshold'
    });
  }
}

/**
 * Recursively check an object or string against regex pattern list
 */
function containsPattern(input, patterns) {
  if (!input) return false;

  if (typeof input === 'string') {
    for (const pattern of patterns) {
      if (pattern.test(input)) return true;
    }
    return false;
  }

  if (typeof input === 'object') {
    for (const key of Object.keys(input)) {
      // Don't test base64 image data strings which might trigger false positives
      if (typeof input[key] === 'string' && input[key].startsWith('data:image/')) {
        continue;
      }
      if (containsPattern(key, patterns) || containsPattern(input[key], patterns)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * WAF Engine Middleware
 */
export function wafMiddleware(req, res, next) {
  const clientIp = req.clientIp || req.socket.remoteAddress || 'unknown';

  // 1. Check if IP is currently banned by WAF
  const banExpiry = BANNED_IPS.get(clientIp);
  if (banExpiry) {
    if (Date.now() < banExpiry) {
      const remainingSec = Math.ceil((banExpiry - Date.now()) / 1000);
      return res.status(403).json({
        success: false,
        error: 'IP_BLOCKED',
        message: `Your IP has been temporarily restricted due to suspicious activity. Retry in ${remainingSec} seconds.`
      });
    } else {
      BANNED_IPS.delete(clientIp);
      ipViolationTracker.delete(clientIp);
    }
  }

  // 2. HTTP Request Smuggling Check
  // Requests should not specify both Transfer-Encoding and Content-Length
  if (req.headers['transfer-encoding'] && req.headers['content-length']) {
    recordViolation(clientIp, 'HTTP_REQUEST_SMUGGLING_ATTEMPT', {
      path: req.path
    });
    return res.status(400).json({
      success: false,
      message: 'Malformed HTTP headers detected.'
    });
  }

  // 3. User-Agent Scanner / Malicious Tool Check
  const userAgent = req.headers['user-agent'] || '';
  for (const botPattern of BLOCKED_USER_AGENTS) {
    if (botPattern.test(userAgent)) {
      recordViolation(clientIp, 'BLOCKED_SCANNER_USER_AGENT', {
        userAgent,
        path: req.path
      });
      return res.status(403).json({
        success: false,
        message: 'Automated vulnerability scanner rejected.'
      });
    }
  }

  // 4. Path Traversal & LFI Inspection
  const decodedPath = decodeURIComponent(req.path || '');
  if (containsPattern(decodedPath, TRAVERSAL_PATTERNS) || containsPattern(req.url, TRAVERSAL_PATTERNS)) {
    recordViolation(clientIp, 'PATH_TRAVERSAL_DETECTED', {
      path: req.path,
      rawUrl: req.url
    });
    return res.status(400).json({
      success: false,
      message: 'Invalid request path structure.'
    });
  }

  // 5. SQL Injection Inspection on Query Parameters and Headers
  if (containsPattern(req.query, SQLI_PATTERNS)) {
    recordViolation(clientIp, 'SQL_INJECTION_IN_QUERY', {
      query: req.query,
      path: req.path
    });
    return res.status(403).json({
      success: false,
      message: 'Prohibited SQL query characters detected.'
    });
  }

  // 6. XSS Inspection on Query Parameters
  if (containsPattern(req.query, XSS_PATTERNS)) {
    recordViolation(clientIp, 'XSS_IN_QUERY', {
      query: req.query,
      path: req.path
    });
    return res.status(403).json({
      success: false,
      message: 'Suspicious script syntax detected.'
    });
  }

  // 7. Body Inspection for POST / PUT / PATCH
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    // Only check for strict SQLi patterns (excluding harmless single quotes in customer comments)
    const STRICT_SQLI = [
      /\b(UNION\s+ALL\s+SELECT|UNION\s+SELECT)\b/i,
      /\b(SELECT\s+.*\s+FROM\s+information_schema)\b/i,
      /\b(WAITFOR\s+DELAY\s+[\'\"]\d+)/i,
      /\b(BENCHMARK\s*\(\s*\d+\s*,\s*MD5)/i,
      /\b(DROP\s+TABLE|ALTER\s+TABLE|TRUNCATE\s+TABLE)\b/i,
      /\b(EXEC\s*\(\s*xp_cmdshell)/i
    ];

    if (containsPattern(req.body, STRICT_SQLI)) {
      recordViolation(clientIp, 'SQL_INJECTION_IN_BODY', {
        path: req.path
      });
      return res.status(403).json({
        success: false,
        message: 'Malicious SQL constructs detected in request body.'
      });
    }

    if (containsPattern(req.body, XSS_PATTERNS)) {
      recordViolation(clientIp, 'XSS_IN_BODY', {
        path: req.path
      });
      return res.status(403).json({
        success: false,
        message: 'Cross-site scripting constructs detected in request body.'
      });
    }
  }

  next();
}
