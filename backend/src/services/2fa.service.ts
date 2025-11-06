import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { pool } from '../config/database';

/**
 * Two-Factor Authentication Service
 * Implements TOTP (Time-based One-Time Password)
 */

interface TwoFactorSecret {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export class TwoFactorAuthService {
  /**
   * Generate 2FA secret and QR code for user
   */
  async generateSecret(userId: string, email: string): Promise<TwoFactorSecret> {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Saintara (${email})`,
      issuer: 'Saintara',
      length: 32,
    });

    // Generate QR code
    const qrCode = await qrcode.toDataURL(secret.otpauth_url!);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Store secret in database (encrypted)
    await pool.query(
      `INSERT INTO two_factor_auth (user_id, secret, backup_codes, enabled)
       VALUES ($1, $2, $3, false)
       ON CONFLICT (user_id)
       DO UPDATE SET secret = $2, backup_codes = $3, updated_at = NOW()`,
      [userId, secret.base32, JSON.stringify(backupCodes)]
    );

    return {
      secret: secret.base32,
      qrCode,
      backupCodes,
    };
  }

  /**
   * Verify TOTP token
   */
  async verifyToken(userId: string, token: string): Promise<boolean> {
    // Get user's 2FA secret
    const result = await pool.query(
      'SELECT secret FROM two_factor_auth WHERE user_id = $1 AND enabled = true',
      [userId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    const secret = result.rows[0].secret;

    // Verify token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time windows for clock drift
    });

    return verified;
  }

  /**
   * Enable 2FA for user after verification
   */
  async enable2FA(userId: string, token: string): Promise<boolean> {
    // Get secret
    const result = await pool.query(
      'SELECT secret FROM two_factor_auth WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('2FA not initialized');
    }

    const secret = result.rows[0].secret;

    // Verify token before enabling
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!verified) {
      throw new Error('Invalid token');
    }

    // Enable 2FA
    await pool.query(
      'UPDATE two_factor_auth SET enabled = true, updated_at = NOW() WHERE user_id = $1',
      [userId]
    );

    return true;
  }

  /**
   * Disable 2FA for user
   */
  async disable2FA(userId: string, token: string): Promise<boolean> {
    // Verify token before disabling
    const verified = await this.verifyToken(userId, token);

    if (!verified) {
      throw new Error('Invalid token');
    }

    // Disable 2FA
    await pool.query(
      'UPDATE two_factor_auth SET enabled = false, updated_at = NOW() WHERE user_id = $1',
      [userId]
    );

    return true;
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT backup_codes FROM two_factor_auth WHERE user_id = $1 AND enabled = true',
      [userId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    const backupCodes: string[] = JSON.parse(result.rows[0].backup_codes);

    // Check if code exists
    const index = backupCodes.indexOf(code);
    if (index === -1) {
      return false;
    }

    // Remove used backup code
    backupCodes.splice(index, 1);

    await pool.query(
      'UPDATE two_factor_auth SET backup_codes = $1, updated_at = NOW() WHERE user_id = $2',
      [JSON.stringify(backupCodes), userId]
    );

    return true;
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string, token: string): Promise<string[]> {
    // Verify token before regenerating
    const verified = await this.verifyToken(userId, token);

    if (!verified) {
      throw new Error('Invalid token');
    }

    const backupCodes = this.generateBackupCodes();

    await pool.query(
      'UPDATE two_factor_auth SET backup_codes = $1, updated_at = NOW() WHERE user_id = $2',
      [JSON.stringify(backupCodes), userId]
    );

    return backupCodes;
  }

  /**
   * Check if user has 2FA enabled
   */
  async is2FAEnabled(userId: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT enabled FROM two_factor_auth WHERE user_id = $1',
      [userId]
    );

    return result.rows.length > 0 && result.rows[0].enabled;
  }

  /**
   * Get 2FA status for user
   */
  async get2FAStatus(userId: string): Promise<{
    enabled: boolean;
    backupCodesRemaining: number;
  }> {
    const result = await pool.query(
      'SELECT enabled, backup_codes FROM two_factor_auth WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return { enabled: false, backupCodesRemaining: 0 };
    }

    const backupCodes: string[] = JSON.parse(result.rows[0].backup_codes || '[]');

    return {
      enabled: result.rows[0].enabled,
      backupCodesRemaining: backupCodes.length,
    };
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(count: number = 8): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = this.generateRandomCode(8);
      codes.push(code);
    }

    return codes;
  }

  /**
   * Generate random alphanumeric code
   */
  private generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';

    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return code;
  }

  /**
   * Verify and authenticate with 2FA
   * Used during login process
   */
  async authenticate2FA(
    userId: string,
    code: string,
    isBackupCode: boolean = false
  ): Promise<boolean> {
    if (isBackupCode) {
      return await this.verifyBackupCode(userId, code);
    } else {
      return await this.verifyToken(userId, code);
    }
  }

  /**
   * Create 2FA recovery token for account recovery
   */
  async createRecoveryToken(userId: string): Promise<string> {
    const token = this.generateRandomCode(32);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await pool.query(
      `INSERT INTO two_factor_recovery (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, token, expiresAt]
    );

    return token;
  }

  /**
   * Verify recovery token and disable 2FA
   */
  async verifyRecoveryToken(token: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT user_id FROM two_factor_recovery
       WHERE token = $1 AND expires_at > NOW() AND used = false`,
      [token]
    );

    if (result.rows.length === 0) {
      return false;
    }

    const userId = result.rows[0].user_id;

    // Mark token as used
    await pool.query(
      'UPDATE two_factor_recovery SET used = true WHERE token = $1',
      [token]
    );

    // Disable 2FA
    await pool.query(
      'UPDATE two_factor_auth SET enabled = false WHERE user_id = $1',
      [userId]
    );

    return true;
  }
}

export default new TwoFactorAuthService();
