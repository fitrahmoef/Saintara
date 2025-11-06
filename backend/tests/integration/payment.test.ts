import request from 'supertest';
import app from '../../src/app';
import { pool } from '../../src/config/database';

/**
 * Integration Tests: Payment Gateway
 * Tests Xendit and Stripe payment processing
 */

describe('Payment Gateway Integration', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Login to get auth token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@saintara.com',
        password: 'admin123',
      });

    authToken = loginRes.body.token;
    userId = loginRes.body.user.id;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Xendit Payment', () => {
    it('should create Xendit invoice', async () => {
      const res = await request(app)
        .post('/api/payments/xendit/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          packageId: 1,
          amount: 100000,
          description: 'Premium Package - 1 Month',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('invoiceUrl');
      expect(res.body).toHaveProperty('invoiceId');
      expect(res.body).toHaveProperty('expiryDate');
    });

    it('should create Virtual Account payment', async () => {
      const res = await request(app)
        .post('/api/payments/xendit/va')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          packageId: 1,
          amount: 100000,
          bankCode: 'BNI',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accountNumber');
      expect(res.body).toHaveProperty('bankCode');
      expect(res.body).toHaveProperty('name');
    });

    it('should handle Xendit webhook - payment success', async () => {
      const webhookPayload = {
        id: 'test-invoice-id',
        external_id: 'order-123',
        status: 'PAID',
        amount: 100000,
        paid_amount: 100000,
        paid_at: new Date().toISOString(),
      };

      const res = await request(app)
        .post('/api/webhooks/xendit')
        .send(webhookPayload);

      expect(res.status).toBe(200);

      // Verify transaction updated in database
      const transaction = await pool.query(
        'SELECT * FROM transactions WHERE external_id = $1',
        ['order-123']
      );

      expect(transaction.rows[0].status).toBe('completed');
    });

    it('should handle Xendit webhook - payment failed', async () => {
      const webhookPayload = {
        id: 'test-invoice-id',
        external_id: 'order-124',
        status: 'EXPIRED',
        amount: 100000,
      };

      const res = await request(app)
        .post('/api/webhooks/xendit')
        .send(webhookPayload);

      expect(res.status).toBe(200);

      const transaction = await pool.query(
        'SELECT * FROM transactions WHERE external_id = $1',
        ['order-124']
      );

      expect(transaction.rows[0].status).toBe('failed');
    });

    it('should validate webhook signature', async () => {
      const res = await request(app)
        .post('/api/webhooks/xendit')
        .send({
          id: 'test',
          status: 'PAID',
        });

      // Should reject invalid signature
      expect([400, 401, 403]).toContain(res.status);
    });
  });

  describe('Stripe Payment', () => {
    it('should create Stripe checkout session', async () => {
      const res = await request(app)
        .post('/api/payments/stripe/create-checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          packageId: 1,
          amount: 100000,
          successUrl: 'http://localhost:3000/payment/success',
          cancelUrl: 'http://localhost:3000/payment/cancel',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('sessionId');
      expect(res.body).toHaveProperty('url');
    });

    it('should handle Stripe webhook - payment success', async () => {
      const webhookPayload = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            payment_status: 'paid',
            amount_total: 100000,
            metadata: {
              userId,
              packageId: '1',
            },
          },
        },
      };

      const res = await request(app)
        .post('/api/webhooks/stripe')
        .send(webhookPayload);

      expect(res.status).toBe(200);
    });

    it('should create payment intent', async () => {
      const res = await request(app)
        .post('/api/payments/stripe/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 100000,
          currency: 'idr',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('clientSecret');
    });

    it('should retrieve payment status', async () => {
      const res = await request(app)
        .get('/api/payments/stripe/status/pi_test_123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
    });
  });

  describe('Transaction Management', () => {
    it('should get user transaction history', async () => {
      const res = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should get single transaction details', async () => {
      const res = await request(app)
        .get('/api/transactions/1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('amount');
      expect(res.body).toHaveProperty('status');
    });

    it('should download invoice PDF', async () => {
      const res = await request(app)
        .get('/api/transactions/1/invoice')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });

    it('should apply discount code', async () => {
      const res = await request(app)
        .post('/api/payments/apply-discount')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'DISCOUNT10',
          amount: 100000,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('discountedAmount');
      expect(res.body.discountedAmount).toBeLessThan(100000);
    });

    it('should reject invalid discount code', async () => {
      const res = await request(app)
        .post('/api/payments/apply-discount')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'INVALID',
          amount: 100000,
        });

      expect(res.status).toBe(400);
    });

    it('should handle refund request', async () => {
      const res = await request(app)
        .post('/api/transactions/1/refund')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'Customer request',
        });

      expect([200, 202]).toContain(res.status);
    });
  });

  describe('Payment Validation', () => {
    it('should reject payment without authentication', async () => {
      const res = await request(app)
        .post('/api/payments/xendit/create')
        .send({
          packageId: 1,
          amount: 100000,
        });

      expect(res.status).toBe(401);
    });

    it('should reject invalid amount', async () => {
      const res = await request(app)
        .post('/api/payments/xendit/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          packageId: 1,
          amount: -1000,
        });

      expect(res.status).toBe(400);
    });

    it('should reject invalid package', async () => {
      const res = await request(app)
        .post('/api/payments/xendit/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          packageId: 99999,
          amount: 100000,
        });

      expect(res.status).toBe(404);
    });
  });
});
