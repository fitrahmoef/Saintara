import request from 'supertest';
import express, { Express } from 'express';

describe('Health Check', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.get('/health', (req, res) => {
      res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });
  });

  describe('GET /health', () => {
    it('should return 200 status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
    });

    it('should return status OK', async () => {
      const response = await request(app).get('/health');
      expect(response.body).toHaveProperty('status', 'OK');
    });

    it('should return timestamp', async () => {
      const response = await request(app).get('/health');
      expect(response.body).toHaveProperty('timestamp');
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });
  });
});
