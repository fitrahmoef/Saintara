import { Request, Response } from 'express';
import twoFactorAuthService from '../services/2fa.service';
import { logger } from '../utils/logger';

/**
 * Two-Factor Authentication Controller
 */

export class TwoFactorAuthController {
  /**
   * Setup 2FA - Generate secret and QR code
   * POST /api/2fa/setup
   */
  async setup(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const email = req.user!.email;

      const result = await twoFactorAuthService.generateSecret(userId, email);

      res.json({
        success: true,
        message: 'Scan QR code dengan Google Authenticator',
        data: {
          qrCode: result.qrCode,
          secret: result.secret,
          backupCodes: result.backupCodes,
        },
      });
    } catch (error) {
      logger.error('2FA Setup Error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal setup 2FA',
      });
    }
  }

  /**
   * Enable 2FA - Verify token and enable
   * POST /api/2fa/enable
   */
  async enable(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Token required',
        });
        return;
      }

      await twoFactorAuthService.enable2FA(userId, token);

      logger.info(`2FA enabled for user ${userId}`);

      res.json({
        success: true,
        message: '2FA berhasil diaktifkan',
      });
    } catch (error: any) {
      logger.error('2FA Enable Error:', error);

      if (error.message === 'Invalid token') {
        res.status(400).json({
          success: false,
          message: 'Token tidak valid',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Gagal mengaktifkan 2FA',
      });
    }
  }

  /**
   * Disable 2FA
   * POST /api/2fa/disable
   */
  async disable(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Token required',
        });
        return;
      }

      await twoFactorAuthService.disable2FA(userId, token);

      logger.info(`2FA disabled for user ${userId}`);

      res.json({
        success: true,
        message: '2FA berhasil dinonaktifkan',
      });
    } catch (error: any) {
      logger.error('2FA Disable Error:', error);

      if (error.message === 'Invalid token') {
        res.status(400).json({
          success: false,
          message: 'Token tidak valid',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Gagal menonaktifkan 2FA',
      });
    }
  }

  /**
   * Verify 2FA token (during login)
   * POST /api/2fa/verify
   */
  async verify(req: Request, res: Response): Promise<void> {
    try {
      const { userId, token, isBackupCode } = req.body;

      if (!userId || !token) {
        res.status(400).json({
          success: false,
          message: 'User ID dan token required',
        });
        return;
      }

      const verified = await twoFactorAuthService.authenticate2FA(
        userId,
        token,
        isBackupCode
      );

      if (!verified) {
        res.status(401).json({
          success: false,
          message: 'Token tidak valid',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Verifikasi berhasil',
      });
    } catch (error) {
      logger.error('2FA Verify Error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal verifikasi token',
      });
    }
  }

  /**
   * Get 2FA status
   * GET /api/2fa/status
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const status = await twoFactorAuthService.get2FAStatus(userId);

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      logger.error('Get 2FA Status Error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mendapatkan status 2FA',
      });
    }
  }

  /**
   * Regenerate backup codes
   * POST /api/2fa/backup-codes/regenerate
   */
  async regenerateBackupCodes(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Token required',
        });
        return;
      }

      const backupCodes = await twoFactorAuthService.regenerateBackupCodes(userId, token);

      res.json({
        success: true,
        message: 'Backup codes berhasil di-generate ulang',
        data: {
          backupCodes,
        },
      });
    } catch (error: any) {
      logger.error('Regenerate Backup Codes Error:', error);

      if (error.message === 'Invalid token') {
        res.status(400).json({
          success: false,
          message: 'Token tidak valid',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Gagal generate backup codes',
      });
    }
  }

  /**
   * Request 2FA recovery token (via email)
   * POST /api/2fa/recovery/request
   */
  async requestRecovery(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email required',
        });
        return;
      }

      // Get user by email
      const { pool } = require('../config/database');
      const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

      if (result.rows.length === 0) {
        // Don't reveal if user exists
        res.json({
          success: true,
          message: 'Jika email terdaftar, link recovery akan dikirim',
        });
        return;
      }

      const userId = result.rows[0].id;

      // Generate recovery token
      const token = await twoFactorAuthService.createRecoveryToken(userId);

      // Send recovery email
      // TODO: Implement email sending
      const recoveryLink = `${process.env.FRONTEND_URL}/auth/2fa-recovery?token=${token}`;

      logger.info(`2FA recovery requested for user ${userId}`);
      logger.info(`Recovery link: ${recoveryLink}`);

      res.json({
        success: true,
        message: 'Link recovery telah dikirim ke email Anda',
      });
    } catch (error) {
      logger.error('2FA Recovery Request Error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal request recovery',
      });
    }
  }

  /**
   * Verify recovery token and disable 2FA
   * POST /api/2fa/recovery/verify
   */
  async verifyRecovery(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Token required',
        });
        return;
      }

      const verified = await twoFactorAuthService.verifyRecoveryToken(token);

      if (!verified) {
        res.status(400).json({
          success: false,
          message: 'Token tidak valid atau sudah expired',
        });
        return;
      }

      res.json({
        success: true,
        message: '2FA berhasil direset',
      });
    } catch (error) {
      logger.error('2FA Recovery Verify Error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal verify recovery token',
      });
    }
  }
}

export default new TwoFactorAuthController();
