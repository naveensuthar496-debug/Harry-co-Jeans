/**
 * HARRY & CO JEANS - PRODUCTION SECURITY HEADERS MIDDLEWARE
 * Enforces strict HTTP security headers, eliminates server fingerprinting,
 * and guards against MIME-sniffing, clickjacking, and cross-site scripting.
 */

export function securityHeaders(req, res, next) {
  // Strip server fingerprinting headers
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  // Enforce modern MIME sniffing protection
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Guard against clickjacking (allow only same origin framing for admin if needed)
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Cross-Site Scripting filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Strict Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Hardware / Feature Permissions Policy
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(self)'
  );

  // Content Security Policy - tailored for Harry & Co luxury storefront (supports Google Fonts, inline icons, analytics)
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.harryandcojeans.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'"
  ];
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

  // Enforce HSTS (Strict-Transport-Security) if request is HTTPS or forwarded via HTTPS proxy
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  if (isHttps || process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  next();
}
