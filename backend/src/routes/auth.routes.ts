import { Router } from 'express'
import { body } from 'express-validator'
import {
  register,
  login,
  logout,
  refreshAccessToken,
  getCSRFToken,
  revokeAllSessions,
  getProfile,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  resendVerification
} from '../controllers/auth.controller'
import {
  exportUserData,
  requestAccountDeletion,
  deleteAccount
} from '../controllers/gdpr.controller'
import { authenticateToken } from '../middleware/auth.middleware'
import { authLimiter, passwordResetLimiter, refreshTokenLimiter } from '../middleware/rate-limit.middleware'

const router = Router()

// Register
router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password')
      .isLength({ min: 12 })
      .withMessage('Password must be at least 12 characters long')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number')
      .matches(/[@$!%*?&#]/)
      .withMessage('Password must contain at least one special character (@$!%*?&#)'),
    body('name').notEmpty().trim(),
  ],
  register
)

// Login
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  login
)

// Get Profile (Protected)
router.get('/profile', authenticateToken, getProfile)

// Update Profile (Protected)
router.put('/profile', authenticateToken, updateProfile)

// Change Password (Protected)
router.put(
  '/change-password',
  authenticateToken,
  [
    body('current_password').notEmpty(),
    body('new_password')
      .isLength({ min: 12 })
      .withMessage('Password must be at least 12 characters long')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number')
      .matches(/[@$!%*?&#]/)
      .withMessage('Password must contain at least one special character (@$!%*?&#)')
  ],
  changePassword
)

// Request Password Reset
router.post(
  '/forgot-password',
  passwordResetLimiter,
  [body('email').isEmail().normalizeEmail()],
  requestPasswordReset
)

// Reset Password
router.post(
  '/reset-password',
  passwordResetLimiter,
  [
    body('token').notEmpty(),
    body('new_password')
      .isLength({ min: 12 })
      .withMessage('Password must be at least 12 characters long')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number')
      .matches(/[@$!%*?&#]/)
      .withMessage('Password must contain at least one special character (@$!%*?&#)')
  ],
  resetPassword
)

// Logout (Protected)
router.post('/logout', authenticateToken, logout)

// Refresh Access Token (uses refresh token from cookie)
// SECURITY: Rate limited to prevent token refresh abuse
router.post('/refresh', refreshTokenLimiter, refreshAccessToken)

// Get CSRF Token
router.get('/csrf-token', getCSRFToken)

// Revoke All Sessions (Protected)
router.post('/revoke-all-sessions', authenticateToken, revokeAllSessions)

// Verify Email
router.post(
  '/verify-email',
  [body('token').notEmpty()],
  verifyEmail
)

// Resend Verification Email (Protected)
router.post('/resend-verification', authenticateToken, resendVerification)

// ========== GDPR Compliance Endpoints ==========

// GDPR Article 15: Right to Access - Export user data
router.get('/export-data', authenticateToken, exportUserData)

// GDPR Article 17: Right to Erasure - Request account deletion
router.post('/request-deletion', authenticateToken, requestAccountDeletion)

// GDPR Article 17: Right to Erasure - Execute account deletion (requires confirmation)
router.delete('/delete-account', authenticateToken, deleteAccount)

export default router
