/**
 * Customer Controller Tests
 */

import request from 'supertest';
import express from 'express';
import pool from '../src/config/database';
import * as customerController from '../src/controllers/customer.controller';
import { authenticate } from '../src/middleware/auth.middleware';
import { upload } from '../src/config/multer.config';

// Mock database
jest.mock('../src/config/database');
const mockPool = pool as jest.Mocked<typeof pool>;

// Mock email service
jest.mock('../src/services/email.service', () => ({
  emailService: {
    sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true }),
    isReady: jest.fn().mockReturnValue(true),
  },
}));

// Mock authentication middleware
jest.mock('../src/middleware/auth.middleware', () => ({
  authenticate: jest.fn((req, _res, next) => {
    req.user = {
      id: 'test-user-id',
      role: 'institution_admin',
      institution_id: 'test-institution-id',
    };
    next();
  }),
}));

describe('Customer Controller', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Setup routes
    app.get('/customers', authenticate, customerController.getCustomers);
    app.get('/customers/:customerId', authenticate, customerController.getCustomer);
    app.post('/customers', authenticate, customerController.createCustomer);
    app.put('/customers/:customerId', authenticate, customerController.updateCustomer);
    app.delete('/customers/:customerId', authenticate, customerController.deleteCustomer);
    app.get('/customers/template/download', authenticate, customerController.downloadTemplate);
    app.post(
      '/customers/bulk-import',
      authenticate,
      upload.single('file'),
      customerController.bulkImportCustomers
    );
    app.get('/customers/import-history/list', authenticate, customerController.getImportHistory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /customers', () => {
    it('should return paginated customers list', async () => {
      const mockCustomers = [
        {
          id: '1',
          email: 'customer1@example.com',
          name: 'Customer 1',
          total_tests: 5,
          completed_tests: 3,
        },
        {
          id: '2',
          email: 'customer2@example.com',
          name: 'Customer 2',
          total_tests: 2,
          completed_tests: 1,
        },
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '2' }] } as any) // Count query
        .mockResolvedValueOnce({ rows: mockCustomers } as any); // Data query

      const response = await request(app).get('/customers').query({
        page: '1',
        limit: '20',
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.customers).toHaveLength(2);
      expect(response.body.data.pagination).toEqual({
        total: 2,
        page: 1,
        limit: 20,
        total_pages: 1,
      });
    });

    it('should filter customers by status', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] } as any)
        .mockResolvedValueOnce({
          rows: [
            {
              id: '1',
              email: 'active@example.com',
              name: 'Active User',
              is_active: true,
            },
          ],
        } as any);

      const response = await request(app).get('/customers').query({
        status: 'active',
      });

      expect(response.status).toBe(200);
      expect(response.body.data.customers).toHaveLength(1);
    });

    it('should filter customers by search term', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] } as any)
        .mockResolvedValueOnce({
          rows: [
            {
              id: '1',
              email: 'john@example.com',
              name: 'John Doe',
            },
          ],
        } as any);

      const response = await request(app).get('/customers').query({
        search: 'john',
      });

      expect(response.status).toBe(200);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.arrayContaining(['test-institution-id', '%john%'])
      );
    });

    it('should require institution_id for non-superadmin', async () => {
      // Mock should already set institution_id from user
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app).get('/customers');

      expect(response.status).toBe(200);
      // Should use user's institution_id
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['test-institution-id'])
      );
    });
  });

  describe('GET /customers/:customerId', () => {
    it('should return single customer details', async () => {
      const mockCustomer = {
        id: 'customer-1',
        email: 'customer@example.com',
        name: 'Customer Name',
        institution_id: 'test-institution-id',
        total_tests: 5,
        completed_tests: 3,
        password: 'hashed-password', // Should be removed
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockCustomer],
      } as any);

      const response = await request(app).get('/customers/customer-1');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.customer.email).toBe('customer@example.com');
      expect(response.body.data.customer.password).toBeUndefined(); // Password should be removed
    });

    it('should return 404 for non-existent customer', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app).get('/customers/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Customer not found');
    });

    it('should deny access to customer from different institution', async () => {
      const mockCustomer = {
        id: 'customer-1',
        institution_id: 'other-institution-id', // Different institution
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockCustomer],
      } as any);

      const response = await request(app).get('/customers/customer-1');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied to this customer');
    });
  });

  describe('POST /customers', () => {
    it('should create a new customer', async () => {
      const newCustomer = {
        email: 'new@example.com',
        name: 'New Customer',
        password: 'password123',
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'new-customer-id',
            email: newCustomer.email,
            name: newCustomer.name,
            institution_id: 'test-institution-id',
          },
        ],
      } as any);

      const response = await request(app).post('/customers').send(newCustomer);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.customer.email).toBe(newCustomer.email);
    });

    it('should handle duplicate email error', async () => {
      const duplicateCustomer = {
        email: 'existing@example.com',
        name: 'Duplicate',
        password: 'password123',
      };

      const dbError = new Error('duplicate key value violates unique constraint');
      (dbError as any).code = '23505';

      mockPool.query.mockRejectedValueOnce(dbError);

      const response = await request(app).post('/customers').send(duplicateCustomer);

      expect(response.status).toBe(500);
      expect(response.body.status).toBe('error');
    });
  });

  describe('PUT /customers/:customerId', () => {
    it('should update customer information', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '+1234567890',
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'customer-1',
            ...updateData,
          },
        ],
      } as any);

      const response = await request(app).put('/customers/customer-1').send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.customer.name).toBe(updateData.name);
    });

    it('should not update password or role', async () => {
      const maliciousUpdate = {
        name: 'Updated Name',
        password: 'new-password',
        role: 'superadmin',
        institution_id: 'other-institution',
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'customer-1', name: 'Updated Name' }],
      } as any);

      const response = await request(app).put('/customers/customer-1').send(maliciousUpdate);

      expect(response.status).toBe(200);

      // Verify that password, role, and institution_id were not included in the query
      const queryCall = mockPool.query.mock.calls[0];
      expect(queryCall[0]).not.toContain('password');
      expect(queryCall[0]).not.toContain('role');
      expect(queryCall[0]).not.toContain('institution_id');
    });

    it('should return 400 for empty update', async () => {
      const response = await request(app).put('/customers/customer-1').send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('No valid fields to update');
    });
  });

  describe('DELETE /customers/:customerId', () => {
    it('should deactivate customer (soft delete)', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'customer-1' }],
      } as any);

      const response = await request(app).delete('/customers/customer-1');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Customer deactivated successfully');

      // Verify it's a soft delete (is_active = false)
      const queryCall = mockPool.query.mock.calls[0];
      expect(queryCall[0]).toContain('is_active = false');
    });

    it('should return 404 for non-existent customer', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app).delete('/customers/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Customer not found');
    });
  });

  describe('GET /customers/template/download', () => {
    it('should return Excel template file', async () => {
      const response = await request(app).get('/customers/template/download');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('spreadsheetml');
      expect(response.headers['content-disposition']).toContain('customer-import-template');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database connection error'));

      const response = await request(app).get('/customers');

      expect(response.status).toBe(500);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBeTruthy();
    });
  });
});
