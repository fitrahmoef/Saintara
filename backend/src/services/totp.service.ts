/**
 * TOTP (Time-based One-Time Password) Service
 * Implements Two-Factor Authentication using TOTP algorithm
 */

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

// Configure TOTP
authenticator.options = {
  window: 1, // Allow 1 step before and after current time
  step: 30, // 30 seconds time step
};

export class TOTPService {
  private readonly APP_NAME = 'Saintara';

  /**
   * Generate a new TOTP secret
   */
  generateSecret(): string {
    return authenticator.generateSecret();
  }

  /**
   * Generate QR code for TOTP setup
   */
  async generateQRCode(email: string, secret: string): Promise<string> {
    const otpauthUrl = authenticator.keyuri(email, this.APP_NAME, secret);

    try {
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
      return qrCodeDataUrl;
    } catch (error) {
      logger.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Verify TOTP token
   */
  verifyToken(token: string, secret: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch (error) {
      logger.error('Error verifying TOTP token:', error);
      return false;
    }
  }

  /**
   * Generate backup codes for account recovery
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }

    return codes;
  }

  /**
   * Hash backup code for storage
   */
  async hashBackupCode(code: string): Promise<string> {
    return bcrypt.hash(code, 10);
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(code: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(code, hash);
    } catch (error) {
      logger.error('Error verifying backup code:', error);
      return false;
    }
  }

  /**
   * Save backup codes to database
   */
  async saveBackupCodes(userId: number, codes: string[]): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Delete existing backup codes
      await client.query('DELETE FROM user_backup_codes WHERE user_id = $1', [userId]);

      // Insert new backup codes
      for (const code of codes) {
        const codeHash = await this.hashBackupCode(code);
        await client.query(
          'INSERT INTO user_backup_codes (user_id, code_hash) VALUES ($1, $2)',
          [userId, codeHash]
        );
      }

      await client.query('COMMIT');
      logger.info(`Saved ${codes.length} backup codes for user ${userId}`);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error saving backup codes:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Use a backup code (mark as used)
   */
  async useBackupCode(userId: number, code: string): Promise<boolean> {
    const client = await pool.connect();

    try {
      // Get all unused backup codes for user
      const result = await client.query(
        'SELECT id, code_hash FROM user_backup_codes WHERE user_id = $1 AND used = FALSE',
        [userId]
      );

      if (result.rows.length === 0) {
        return false;
      }

      // Check each code
      for (const row of result.rows) {
        const isValid = await this.verifyBackupCode(code, row.code_hash);

        if (isValid) {
          // Mark code as used
          await client.query(
            'UPDATE user_backup_codes SET used = TRUE, used_at = CURRENT_TIMESTAMP WHERE id = $1',
            [row.id]
          );

          logger.info(`Backup code used for user ${userId}`);
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.error('Error using backup code:', error);
      return false;
    } finally {
      client.release();
    }
  }

  /**
   * Get remaining backup codes count
   */
  async getRemainingBackupCodesCount(userId: number): Promise<number> {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) FROM user_backup_codes WHERE user_id = $1 AND used = FALSE',
        [userId]
      );

      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error getting backup codes count:', error);
      return 0;
    }
  }

  /**
   * Log 2FA audit event
   */
  async logAuditEvent(
    userId: number,
    action: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO two_factor_audit_log (user_id, action, success, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, action, success, ipAddress || null, userAgent || null]
      );
    } catch (error) {
      logger.error('Error logging 2FA audit event:', error);
      // Don't throw error for audit logging
    }
  }

  /**
   * Get 2FA audit log for user
   */
  async getAuditLog(userId: number, limit: number = 50): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT id, action, success, ip_address, user_agent, created_at
         FROM two_factor_audit_log
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error getting 2FA audit log:', error);
      return [];
    }
  }

  /**
   * Enable 2FA for user
   */
  async enableTwoFactor(userId: number, secret: string): Promise<void> {
    try {
      await pool.query(
        `UPDATE users
         SET two_factor_enabled = TRUE,
             two_factor_secret = $1,
             two_factor_verified_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [secret, userId]
      );

      logger.info(`2FA enabled for user ${userId}`);
    } catch (error) {
      logger.error('Error enabling 2FA:', error);
      throw error;
    }
  }

  /**
   * Disable 2FA for user
   */
  async disableTwoFactor(userId: number): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Disable 2FA
      await client.query(
        `UPDATE users
         SET two_factor_enabled = FALSE,
             two_factor_secret = NULL,
             two_factor_verified_at = NULL
         WHERE id = $1`,
        [userId]
      );

      // Delete backup codes
      await client.query('DELETE FROM user_backup_codes WHERE user_id = $1', [userId]);

      await client.query('COMMIT');
      logger.info(`2FA disabled for user ${userId}`);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error disabling 2FA:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get user's 2FA status
   */
  async getTwoFactorStatus(userId: number): Promise<{
    enabled: boolean;
    verifiedAt: Date | null;
    backupCodesRemaining: number;
  }> {
    try {
      const result = await pool.query(
        'SELECT two_factor_enabled, two_factor_verified_at FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];
      const backupCodesRemaining = await this.getRemainingBackupCodesCount(userId);

      return {
        enabled: user.two_factor_enabled || false,
        verifiedAt: user.two_factor_verified_at,
        backupCodesRemaining,
      };
    } catch (error) {
      logger.error('Error getting 2FA status:', error);
      throw error;
    }
  }

  /**
   * Get user's TOTP secret
   */
  async getUserSecret(userId: number): Promise<string | null> {
    try {
      const result = await pool.query(
        'SELECT two_factor_secret FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0].two_factor_secret;
    } catch (error) {
      logger.error('Error getting user secret:', error);
      return null;
    }
  }
}

// Export singleton instance
export const totpService = new TOTPService();
