/**
 * Two-Factor Authentication Routes
 */

import express from 'express';
import {
  setup2FA,
  verify2FA,
  verify2FALogin,
  disable2FA,
  get2FAStatus,
  regenerateBackupCodes,
  get2FAAuditLog,
} from '../controllers/2fa.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @route   GET /api/2fa/status
 * @desc    Get current 2FA status
 * @access  Private
 */
router.get('/status', requireAuth, get2FAStatus);

/**
 * @route   POST /api/2fa/setup
 * @desc    Setup 2FA (generate secret and QR code)
 * @access  Private
 */
router.post('/setup', requireAuth, setup2FA);

/**
 * @route   POST /api/2fa/verify
 * @desc    Verify and enable 2FA
 * @access  Private
 */
router.post('/verify', requireAuth, verify2FA);

/**
 * @route   POST /api/2fa/verify-login
 * @desc    Verify 2FA during login
 * @access  Private (partial - after initial auth)
 */
router.post('/verify-login', requireAuth, verify2FALogin);

/**
 * @route   POST /api/2fa/disable
 * @desc    Disable 2FA
 * @access  Private
 */
router.post('/disable', requireAuth, disable2FA);

/**
 * @route   POST /api/2fa/backup-codes/regenerate
 * @desc    Regenerate backup codes
 * @access  Private
 */
router.post('/backup-codes/regenerate', requireAuth, regenerateBackupCodes);

/**
 * @route   GET /api/2fa/audit-log
 * @desc    Get 2FA audit log
 * @access  Private
 */
router.get('/audit-log', requireAuth, get2FAAuditLog);

export default router;
