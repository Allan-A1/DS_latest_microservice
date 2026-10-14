import { getRedis, INSTANCE_ID } from "../config/redis.js";

/**
 * Distributed Rate Limiter using Redis.
 * Applies uniformly across all API replica containers (api1, api2).
 * Default: 120 requests per 60 seconds per IP.
 */
export const distributedRateLimiter = (options = {}) => {
  const windowSeconds = options.windowSeconds || 60;
  const maxRequests = options.maxRequests || 120;

  return async (req, res, next) => {
    const redis = getRedis();
    if (!redis) {
      return next(); // Fail open if Redis is not configured
    }

    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "127.0.0.1";
    const key = `ratelimit:${ip}`;

    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      const ttl = await redis.ttl(key);
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - current));
      res.setHeader("X-RateLimit-Reset", ttl > 0 ? ttl : windowSeconds);

      if (current > maxRequests) {
        console.warn(`[${INSTANCE_ID}][RateLimit] Throttled IP ${ip} (${current}/${maxRequests})`);
        return res.status(429).json({
          success: false,
          message: "Too many requests. Please slow down.",
          retryAfterSeconds: ttl,
          instanceId: INSTANCE_ID,
        });
      }

      next();
    } catch (err) {
      console.warn(`[${INSTANCE_ID}][RateLimit] Redis check failed, failing open: ${err.message}`);
      next();
    }
  };
};
