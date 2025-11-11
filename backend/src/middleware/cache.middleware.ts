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
export async function clearAllCache(): Promise<number> {
  const cache = new RedisCache();
  return await cache.delPattern('cache:*');
}

/**
 * Cache key builders for common patterns
 */
export const CacheKeys = {
  // User related
  userProfile: (userId: number) => `cache:user:profile:${userId}`,
  userTests: (userId: number) => `cache:user:tests:${userId}`,
  userTransactions: (userId: number) => `cache:user:transactions:${userId}`,

  // Test related
  testResult: (testId: number) => `cache:test:result:${testId}`,
  testQuestions: (testType: string) => `cache:test:questions:${testType}`,

  // Character types
  characterTypes: () => `cache:character:types:all`,
  characterType: (id: number) => `cache:character:type:${id}`,

  // Institution related
  institutionStats: (institutionId: number) => `cache:institution:stats:${institutionId}`,
  institutionUsers: (institutionId: number) => `cache:institution:users:${institutionId}`,
  institutionCustomers: (institutionId: number) => `cache:institution:customers:${institutionId}`,

  // Content
  articles: (page: number = 1) => `cache:articles:page:${page}`,
  article: (id: number) => `cache:article:${id}`,
  events: (page: number = 1) => `cache:events:page:${page}`,
  event: (id: number) => `cache:event:${id}`,
  faqs: () => `cache:faqs:all`,

  // Products and vouchers
  products: () => `cache:products:all`,
  product: (id: number) => `cache:product:${id}`,
  voucher: (code: string) => `cache:voucher:${code}`,
};

/**
 * Cache TTL constants (in seconds)
 */
export const CacheTTL = {
  SHORT: 60,           // 1 minute - for frequently changing data
  MEDIUM: 300,         // 5 minutes - for moderately changing data
  LONG: 3600,          // 1 hour - for rarely changing data
  VERY_LONG: 86400,    // 24 hours - for static data
  WEEK: 604800,        // 1 week - for very static data
};

/**
 * Helper function to wrap async functions with caching
 *
 * Usage:
 * const userData = await withCache(
 *   CacheKeys.userProfile(userId),
 *   CacheTTL.MEDIUM,
 *   async () => {
 *     return await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
 *   }
 * );
 */
export async function withCache<T>(
  cacheKey: string,
  ttl: number,
  fetchFunction: () => Promise<T>
): Promise<T> {
  const cache = new RedisCache();

  // Try to get from cache first
  const cached = await cache.get<T>(cacheKey);
  if (cached !== null) {
    logger.debug(`Cache HIT: ${cacheKey}`);
    return cached;
  }

  logger.debug(`Cache MISS: ${cacheKey}`);

  // Fetch data
  const data = await fetchFunction();

  // Cache the result (don't wait)
  cache.set(cacheKey, data, ttl).catch((error) => {
    logger.error(`Failed to cache ${cacheKey}:`, error);
  });

  return data;
}

/**
 * Invalidate cache for a specific user
 */
export async function invalidateUserCache(userId: number): Promise<number> {
  return await invalidateCache(`user:*:${userId}*`);
}

/**
 * Invalidate cache for a specific institution
 */
export async function invalidateInstitutionCache(institutionId: number): Promise<number> {
  return await invalidateCache(`institution:*:${institutionId}*`);
}
