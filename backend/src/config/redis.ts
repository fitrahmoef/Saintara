import Redis from 'ioredis';
import logger from './logger';

/**
 * Redis Client Configuration
 * Used for distributed caching and session storage
 */

let redisClient: Redis | null = null;

export function initRedis(): Redis | null {
  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = parseInt(process.env.REDIS_PORT || '6379');
  const redisPassword = process.env.REDIS_PASSWORD;

  try {
    redisClient = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis connected successfully');
    });

    redisClient.on('ready', () => {
      logger.info('✅ Redis is ready to accept commands');
    });

    redisClient.on('error', (err) => {
      logger.error('❌ Redis connection error:', err);
    });

    redisClient.on('close', () => {
      logger.warn('⚠️  Redis connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.info('🔄 Redis reconnecting...');
    });

    return redisClient;
  } catch (error) {
    logger.error('❌ Failed to initialize Redis:', error);
    return null;
  }
}

export function getRedis(): Redis | null {
  if (!redisClient) {
    logger.warn('⚠️  Redis not initialized. Caching disabled.');
  }
  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('👋 Redis connection closed');
  }
}

/**
 * Cache helper functions
 */
export class RedisCache {
  private redis: Redis | null;
  private defaultTTL: number = 3600; // 1 hour default

  constructor(redis: Redis | null = null) {
    this.redis = redis || getRedis();
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;

    try {
      const value = await this.redis.get(key);
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Redis get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const stringValue = JSON.stringify(value);
      await this.redis.setex(key, ttl, stringValue);
      return true;
    } catch (error) {
      logger.error(`Redis set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string | string[]): Promise<boolean> {
    if (!this.redis) return false;

    try {
      if (Array.isArray(key)) {
        await this.redis.del(...key);
      } else {
        await this.redis.del(key);
      }
      return true;
    } catch (error) {
      logger.error(`Redis del error:`, error);
      return false;
    }
  }

  /**
   * Delete all keys matching pattern
   */
  async delPattern(pattern: string): Promise<number> {
    if (!this.redis) return 0;

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;

      await this.redis.del(...keys);
      return keys.length;
    } catch (error) {
      logger.error(`Redis delPattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get remaining TTL for key
   */
  async ttl(key: string): Promise<number> {
    if (!this.redis) return -1;

    try {
      return await this.redis.ttl(key);
    } catch (error) {
      logger.error(`Redis ttl error for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Increment counter
   */
  async incr(key: string): Promise<number> {
    if (!this.redis) return 0;

    try {
      return await this.redis.incr(key);
    } catch (error) {
      logger.error(`Redis incr error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Decrement counter
   */
  async decr(key: string): Promise<number> {
    if (!this.redis) return 0;

    try {
      return await this.redis.decr(key);
    } catch (error) {
      logger.error(`Redis decr error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Increment counter with expiration
   */
  async incrEx(key: string, ttl: number): Promise<number> {
    if (!this.redis) return 0;

    try {
      const value = await this.redis.incr(key);
      await this.redis.expire(key, ttl);
      return value;
    } catch (error) {
      logger.error(`Redis incrEx error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Flush all cache (use with caution!)
   */
  async flushAll(): Promise<boolean> {
    if (!this.redis) return false;

    try {
      await this.redis.flushall();
      logger.warn('⚠️  Redis cache flushed (all data deleted)');
      return true;
    } catch (error) {
      logger.error('Redis flushAll error:', error);
      return false;
    }
  }
}

export default { initRedis, getRedis, closeRedis, RedisCache };
