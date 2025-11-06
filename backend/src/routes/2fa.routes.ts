import { Router } from 'express';
import twoFactorAuthController from '../controllers/2fa.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { body } from 'express-validator';

const router = Router();

/**
 * 2FA Routes
 */

// Setup 2FA (generate QR code)
router.post(
  '/setup',
  authenticateToken,
  twoFactorAuthController.setup.bind(twoFactorAuthController)
);

// Enable 2FA
router.post(
  '/enable',
  authenticateToken,
  [
    body('token')
      .notEmpty()
      .withMessage('Token required')
      .isLength({ min: 6, max: 6 })
      .withMessage('Token must be 6 digits'),
    validateRequest,
  ],
  twoFactorAuthController.enable.bind(twoFactorAuthController)
);

// Disable 2FA
router.post(
  '/disable',
  authenticateToken,
  [
    body('token')
      .notEmpty()
      .withMessage('Token required')
      .isLength({ min: 6, max: 6 })
      .withMessage('Token must be 6 digits'),
    validateRequest,
  ],
  twoFactorAuthController.disable.bind(twoFactorAuthController)
);

// Verify 2FA token (during login)
router.post(
  '/verify',
  [
    body('userId').notEmpty().withMessage('User ID required'),
    body('token').notEmpty().withMessage('Token required'),
    validateRequest,
  ],
  twoFactorAuthController.verify.bind(twoFactorAuthController)
);

// Get 2FA status
router.get(
  '/status',
  authenticateToken,
  twoFactorAuthController.getStatus.bind(twoFactorAuthController)
);

// Regenerate backup codes
router.post(
  '/backup-codes/regenerate',
  authenticateToken,
  [
    body('token')
      .notEmpty()
      .withMessage('Token required')
      .isLength({ min: 6, max: 6 })
      .withMessage('Token must be 6 digits'),
    validateRequest,
  ],
  twoFactorAuthController.regenerateBackupCodes.bind(twoFactorAuthController)
);

// Request 2FA recovery
router.post(
  '/recovery/request',
  [body('email').isEmail().withMessage('Valid email required'), validateRequest],
  twoFactorAuthController.requestRecovery.bind(twoFactorAuthController)
);

// Verify recovery token
router.post(
  '/recovery/verify',
  [body('token').notEmpty().withMessage('Token required'), validateRequest],
  twoFactorAuthController.verifyRecovery.bind(twoFactorAuthController)
);

export default router;
