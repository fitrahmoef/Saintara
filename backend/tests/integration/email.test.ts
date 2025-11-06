import request from 'supertest';
import app from '../../src/app';
import { pool } from '../../src/config/database';
import nodemailer from 'nodemailer';

/**
 * Integration Tests: Email Service
 * Tests email sending functionality
 */

// Mock nodemailer for testing
jest.mock('nodemailer');

describe('Email Service Integration', () => {
  let authToken: string;
  let mockSendMail: jest.Mock;

  beforeAll(async () => {
    // Setup mock transporter
    mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-message-id' });
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });

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
    await pool.end();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Registration Emails', () => {
    it('should send verification email on registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: `test-${Date.now()}@example.com`,
          password: 'Test123!@#',
          fullName: 'Test User',
        });

      expect(res.status).toBe(201);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: expect.any(String),
          subject: expect.stringMatching(/verifikasi|verification/i),
          html: expect.stringContaining('verify'),
        })
      );
    });

    it('should include verification link in email', async () => {
      const email = `test-${Date.now()}@example.com`;
      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'Test123!@#',
          fullName: 'Test User',
        });

      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.html).toMatch(/verify\?token=/);
    });

    it('should resend verification email', async () => {
      const res = await request(app)
        .post('/api/auth/resend-verification')
        .send({
          email: 'admin@saintara.com',
        });

      expect(res.status).toBe(200);
      expect(mockSendMail).toHaveBeenCalled();
    });
  });

  describe('Password Reset Emails', () => {
    it('should send password reset email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'admin@saintara.com',
        });

      expect(res.status).toBe(200);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@saintara.com',
          subject: expect.stringMatching(/reset.*password/i),
          html: expect.stringContaining('reset'),
        })
      );
    });

    it('should include reset token in email', async () => {
      await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'admin@saintara.com',
        });

      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.html).toMatch(/reset-password\?token=/);
    });

    it('should send password change confirmation', async () => {
      // Assuming password was changed
      // This would be triggered after successful password reset

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringMatching(/password.*changed|kata sandi.*diubah/i),
        })
      );
    });
  });

  describe('Test Result Emails', () => {
    it('should send test completion email', async () => {
      const res = await request(app)
        .post('/api/tests/1/complete')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          answers: [
            { questionId: 1, answer: 'A' },
            { questionId: 2, answer: 'B' },
          ],
        });

      expect(res.status).toBe(200);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringMatching(/hasil.*test|test.*result/i),
          html: expect.stringContaining('character'),
        })
      );
    });

    it('should include test results in email', async () => {
      const emailCall = mockSendMail.mock.calls[mockSendMail.mock.calls.length - 1][0];
      expect(emailCall.html).toMatch(/skor|score/i);
      expect(emailCall.html).toMatch(/tipe.*karakter|character.*type/i);
    });

    it('should attach PDF certificate if available', async () => {
      const emailCall = mockSendMail.mock.calls[mockSendMail.mock.calls.length - 1][0];
      if (emailCall.attachments) {
        expect(emailCall.attachments).toContainEqual(
          expect.objectContaining({
            filename: expect.stringMatching(/certificate.*\.pdf/i),
          })
        );
      }
    });
  });

  describe('Transaction Emails', () => {
    it('should send payment confirmation email', async () => {
      // Simulate webhook payment success
      const webhookPayload = {
        id: 'test-invoice-id',
        external_id: `order-${Date.now()}`,
        status: 'PAID',
        amount: 100000,
        paid_at: new Date().toISOString(),
      };

      await request(app)
        .post('/api/webhooks/xendit')
        .send(webhookPayload);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringMatching(/pembayaran.*berhasil|payment.*successful/i),
        })
      );
    });

    it('should send payment failed email', async () => {
      const webhookPayload = {
        id: 'test-invoice-id',
        external_id: `order-${Date.now()}`,
        status: 'EXPIRED',
        amount: 100000,
      };

      await request(app)
        .post('/api/webhooks/xendit')
        .send(webhookPayload);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringMatching(/pembayaran.*gagal|payment.*failed/i),
        })
      );
    });

    it('should send invoice email', async () => {
      const res = await request(app)
        .post('/api/transactions/1/send-invoice')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringMatching(/invoice/i),
          attachments: expect.arrayContaining([
            expect.objectContaining({
              filename: expect.stringMatching(/invoice.*\.pdf/i),
            }),
          ]),
        })
      );
    });
  });

  describe('Subscription Emails', () => {
    it('should send subscription activated email', async () => {
      // This would be triggered after successful payment

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringMatching(/subscription.*activated|langganan.*aktif/i),
        })
      );
    });

    it('should send subscription expiring reminder', async () => {
      const res = await request(app)
        .post('/api/admin/send-expiry-reminders')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(mockSendMail).toHaveBeenCalled();
    });

    it('should send subscription expired notification', async () => {
      // This would be triggered by a cron job

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringMatching(/subscription.*expired|langganan.*berakhir/i),
        })
      );
    });
  });

  describe('Email Templates', () => {
    it('should use proper email templates', async () => {
      const emailCall = mockSendMail.mock.calls[0][0];

      // Should have HTML content
      expect(emailCall.html).toBeDefined();
      expect(emailCall.html.length).toBeGreaterThan(0);

      // Should include company branding
      expect(emailCall.html).toMatch(/saintara/i);
    });

    it('should include text alternative', async () => {
      const emailCall = mockSendMail.mock.calls[0][0];

      // Should have text content for email clients that don't support HTML
      expect(emailCall.text).toBeDefined();
    });

    it('should have proper sender information', async () => {
      const emailCall = mockSendMail.mock.calls[0][0];

      expect(emailCall.from).toMatch(/saintara/i);
    });

    it('should include unsubscribe link for marketing emails', async () => {
      // Send a newsletter/marketing email
      const res = await request(app)
        .post('/api/admin/send-newsletter')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subject: 'Newsletter Test',
          content: 'Test content',
        });

      const emailCall = mockSendMail.mock.calls[mockSendMail.mock.calls.length - 1][0];
      expect(emailCall.html).toMatch(/unsubscribe|berhenti.*berlangganan/i);
    });
  });

  describe('Email Error Handling', () => {
    it('should handle email sending failure gracefully', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP connection failed'));

      const res = await request(app)
        .post('/api/auth/resend-verification')
        .send({
          email: 'admin@saintara.com',
        });

      // Should not crash, but log error
      expect([200, 500, 503]).toContain(res.status);
    });

    it('should retry failed email sends', async () => {
      mockSendMail
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({ messageId: 'test-message-id' });

      const res = await request(app)
        .post('/api/auth/resend-verification')
        .send({
          email: 'admin@saintara.com',
        });

      // Should eventually succeed after retry
      expect(mockSendMail).toHaveBeenCalledTimes(2);
    });

    it('should validate email addresses before sending', async () => {
      const res = await request(app)
        .post('/api/auth/resend-verification')
        .send({
          email: 'invalid-email',
        });

      expect(res.status).toBe(400);
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });

  describe('Email Queue', () => {
    it('should queue emails for bulk sending', async () => {
      const res = await request(app)
        .post('/api/admin/send-bulk-email')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipients: ['user1@example.com', 'user2@example.com'],
          subject: 'Bulk Test',
          content: 'Test content',
        });

      expect(res.status).toBe(202); // Accepted for processing
    });

    it('should not block request while sending emails', async () => {
      const startTime = Date.now();

      await request(app)
        .post('/api/admin/send-bulk-email')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipients: Array(100).fill('test@example.com'),
          subject: 'Bulk Test',
          content: 'Test content',
        });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should respond quickly (< 1 second) even for 100 emails
      expect(duration).toBeLessThan(1000);
    });
  });
});
