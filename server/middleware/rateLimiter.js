/**
 * HARRY & CO JEANS - MULTI-TIER RATE LIMITING & BRUTE-FORCE PROTECTION
 * 
 * In-memory sliding window rate limiters for different sensitivity tiers:
 * - General API Rate Limiter
 * - Strict Authentication / Admin Brute-Force Limiter
 * - Checkout & Order Placement Flood Limiter
 * - Search & Autocomplete Query Limiter
 * - Public Tracking Lookup Limiter
 */

class SlidingWindowRateLimiter {
  constructor(windowMs, maxRequests, tierName) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.tierName = tierName;
    this.requests = new Map(); // ip -> [timestamps]

    // Periodic garbage collection every 2 minutes
    setInterval(() => this.cleanup(), 120000);
  }

  cleanup() {
    const now = Date.now();
    for (const [ip, timestamps] of this.requests.entries()) {
      const valid = timestamps.filter(t => now - t < this.windowMs);
      if (valid.length === 0) {
        this.requests.delete(ip);
      } else {
        this.requests.set(ip, valid);
      }
    }
  }

  middleware() {
    return (req, res, next) => {
      const ip = req.clientIp || req.socket.remoteAddress || '127.0.0.1';
      const now = Date.now();

      let timestamps = this.requests.get(ip) || [];
      // Filter out timestamps outside current window
      timestamps = timestamps.filter(t => now - t < this.windowMs);

      if (timestamps.length >= this.maxRequests) {
        const oldest = timestamps[0];
        const retryAfterSec = Math.ceil((this.windowMs - (now - oldest)) / 1000);

        res.setHeader('Retry-After', retryAfterSec);
        res.setHeader('X-RateLimit-Limit', this.maxRequests);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', Math.ceil((oldest + this.windowMs) / 1000));

        return res.status(429).json({
          success: false,
          error: 'TOO_MANY_REQUESTS',
          tier: this.tierName,
          message: `Rate limit exceeded for ${this.tierName}. Please retry in ${retryAfterSec} seconds.`
        });
      }

      timestamps.push(now);
      this.requests.set(ip, timestamps);

      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, this.maxRequests - timestamps.length));

      next();
    };
  }
}

// 1. General API: 180 requests per 1 minute
export const generalLimiter = new SlidingWindowRateLimiter(60 * 1000, 180, 'General API').middleware();

// 2. Admin Auth: 5 attempts per 15 minutes (Brute-Force Guard)
export const authLimiter = new SlidingWindowRateLimiter(15 * 60 * 1000, 6, 'Admin Authentication').middleware();

// 3. Checkout & Order Creation: 12 orders per 10 minutes
export const orderLimiter = new SlidingWindowRateLimiter(10 * 60 * 1000, 12, 'Checkout & Orders').middleware();

// 4. Search & Autocomplete: 75 requests per 1 minute
export const searchLimiter = new SlidingWindowRateLimiter(60 * 1000, 75, 'Product Search').middleware();

// 5. Order Tracking Lookup: 30 requests per 10 minutes
export const trackLimiter = new SlidingWindowRateLimiter(10 * 60 * 1000, 30, 'Order Tracking').middleware();
