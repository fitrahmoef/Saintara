/**
 * Two-Factor Authentication Controller
 * Handles TOTP setup, verification, and management
 */

import { Request, Response } from 'express';
import { totpService } from '../services/totp.service';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Setup 2FA - Generate secret and QR code
 */
export const setup2FA = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userEmail = (req as any).user.email;

    // Check if 2FA is already enabled
    const status = await totpService.getTwoFactorStatus(userId);
    if (status.enabled) {
      return res.status(400).json({
        error: '2FA is already enabled. Disable it first to re-setup.',
      });
    }

    // Generate new secret
    const secret = totpService.generateSecret();

    // Generate QR code
    const qrCode = await totpService.generateQRCode(userEmail, secret);

    // Store secret temporarily (not enabled yet, needs verification)
    await pool.query(
      'UPDATE users SET two_factor_secret = $1 WHERE id = $2',
      [secret, userId]
    );

    logger.info(`2FA setup initiated for user ${userId}`);

    res.status(200).json({
      success: true,
      secret,
      qrCode,
      message: 'Scan the QR code with your authenticator app and verify with a code to enable 2FA',
    });
  } catch (error) {
    logger.error('Error setting up 2FA:', error);
    res.status(500).json({
      error: 'Failed to setup 2FA',
    });
  }
};

/**
 * Verify and enable 2FA
 */
export const verify2FA = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'TOTP token is required',
      });
    }

    // Get user's secret
    const secret = await totpService.getUserSecret(userId);

    if (!secret) {
      return res.status(400).json({
        error: 'No 2FA setup found. Please setup 2FA first.',
      });
    }

    // Verify token
    const isValid = totpService.verifyToken(token, secret);

    if (!isValid) {
      await totpService.logAuditEvent(
        userId,
        'verification_failed',
        false,
        req.ip,
        req.get('user-agent')
      );

      return res.status(400).json({
        error: 'Invalid verification code. Please try again.',
      });
    }

    // Enable 2FA
    await totpService.enableTwoFactor(userId, secret);

    // Generate backup codes
    const backupCodes = totpService.generateBackupCodes(10);
    await totpService.saveBackupCodes(userId, backupCodes);

    // Log audit event
    await totpService.logAuditEvent(
      userId,
      'enabled',
      true,
      req.ip,
      req.get('user-agent')
    );

    logger.info(`2FA enabled for user ${userId}`);

    res.status(200).json({
      success: true,
      message: '2FA has been successfully enabled',
      backupCodes,
      warning: 'Save these backup codes in a safe place. You won\'t be able to see them again.',
    });
  } catch (error) {
    logger.error('Error verifying 2FA:', error);
    res.status(500).json({
      error: 'Failed to verify 2FA',
    });
  }
};

/**
 * Verify 2FA token during login
 */
export const verify2FALogin = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { token, useBackupCode } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Verification code is required',
      });
    }

    const secret = await totpService.getUserSecret(userId);

    if (!secret) {
      return res.status(400).json({
        error: '2FA is not enabled for this account',
      });
    }

    let isValid = false;

    if (useBackupCode) {
      // Use backup code
      isValid = await totpService.useBackupCode(userId, token);

      if (isValid) {
        await totpService.logAuditEvent(
          userId,
          'backup_code_used',
          true,
          req.ip,
          req.get('user-agent')
        );

        const remaining = await totpService.getRemainingBackupCodesCount(userId);

        return res.status(200).json({
          success: true,
          message: 'Backup code accepted',
          backupCodesRemaining: remaining,
          warning: remaining < 3 ? 'You are running low on backup codes. Consider generating new ones.' : undefined,
        });
      }
    } else {
      // Use TOTP token
      isValid = totpService.verifyToken(token, secret);

      if (isValid) {
        await totpService.logAuditEvent(
          userId,
          'verified',
          true,
          req.ip,
          req.get('user-agent')
        );

        return res.status(200).json({
          success: true,
          message: '2FA verification successful',
        });
      }
    }

    // Invalid code
    await totpService.logAuditEvent(
      userId,
      'failed_attempt',
      false,
      req.ip,
      req.get('user-agent')
    );

    res.status(400).json({
      error: 'Invalid verification code',
    });
  } catch (error) {
    logger.error('Error verifying 2FA login:', error);
    res.status(500).json({
      error: 'Failed to verify 2FA',
    });
  }
};

/**
 * Disable 2FA
 */
export const disable2FA = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { password, token } = req.body;

    if (!password) {
      return res.status(400).json({
        error: 'Password is required to disable 2FA',
      });
    }

    if (!token) {
      return res.status(400).json({
        error: 'Current 2FA code is required',
      });
    }

    // Verify password
    const userResult = await pool.query(
      'SELECT password_hash, two_factor_secret FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    const user = userResult.rows[0];

    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid password',
      });
    }

    // Verify 2FA token
    const isTokenValid = totpService.verifyToken(token, user.two_factor_secret);

    if (!isTokenValid) {
      return res.status(400).json({
        error: 'Invalid 2FA code',
      });
    }

    // Disable 2FA
    await totpService.disableTwoFactor(userId);

    // Log audit event
    await totpService.logAuditEvent(
      userId,
      'disabled',
      true,
      req.ip,
      req.get('user-agent')
    );

    logger.info(`2FA disabled for user ${userId}`);

    res.status(200).json({
      success: true,
      message: '2FA has been disabled',
    });
  } catch (error) {
    logger.error('Error disabling 2FA:', error);
    res.status(500).json({
      error: 'Failed to disable 2FA',
    });
  }
};

/**
 * Get 2FA status
 */
export const get2FAStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const status = await totpService.getTwoFactorStatus(userId);

    res.status(200).json({
      success: true,
      ...status,
    });
  } catch (error) {
    logger.error('Error getting 2FA status:', error);
    res.status(500).json({
      error: 'Failed to get 2FA status',
    });
  }
};

/**
 * Regenerate backup codes
 */
export const regenerateBackupCodes = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: 'Password is required',
      });
    }

    // Verify password
    const userResult = await pool.query(
      'SELECT password_hash, two_factor_enabled FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    const user = userResult.rows[0];

    if (!user.two_factor_enabled) {
      return res.status(400).json({
        error: '2FA is not enabled',
      });
    }

    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid password',
      });
    }

    // Generate new backup codes
    const backupCodes = totpService.generateBackupCodes(10);
    await totpService.saveBackupCodes(userId, backupCodes);

    logger.info(`Backup codes regenerated for user ${userId}`);

    res.status(200).json({
      success: true,
      backupCodes,
      message: 'New backup codes generated successfully',
      warning: 'Old backup codes are no longer valid. Save these new codes in a safe place.',
    });
  } catch (error) {
    logger.error('Error regenerating backup codes:', error);
    res.status(500).json({
      error: 'Failed to regenerate backup codes',
    });
  }
};

/**
 * Get 2FA audit log
 */
export const get2FAAuditLog = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const limit = parseInt(req.query.limit as string) || 50;

    const auditLog = await totpService.getAuditLog(userId, limit);

    res.status(200).json({
      success: true,
      auditLog,
    });
  } catch (error) {
    logger.error('Error getting 2FA audit log:', error);
    res.status(500).json({
      error: 'Failed to get audit log',
    });
  }
};
