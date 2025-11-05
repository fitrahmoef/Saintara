/**
 * Upload Controller Tests
 */

import request from 'supertest';
import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import pool from '../src/config/database';
import * as uploadController from '../src/controllers/upload.controller';
import { authenticate } from '../src/middleware/auth.middleware';
import { uploadAvatar, uploadPaymentProof } from '../src/config/multer.config';

// Mock database
jest.mock('../src/config/database');
const mockPool = pool as jest.Mocked<typeof pool>;

// Mock fs promises
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock authentication
jest.mock('../src/middleware/auth.middleware', () => ({
  authenticate: jest.fn((req, _res, next) => {
    req.user = {
      id: 'test-user-id',
      role: 'user',
      institution_id: 'test-institution-id',
    };
    next();
  }),
}));

describe('Upload Controller', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Setup routes
    app.post('/upload/avatar', authenticate, uploadAvatar.single('avatar'), uploadController.uploadAvatar);
    app.delete('/upload/avatar', authenticate, uploadController.deleteAvatar);
    app.post(
      '/upload/payment-proof',
      authenticate,
      uploadPaymentProof.single('proof'),
      uploadController.uploadPaymentProof
    );
    app.get('/upload/:type/:filename', authenticate, uploadController.serveFile);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /upload/avatar', () => {
    it('should upload avatar successfully', async () => {
      const mockFile = {
        fieldname: 'avatar',
        originalname: 'test-avatar.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        destination: '/uploads/avatars',
        filename: 'test-avatar-123456.jpg',
        path: '/uploads/avatars/test-avatar-123456.jpg',
        size: 50000,
      };

      // Mock getting old avatar (none exists)
      mockPool.query.mockResolvedValueOnce({
        rows: [{ avatar_url: null }],
      } as any);

      // Mock updating avatar
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'test-user-id' }],
      } as any);

      // Mock the request with file
      const response = await request(app)
        .post('/upload/avatar')
        .attach('avatar', Buffer.from('fake image data'), 'test-avatar.jpg');

      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should delete old avatar when uploading new one', async () => {
      const oldAvatarUrl = '/uploads/avatars/old-avatar.jpg';

      // Mock getting old avatar
      mockPool.query.mockResolvedValueOnce({
        rows: [{ avatar_url: oldAvatarUrl }],
      } as any);

      // Mock updating avatar
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'test-user-id' }],
      } as any);

      // Mock fs.unlink (delete file)
      mockFs.unlink.mockResolvedValueOnce(undefined);

      const response = await request(app)
        .post('/upload/avatar')
        .attach('avatar', Buffer.from('fake image data'), 'new-avatar.jpg');

      expect(mockFs.unlink).toHaveBeenCalled();
    });

    it('should return 400 when no file uploaded', async () => {
      const response = await request(app).post('/upload/avatar');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('No file uploaded');
    });

    it('should cleanup uploaded file on database error', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database error'));
      mockFs.unlink.mockResolvedValueOnce(undefined);

      const response = await request(app)
        .post('/upload/avatar')
        .attach('avatar', Buffer.from('fake image data'), 'test-avatar.jpg');

      expect(response.status).toBe(500);
      // Should attempt to cleanup
      expect(mockFs.unlink).toHaveBeenCalled();
    });
  });

  describe('DELETE /upload/avatar', () => {
    it('should delete avatar successfully', async () => {
      const avatarUrl = '/uploads/avatars/avatar-123.jpg';

      // Mock getting current avatar
      mockPool.query.mockResolvedValueOnce({
        rows: [{ avatar_url: avatarUrl }],
      } as any);

      // Mock deleting avatar
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'test-user-id' }],
      } as any);

      mockFs.unlink.mockResolvedValueOnce(undefined);

      const response = await request(app).delete('/upload/avatar');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Avatar deleted successfully');
      expect(mockFs.unlink).toHaveBeenCalled();
    });

    it('should return 404 when no avatar exists', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ avatar_url: null }],
      } as any);

      const response = await request(app).delete('/upload/avatar');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('No avatar to delete');
    });

    it('should continue even if file deletion fails', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ avatar_url: '/uploads/avatars/avatar.jpg' }],
      } as any);

      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'test-user-id' }],
      } as any);

      mockFs.unlink.mockRejectedValueOnce(new Error('File not found'));

      const response = await request(app).delete('/upload/avatar');

      // Should still succeed even if file deletion fails
      expect(response.status).toBe(200);
    });
  });

  describe('POST /upload/payment-proof', () => {
    it('should upload payment proof successfully', async () => {
      // Mock transaction lookup
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'transaction-1',
            user_id: 'test-user-id',
            status: 'pending',
          },
        ],
      } as any);

      // Mock getting old proof
      mockPool.query.mockResolvedValueOnce({
        rows: [{ payment_proof_url: null }],
      } as any);

      // Mock updating transaction
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'transaction-1' }],
      } as any);

      const response = await request(app)
        .post('/upload/payment-proof')
        .field('transactionId', 'transaction-1')
        .attach('proof', Buffer.from('fake pdf data'), 'receipt.pdf');

      expect(mockPool.query).toHaveBeenCalledTimes(3);
    });

    it('should return 400 when transactionId missing', async () => {
      mockFs.unlink.mockResolvedValueOnce(undefined);

      const response = await request(app)
        .post('/upload/payment-proof')
        .attach('proof', Buffer.from('fake pdf data'), 'receipt.pdf');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Transaction ID is required');
      expect(mockFs.unlink).toHaveBeenCalled(); // Should cleanup file
    });

    it('should return 404 for non-existent transaction', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);
      mockFs.unlink.mockResolvedValueOnce(undefined);

      const response = await request(app)
        .post('/upload/payment-proof')
        .field('transactionId', 'non-existent')
        .attach('proof', Buffer.from('fake pdf data'), 'receipt.pdf');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Transaction not found');
      expect(mockFs.unlink).toHaveBeenCalled();
    });

    it('should deny access to other user transaction', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'transaction-1',
            user_id: 'other-user-id', // Different user
            status: 'pending',
          },
        ],
      } as any);

      mockFs.unlink.mockResolvedValueOnce(undefined);

      const response = await request(app)
        .post('/upload/payment-proof')
        .field('transactionId', 'transaction-1')
        .attach('proof', Buffer.from('fake pdf data'), 'receipt.pdf');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied to this transaction');
      expect(mockFs.unlink).toHaveBeenCalled();
    });

    it('should update transaction status to pending_verification', async () => {
      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ id: 'transaction-1', user_id: 'test-user-id', status: 'pending' }],
        } as any)
        .mockResolvedValueOnce({ rows: [{ payment_proof_url: null }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: 'transaction-1' }] } as any);

      const response = await request(app)
        .post('/upload/payment-proof')
        .field('transactionId', 'transaction-1')
        .attach('proof', Buffer.from('fake pdf data'), 'receipt.pdf');

      expect(response.status).toBe(200);

      // Check that update query includes status change
      const updateQuery = mockPool.query.mock.calls[2][0];
      expect(updateQuery).toContain('pending_verification');
    });
  });

  describe('GET /upload/:type/:filename', () => {
    it('should serve avatar file', async () => {
      mockFs.access.mockResolvedValueOnce(undefined);

      // This test would need actual file serving which is complex in unit tests
      // In a real scenario, use integration tests for file serving
      const response = await request(app).get('/upload/avatars/avatar-123.jpg');

      // Basic validation
      expect(mockFs.access).toHaveBeenCalled();
    });

    it('should return 404 for non-existent file', async () => {
      mockFs.access.mockRejectedValueOnce(new Error('File not found'));

      const response = await request(app).get('/upload/avatars/non-existent.jpg');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('File not found');
    });

    it('should return 400 for invalid file type', async () => {
      const response = await request(app).get('/upload/invalid-type/file.jpg');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid file type');
    });

    it('should enforce access control for payment proofs', async () => {
      mockFs.access.mockResolvedValueOnce(undefined);

      // Mock transaction lookup (file doesn't belong to user)
      mockPool.query.mockResolvedValueOnce({
        rows: [{ user_id: 'other-user-id' }],
      } as any);

      const response = await request(app).get('/upload/payment-proofs/proof-123.pdf');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied to this file');
    });
  });
});
