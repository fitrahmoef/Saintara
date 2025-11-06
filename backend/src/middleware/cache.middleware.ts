import { Request, Response, NextFunction } from 'express';
import { RedisCache } from '../config/redis';
import logger from '../config/logger';

/**
 * Cache middleware for API responses
 * Usage: app.get('/api/endpoint', cacheMiddleware(300), controller)
 */

export function cacheMiddleware(ttl: number = 300) {
  const cache = new RedisCache();

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from URL and query params
    const cacheKey = `cache:${req.originalUrl || req.url}`;

    try {
      // Try to get cached response
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        logger.debug(`Cache HIT: ${cacheKey}`);
        return res.json(cachedData);
      }

      logger.debug(`Cache MISS: ${cacheKey}`);

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function (data: any) {
        // Cache successful responses only
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(cacheKey, data, ttl).catch((err) => {
            logger.error(`Failed to cache response for ${cacheKey}:`, err);
          });
        }

        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
}

/**
 * Cache invalidation helper
 */
export async function invalidateCache(pattern: string): Promise<number> {
  const cache = new RedisCache();
  return await cache.delPattern(`cache:${pattern}`);
}

/**
 * Clear all cache
 */
export async function clearAllCache(): Promise<boolean> {
  const cache = new RedisCache();
  return await cache.delPattern('cache:*');
}
