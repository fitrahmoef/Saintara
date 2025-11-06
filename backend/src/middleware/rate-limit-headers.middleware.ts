import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis';

/**
 * Enhanced Rate Limiting Middleware
 * Adds rate limit headers to responses
 */

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

export async function addRateLimitHeaders(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const identifier = req.ip || req.connection.remoteAddress || 'unknown';
    const key = `rate-limit:${identifier}`;

    // Get current rate limit info
    const current = await redisClient.get(key);
    const limit = 100; // requests per window
    const windowMs = 15 * 60 * 1000; // 15 minutes

    let remaining = limit;
    let reset = Date.now() + windowMs;

    if (current) {
      const data = JSON.parse(current);
      remaining = Math.max(0, limit - data.count);
      reset = data.resetTime;
    }

    // Add standard rate limit headers
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.floor(reset / 1000).toString());

    // Add Retry-After header if rate limited
    if (remaining === 0) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
    }

    next();
  } catch (error) {
    // Don't fail request if rate limit headers can't be added
    next();
  }
}

/**
 * Get rate limit info for user
 */
export async function getRateLimitInfo(identifier: string): Promise<RateLimitInfo> {
  const key = `rate-limit:${identifier}`;
  const limit = 100;
  const windowMs = 15 * 60 * 1000;

  const current = await redisClient.get(key);

  if (!current) {
    return {
      limit,
      remaining: limit,
      reset: Date.now() + windowMs,
    };
  }

  const data = JSON.parse(current);
  return {
    limit,
    remaining: Math.max(0, limit - data.count),
    reset: data.resetTime,
  };
}
