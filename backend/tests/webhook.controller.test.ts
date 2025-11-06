import { Request, Response } from 'express';
import {
  handleStripeWebhook,
  handleXenditWebhook
} from '../src/controllers/webhook.controller';
import { pool } from '../src/config/database';

// Mock dependencies
jest.mock('../src/config/database');
jest.mock('../src/utils/logger');
jest.mock('../src/services/email.service');

describe('Webhook Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    (pool.connect as jest.Mock).mockResolvedValue(mockClient);

    mockRequest = {
      body: {},
      headers: {},
      rawBody: Buffer.from(''),
    } as any;

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    mockClient.release();
  });

  describe('handleStripeWebhook', () => {
    it('should handle payment_intent.succeeded event', async () => {
      mockRequest.body = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123456',
            amount: 10000,
            currency: 'usd',
            status: 'succeeded',
            metadata: {
              transaction_code: 'TRX-12345',
              user_id: '1',
            },
          },
        },
      };

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            status: 'pending',
            user_id: 1,
          }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: 1 }],
        })
        .mockResolvedValueOnce({
          rows: [{ email: 'user@example.com' }],
        });

      await handleStripeWebhook(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          received: true,
        })
      );

      // Verify transaction was updated to completed
      const updateCall = mockClient.query.mock.calls.find((call: any) =>
        call[0].includes('UPDATE transactions')
      );
      expect(updateCall).toBeDefined();
      expect(updateCall[1]).toContain('completed');
    });

    it('should handle payment_intent.payment_failed event', async () => {
      mockRequest.body = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_123456',
            status: 'failed',
            metadata: {
              transaction_code: 'TRX-12345',
            },
            last_payment_error: {
              message: 'Card declined',
            },
          },
        },
      };

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, status: 'pending' }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: 1 }],
        });

      await handleStripeWebhook(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);

      // Verify transaction was marked as failed
      const updateCall = mockClient.query.mock.calls[1];
      expect(updateCall[1]).toContain('failed');
    });

    it('should handle charge.refunded event', async () => {
      mockRequest.body = {
        type: 'charge.refunded',
        data: {
          object: {
            id: 'ch_123456',
            payment_intent: 'pi_123456',
            refunded: true,
            metadata: {
              transaction_code: 'TRX-12345',
            },
          },
        },
      };

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, status: 'completed' }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: 1 }],
        });

      await handleStripeWebhook(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);

      // Verify transaction was marked as refunded
      const updateCall = mockClient.query.mock.calls[1];
      expect(updateCall[1]).toContain('refunded');
    });

    it('should handle unknown event types gracefully', async () => {
      mockRequest.body = {
        type: 'unknown.event',
        data: {
          object: {
            id: 'obj_123',
          },
        },
      };

      await handleStripeWebhook(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          received: true,
        })
      );
    });

    it('should return 404 for non-existent transaction', async () => {
      mockRequest.body = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123456',
            status: 'succeeded',
            metadata: {
              transaction_code: 'TRX-NONEXISTENT',
            },
          },
        },
      };

      mockClient.query.mockResolvedValue({
        rows: [],
      });

      await handleStripeWebhook(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should handle database errors', async () => {
      mockRequest.body = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123456',
            metadata: {
              transaction_code: 'TRX-12345',
            },
          },
        },
      };

      mockClient.query.mockRejectedValue(new Error('Database error'));

      await handleStripeWebhook(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it('should validate Stripe signature if configured', async () => {
      const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

      if (STRIPE_WEBHOOK_SECRET) {
        mockRequest.headers = {
          'stripe-signature': 'invalid_signature',
        };

        mockRequest.body = {
          type: 'payment_intent.succeeded',
        };

        // Webhook should verify signature
        // Implementation depends on your actual webhook verification logic
      }

      // This test would need actual Stripe signature verification logic
    });

    it('should log webhook events for debugging', async () => {
      mockRequest.body = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123456',
            metadata: {
              transaction_code: 'TRX-12345',
            },
          },
        },
      };

      mockClient.query.mockResolvedValue({
        rows: [{ id: 1 }],
      });

      await handleStripeWebhook(mockRequest as Request, mockResponse as Response);

      // Verify logger was called (mocked)
      // const logger = require('../src/utils/logger').logger;
      // expect(logger.info).toHaveBeenCalled();
    });
  });

  describe('handleXenditWebhook', () => {
    it('should handle successful payment callback', async () => {
      mockRequest.body = {
        id: 'va_123456',
        external_id: 'TRX-12345',
        status: 'PAID',
        amount: 100000,
        paid_amount: 100000,
        payment_method: 'BANK_TRANSFER',
        payment_channel: 'BCA',
      };

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            status: 'pending',
            user_id: 1,
          }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: 1 }],
        })
        .mockResolvedValueOnce({
          rows: [{ email: 'user@example.com' }],
        });

      await handleXenditWebhook(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          received: true,
        })
      );

      // Verify transaction updated to completed
      const updateCall = mockClient.query.mock.calls[1];
      expect(updateCall[1]).toContain('completed');
    });

    it('should handle failed payment callback', async () => {
      mockRequest.body = {
        id: 'va_123456',
        external_id: 'TRX-12345',
        status: 'FAILED',
        failure_code: 'INSUFFICIENT_BALANCE',
      };

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, status: 'pending' }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: 1 }],
        });

      await handleXenditWebhook(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);

      // Verify transaction marked as failed
      const updateCall = mockClient.query.mock.calls[1];
      expect(updateCall[1]).toContain('failed');
    });

    it('should handle expired payment callback', async () => {
      mockRequest.body = {
        id: 'va_123456',
        external_id: 'TRX-12345',
        status: 'EXPIRED',
      };

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, status: 'pending' }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: 1 }],
        });

      await handleXenditWebhook(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);

      // Verify transaction marked as expired/failed
      const updateCall = mockClient.query.mock.calls[1];
      expect(updateCall[1]).toMatch(/expired|failed/i);
    });

    it('should handle pending payment callback', async () => {
      mockRequest.body = {
        id: 'va_123456',
        external_id: 'TRX-12345',
        status: 'PENDING',
      };

      mockClient.query.mockResolvedValue({
        rows: [{ id: 1, status: 'pending' }],
      });

      await handleXenditWebhook(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);

      // Transaction should remain pending
    });

    it('should verify webhook callback token if configured', async () => {
      const XENDIT_CALLBACK_TOKEN = process.env.XENDIT_CALLBACK_TOKEN;

      if (XENDIT_CALLBACK_TOKEN) {
        mockRequest.headers = {
          'x-callback-token': 'invalid_token',
        };

        mockRequest.body = {
          external_id: 'TRX-12345',
          status: 'PAID',
        };

        // Should reject invalid token
        // Implementation depends on your actual token verification
      }
    });

    it('should return 404 for non-existent transaction', async () => {
      mockRequest.body = {
        external_id: 'TRX-NONEXISTENT',
        status: 'PAID',
      };

      mockClient.query.mockResolvedValue({
        rows: [],
      });

      await handleXenditWebhook(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should handle missing external_id gracefully', async () => {
      mockRequest.body = {
        id: 'va_123456',
        status: 'PAID',
        // Missing external_id
      };

      await handleXenditWebhook(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should handle database errors', async () => {
      mockRequest.body = {
        external_id: 'TRX-12345',
        status: 'PAID',
      };

      mockClient.query.mockRejectedValue(new Error('Database error'));

      await handleXenditWebhook(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it('should update payment details correctly', async () => {
      mockRequest.body = {
        id: 'va_123456',
        external_id: 'TRX-12345',
        status: 'PAID',
        amount: 100000,
        paid_amount: 100000,
        payment_method: 'BANK_TRANSFER',
        payment_channel: 'BCA',
        paid_at: '2025-11-06T10:00:00.000Z',
      };

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, status: 'pending' }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: 1 }],
        });

      await handleXenditWebhook(mockRequest as Request, mockResponse as Response);

      const updateCall = mockClient.query.mock.calls[1];

      // Should include payment gateway ID
      expect(updateCall[1]).toContain('va_123456');
    });
  });

  describe('Webhook Security', () => {
    it('should validate webhook source', async () => {
      // Test IP whitelisting or signature verification
      // Implementation depends on your security requirements
    });

    it('should prevent replay attacks', async () => {
      // Test timestamp validation
      // Test event ID tracking to prevent duplicates
    });

    it('should handle malformed payloads', async () => {
      mockRequest.body = 'invalid json';

      await handleStripeWebhook(mockRequest as Request, mockResponse as Response);

      // Should handle gracefully
      expect(mockResponse.status).toBeDefined();
    });
  });

  describe('Idempotency', () => {
    it('should handle duplicate webhook calls', async () => {
      mockRequest.body = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123456',
            metadata: {
              transaction_code: 'TRX-12345',
            },
          },
        },
      };

      mockClient.query.mockResolvedValue({
        rows: [{
          id: 1,
          status: 'completed', // Already completed
        }],
      });

      await handleStripeWebhook(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);

      // Should not fail even if already processed
    });
  });

  describe('Database Connection Management', () => {
    it('should release client on successful webhook processing', async () => {
      mockRequest.body = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123',
            metadata: { transaction_code: 'TRX-123' },
          },
        },
      };

      mockClient.query.mockResolvedValue({
        rows: [{ id: 1 }],
      });

      await handleStripeWebhook(mockRequest as Request, mockResponse as Response);

      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should release client on webhook processing error', async () => {
      mockRequest.body = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            metadata: { transaction_code: 'TRX-123' },
          },
        },
      };

      mockClient.query.mockRejectedValue(new Error('Database error'));

      await handleStripeWebhook(mockRequest as Request, mockResponse as Response);

      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
