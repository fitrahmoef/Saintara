import request from 'supertest';
import app from '../../src/app';
import { redisClient } from '../../src/config/redis';
import { pool } from '../../src/config/database';

/**
 * Integration Tests: Redis Caching
 * Tests caching functionality and performance
 */

describe('Redis Caching Integration', () => {
  let authToken: string;

  beforeAll(async () => {
    // Connect to Redis
    await redisClient.connect();

    // Login to get auth token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@saintara.com',
        password: 'admin123',
      });

    authToken = loginRes.body.token;
  });

  afterAll(async () => {
    await redisClient.quit();
    await pool.end();
  });

  afterEach(async () => {
    // Clear cache after each test
    await redisClient.flushDb();
  });

  describe('Cache Operations', () => {
    it('should cache test results', async () => {
      const testId = 1;
      const cacheKey = `test:${testId}`;

      // First request - cache miss
      const res1 = await request(app)
        .get(`/api/tests/${testId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res1.status).toBe(200);

      // Check if cached
      const cached = await redisClient.get(cacheKey);
      expect(cached).toBeTruthy();

      // Second request - cache hit
      const res2 = await request(app)
        .get(`/api/tests/${testId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res2.status).toBe(200);
      expect(res2.body).toEqual(res1.body);
    });

    it('should cache user profile', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);

      const userId = res.body.id;
      const cached = await redisClient.get(`user:${userId}`);
      expect(cached).toBeTruthy();
    });

    it('should cache character types', async () => {
      const res = await request(app)
        .get('/api/character-types')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);

      const cached = await redisClient.get('character-types:all');
      expect(cached).toBeTruthy();

      const cachedData = JSON.parse(cached!);
      expect(cachedData).toEqual(res.body);
    });

    it('should respect cache TTL', async () => {
      const testId = 1;
      const cacheKey = `test:${testId}`;

      await request(app)
        .get(`/api/tests/${testId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Set very short TTL for testing
      await redisClient.expire(cacheKey, 1);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1500));

      const cached = await redisClient.get(cacheKey);
      expect(cached).toBeNull();
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate cache on update', async () => {
      const userId = 1;
      const cacheKey = `user:${userId}`;

      // Get user (cache it)
      await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(await redisClient.get(cacheKey)).toBeTruthy();

      // Update user
      await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'Updated Name',
        });

      // Cache should be invalidated
      const cached = await redisClient.get(cacheKey);
      expect(cached).toBeNull();
    });

    it('should invalidate test cache on question update', async () => {
      const testId = 1;
      const cacheKey = `test:${testId}`;

      // Get test (cache it)
      await request(app)
        .get(`/api/tests/${testId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(await redisClient.get(cacheKey)).toBeTruthy();

      // Update test question (admin action)
      await request(app)
        .put(`/api/admin/questions/1`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionText: 'Updated question',
        });

      // Cache should be invalidated
      const cached = await redisClient.get(cacheKey);
      expect(cached).toBeNull();
    });

    it('should clear all user-related caches on deletion', async () => {
      const userId = 1;

      // Set multiple related caches
      await redisClient.set(`user:${userId}`, JSON.stringify({ id: userId }));
      await redisClient.set(`user:${userId}:tests`, JSON.stringify([]));
      await redisClient.set(`user:${userId}:transactions`, JSON.stringify([]));

      // Delete user account
      await request(app)
        .delete('/api/users/account')
        .set('Authorization', `Bearer ${authToken}`);

      // All related caches should be cleared
      expect(await redisClient.get(`user:${userId}`)).toBeNull();
      expect(await redisClient.get(`user:${userId}:tests`)).toBeNull();
      expect(await redisClient.get(`user:${userId}:transactions`)).toBeNull();
    });
  });

  describe('Session Management', () => {
    it('should store session in Redis', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@saintara.com',
          password: 'admin123',
        });

      expect(res.status).toBe(200);

      // Session should be in Redis
      const sessions = await redisClient.keys('session:*');
      expect(sessions.length).toBeGreaterThan(0);
    });

    it('should remove session on logout', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@saintara.com',
          password: 'admin123',
        });

      const token = loginRes.body.token;

      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      // Session should be removed
      const sessionKey = `session:${token}`;
      const session = await redisClient.get(sessionKey);
      expect(session).toBeNull();
    });

    it('should expire sessions after inactivity', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@saintara.com',
          password: 'admin123',
        });

      const token = loginRes.body.token;
      const sessionKey = `session:${token}`;

      // Set short TTL for testing
      await redisClient.expire(sessionKey, 1);

      await new Promise(resolve => setTimeout(resolve, 1500));

      // Session should be expired
      const session = await redisClient.get(sessionKey);
      expect(session).toBeNull();

      // Request with expired session should fail
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should track rate limit in Redis', async () => {
      const ip = '127.0.0.1';
      const limitKey = `rate-limit:${ip}`;

      // Make multiple requests
      for (let i = 0; i < 5; i++) {
        await request(app).get('/api/health');
      }

      // Rate limit counter should exist
      const count = await redisClient.get(limitKey);
      expect(count).toBeTruthy();
      expect(parseInt(count!)).toBeGreaterThan(0);
    });

    it('should block requests after rate limit exceeded', async () => {
      const endpoint = '/api/auth/login';

      // Make requests until rate limited
      let res;
      for (let i = 0; i < 10; i++) {
        res = await request(app)
          .post(endpoint)
          .send({
            email: 'test@example.com',
            password: 'wrongpassword',
          });

        if (res.status === 429) {
          break;
        }
      }

      expect(res!.status).toBe(429);
      expect(res!.body).toHaveProperty('message');
      expect(res!.body.message).toMatch(/rate limit|too many requests/i);
    });

    it('should reset rate limit after time window', async () => {
      const limitKey = 'rate-limit:127.0.0.1';

      // Set a count
      await redisClient.set(limitKey, '100', { EX: 1 });

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Counter should be reset
      const count = await redisClient.get(limitKey);
      expect(count).toBeNull();
    });
  });

  describe('Test Progress Caching', () => {
    it('should cache test progress', async () => {
      const testSessionId = 'test-session-123';

      await request(app)
        .post(`/api/tests/sessions/${testSessionId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentQuestion: 5,
          answers: { 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'A' },
          timeRemaining: 1800,
        });

      const cached = await redisClient.get(`test-progress:${testSessionId}`);
      expect(cached).toBeTruthy();

      const progress = JSON.parse(cached!);
      expect(progress.currentQuestion).toBe(5);
      expect(Object.keys(progress.answers)).toHaveLength(5);
    });

    it('should restore test progress from cache', async () => {
      const testSessionId = 'test-session-123';

      // Save progress
      await request(app)
        .post(`/api/tests/sessions/${testSessionId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentQuestion: 5,
          answers: { 1: 'A', 2: 'B' },
        });

      // Retrieve progress
      const res = await request(app)
        .get(`/api/tests/sessions/${testSessionId}/progress`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.currentQuestion).toBe(5);
      expect(res.body.answers).toHaveProperty('1', 'A');
    });

    it('should clear progress cache on test completion', async () => {
      const testSessionId = 'test-session-123';

      // Save progress
      await redisClient.set(
        `test-progress:${testSessionId}`,
        JSON.stringify({ currentQuestion: 5 })
      );

      // Complete test
      await request(app)
        .post(`/api/tests/${testSessionId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          answers: [
            { questionId: 1, answer: 'A' },
            { questionId: 2, answer: 'B' },
          ],
        });

      // Progress cache should be cleared
      const cached = await redisClient.get(`test-progress:${testSessionId}`);
      expect(cached).toBeNull();
    });
  });

  describe('Performance', () => {
    it('should be faster with cache', async () => {
      const testId = 1;

      // First request (no cache) - measure time
      const start1 = Date.now();
      await request(app)
        .get(`/api/tests/${testId}`)
        .set('Authorization', `Bearer ${authToken}`);
      const duration1 = Date.now() - start1;

      // Second request (with cache) - measure time
      const start2 = Date.now();
      await request(app)
        .get(`/api/tests/${testId}`)
        .set('Authorization', `Bearer ${authToken}`);
      const duration2 = Date.now() - start2;

      // Cached request should be faster
      expect(duration2).toBeLessThan(duration1);
    });

    it('should handle concurrent requests', async () => {
      const promises = Array(10)
        .fill(null)
        .map(() =>
          request(app)
            .get('/api/tests/1')
            .set('Authorization', `Bearer ${authToken}`)
        );

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(res => {
        expect(res.status).toBe(200);
      });
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache hits and misses', async () => {
      // Make some cached requests
      for (let i = 0; i < 5; i++) {
        await request(app)
          .get('/api/tests/1')
          .set('Authorization', `Bearer ${authToken}`);
      }

      // Get cache stats
      const res = await request(app)
        .get('/api/admin/cache/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('hits');
      expect(res.body).toHaveProperty('misses');
      expect(res.body).toHaveProperty('hitRate');
    });

    it('should allow cache clearing by admin', async () => {
      // Populate cache
      await request(app)
        .get('/api/tests/1')
        .set('Authorization', `Bearer ${authToken}`);

      // Clear cache
      const res = await request(app)
        .post('/api/admin/cache/clear')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);

      // Cache should be empty
      const keys = await redisClient.keys('*');
      expect(keys.length).toBe(0);
    });
  });
});
