import { Request, Response } from 'express';
import {
  createPaymentIntent,
  getPaymentStatus,
  getAvailableProviders,
  refundPayment
} from '../src/controllers/payment.controller';
import { pool } from '../src/config/database';
import { getPaymentService } from '../src/services/payment/PaymentService';

// Mock dependencies
jest.mock('../src/config/database');
jest.mock('../src/services/payment/PaymentService');
jest.mock('../src/utils/logger');

describe('Payment Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockClient: any;
  let mockPaymentService: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock client
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    (pool.connect as jest.Mock).mockResolvedValue(mockClient);

    // Mock payment service
    mockPaymentService = {
      createPayment: jest.fn(),
      getPaymentStatus: jest.fn(),
      refundPayment: jest.fn(),
      isProviderAvailable: jest.fn().mockReturnValue(true),
      getAvailableProviders: jest.fn().mockReturnValue(['stripe', 'xendit']),
    };

    (getPaymentService as jest.Mock).mockReturnValue(mockPaymentService);

    // Mock request
    mockRequest = {
      body: {},
      user: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      },
      params: {},
    } as any;

    // Mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    mockClient.release();
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent successfully with Stripe', async () => {
      mockRequest.body = {
        package_type: 'personal',
        amount: 100,
        payment_method_type: 'card',
        provider: 'stripe',
      };

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            transaction_code: 'TRX-12345',
            status: 'pending',
          }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: 1 }],
        });

      mockPaymentService.createPayment.mockResolvedValue({
        paymentId: 'pi_123456',
        paymentUrl: 'https://checkout.stripe.com/pay/cs_test_123',
        status: 'pending',
      });

      await createPaymentIntent(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          paymentId: 'pi_123456',
        })
      );
    });

    it('should create payment intent successfully with Xendit', async () => {
      mockRequest.body = {
        package_type: 'couple',
        amount: 200,
        payment_method_type: 'bank_transfer',
        provider: 'xendit',
      };

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{
            id: 2,
            transaction_code: 'TRX-67890',
            status: 'pending',
          }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: 2 }],
        });

      mockPaymentService.createPayment.mockResolvedValue({
        paymentId: 'va_123456',
        paymentUrl: 'https://checkout.xendit.co/web/123',
        status: 'pending',
      });

      await createPaymentIntent(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockClient.query).toHaveBeenCalled();
    });

    it('should return 400 for missing required fields', async () => {
      mockRequest.body = {
        package_type: 'personal',
        // Missing amount and payment_method_type
      };

      await createPaymentIntent(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Missing required fields'),
        })
      );
    });

    it('should return 400 for invalid package type', async () => {
      mockRequest.body = {
        package_type: 'invalid_package',
        amount: 100,
        payment_method_type: 'card',
      };

      await createPaymentIntent(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Invalid package_type'),
        })
      );
    });

    it('should validate valid package types', async () => {
      const validPackages = ['personal', 'couple', 'team'];

      for (const packageType of validPackages) {
        jest.clearAllMocks();

        mockRequest.body = {
          package_type: packageType,
          amount: 100,
          payment_method_type: 'card',
        };

        mockClient.query
          .mockResolvedValueOnce({
            rows: [{ id: 1, transaction_code: 'TRX-123' }],
          })
          .mockResolvedValueOnce({
            rows: [{ id: 1 }],
          });

        mockPaymentService.createPayment.mockResolvedValue({
          paymentId: 'pi_123',
          status: 'pending',
        });

        await createPaymentIntent(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
      }
    });

    it('should return 400 when payment provider is not configured', async () => {
      mockRequest.body = {
        package_type: 'personal',
        amount: 100,
        payment_method_type: 'card',
        provider: 'stripe',
      };

      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: 1, transaction_code: 'TRX-123' }],
      });

      mockPaymentService.isProviderAvailable.mockReturnValue(false);

      await createPaymentIntent(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('not configured'),
          availableProviders: expect.any(Array),
        })
      );
    });

    it('should generate unique transaction code', async () => {
      mockRequest.body = {
        package_type: 'personal',
        amount: 100,
        payment_method_type: 'card',
      };

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, transaction_code: 'TRX-123' }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: 1 }],
        });

      mockPaymentService.createPayment.mockResolvedValue({
        paymentId: 'pi_123',
        status: 'pending',
      });

      await createPaymentIntent(mockRequest as Request, mockResponse as Response);

      const insertCall = mockClient.query.mock.calls[0];
      const transactionCode = insertCall[1][5];

      expect(transactionCode).toMatch(/^TRX-\d+-[A-Z0-9]+$/);
    });

    it('should handle payment service errors', async () => {
      mockRequest.body = {
        package_type: 'personal',
        amount: 100,
        payment_method_type: 'card',
      };

      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: 1, transaction_code: 'TRX-123' }],
      });

      mockPaymentService.createPayment.mockRejectedValue(
        new Error('Payment service error')
      );

      await createPaymentIntent(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );
    });

    it('should set correct currency based on provider', async () => {
      // Test Stripe (USD)
      mockRequest.body = {
        package_type: 'personal',
        amount: 100,
        payment_method_type: 'card',
        provider: 'stripe',
      };

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, transaction_code: 'TRX-123' }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: 1 }],
        });

      mockPaymentService.createPayment.mockResolvedValue({
        paymentId: 'pi_123',
      });

      await createPaymentIntent(mockRequest as Request, mockResponse as Response);

      const paymentRequest = mockPaymentService.createPayment.mock.calls[0][0];
      expect(paymentRequest.currency).toBe('USD');

      // Test Xendit (IDR)
      jest.clearAllMocks();
      mockRequest.body.provider = 'xendit';

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ id: 2, transaction_code: 'TRX-456' }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: 2 }],
        });

      await createPaymentIntent(mockRequest as Request, mockResponse as Response);

      const xenditRequest = mockPaymentService.createPayment.mock.calls[0][0];
      expect(xenditRequest.currency).toBe('IDR');
    });
  });

  describe('getPaymentStatus', () => {
    it('should return payment status successfully', async () => {
      mockRequest.params = { transactionCode: 'TRX-12345' };

      mockClient.query.mockResolvedValue({
        rows: [{
          id: 1,
          transaction_code: 'TRX-12345',
          status: 'completed',
          amount: 100,
          payment_gateway_id: 'pi_123',
        }],
      });

      await getPaymentStatus(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          transaction: expect.objectContaining({
            transaction_code: 'TRX-12345',
            status: 'completed',
          }),
        })
      );
    });

    it('should return 404 for non-existent transaction', async () => {
      mockRequest.params = { transactionCode: 'TRX-INVALID' };

      mockClient.query.mockResolvedValue({
        rows: [],
      });

      await getPaymentStatus(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('not found'),
        })
      );
    });

    it('should handle database errors', async () => {
      mockRequest.params = { transactionCode: 'TRX-12345' };

      mockClient.query.mockRejectedValue(new Error('Database error'));

      await getPaymentStatus(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAvailableProviders', () => {
    it('should return list of available payment providers', async () => {
      await getAvailableProviders(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          providers: expect.arrayContaining(['stripe', 'xendit']),
        })
      );
    });

    it('should return empty array when no providers available', async () => {
      mockPaymentService.getAvailableProviders.mockReturnValue([]);

      await getAvailableProviders(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          providers: [],
        })
      );
    });
  });

  describe('refundPayment', () => {
    it('should process refund successfully', async () => {
      mockRequest.params = { transactionCode: 'TRX-12345' };
      mockRequest.body = { reason: 'Customer request' };

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            transaction_code: 'TRX-12345',
            status: 'completed',
            payment_gateway_id: 'pi_123',
            amount: 100,
          }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: 1 }],
        });

      mockPaymentService.refundPayment.mockResolvedValue({
        success: true,
        refundId: 're_123',
      });

      await refundPayment(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          refundId: 're_123',
        })
      );
    });

    it('should return 404 for non-existent transaction', async () => {
      mockRequest.params = { transactionCode: 'TRX-INVALID' };

      mockClient.query.mockResolvedValue({
        rows: [],
      });

      await refundPayment(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 for already refunded transaction', async () => {
      mockRequest.params = { transactionCode: 'TRX-12345' };

      mockClient.query.mockResolvedValue({
        rows: [{
          id: 1,
          status: 'refunded',
        }],
      });

      await refundPayment(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('already refunded'),
        })
      );
    });

    it('should handle refund service errors', async () => {
      mockRequest.params = { transactionCode: 'TRX-12345' };

      mockClient.query.mockResolvedValue({
        rows: [{
          id: 1,
          status: 'completed',
          payment_gateway_id: 'pi_123',
        }],
      });

      mockPaymentService.refundPayment.mockRejectedValue(
        new Error('Refund failed')
      );

      await refundPayment(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Database Connection Management', () => {
    it('should release client on success', async () => {
      mockRequest.body = {
        package_type: 'personal',
        amount: 100,
        payment_method_type: 'card',
      };

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, transaction_code: 'TRX-123' }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: 1 }],
        });

      mockPaymentService.createPayment.mockResolvedValue({
        paymentId: 'pi_123',
      });

      await createPaymentIntent(mockRequest as Request, mockResponse as Response);

      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should release client on error', async () => {
      mockRequest.body = {
        package_type: 'personal',
        amount: 100,
        payment_method_type: 'card',
      };

      mockClient.query.mockRejectedValue(new Error('Database error'));

      await createPaymentIntent(mockRequest as Request, mockResponse as Response);

      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
