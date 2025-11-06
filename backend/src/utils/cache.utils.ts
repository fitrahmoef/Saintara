/**
 * Simple in-memory cache utility
 * Caches frequently accessed database queries to reduce load
 * SECURITY: Prevents same queries from being executed 1000s of times/day
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number; // Time-to-live in milliseconds

  constructor(defaultTTL: number = 5 * 60 * 1000) {
    // Default: 5 minutes
    this.cache = new Map();
    this.defaultTTL = defaultTTL;

    // Cleanup expired entries every 60 seconds
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Get cached value
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached value
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);

    this.cache.set(key, {
      data,
      expiresAt,
    });
  }

  /**
   * Delete cached value
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      logger.info(`🧹 Cache cleanup: Removed ${expiredCount} expired entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Wrapper for caching database queries
   */
  async remember<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache
    const cached = this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetcher();

    // Store in cache
    this.set(key, data, ttl);

    return data;
  }
}

// Export singleton instance
export const cache = new SimpleCache();

// Export cache TTL constants
export const CacheTTL = {
  ONE_MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  FIFTEEN_MINUTES: 15 * 60 * 1000,
  THIRTY_MINUTES: 30 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
};

/**
 * Cache key builders
 */
export const CacheKeys = {
  characterTypes: () => 'character_types:all',
  characterType: (id: number) => `character_type:${id}`,
  characterTypeByCode: (code: string) => `character_type:code:${code}`,
  products: () => 'products:all',
  product: (code: string) => `product:${code}`,
  testQuestions: () => 'test_questions:all',
  userPermissions: (userId: number) => `user:${userId}:permissions`,
  institutionConfig: (institutionId: number) => `institution:${institutionId}:config`,
};
