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
  resetPassword
} from '../controllers/auth.controller'
import { authenticateToken } from '../middleware/auth.middleware'
import { authLimiter, passwordResetLimiter } from '../middleware/rate-limit.middleware'

const router = Router()

// Register
router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
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
    body('new_password').isLength({ min: 6 })
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
    body('new_password').isLength({ min: 6 })
  ],
  resetPassword
)

// Logout (Protected)
router.post('/logout', authenticateToken, logout)

// Refresh Access Token (uses refresh token from cookie)
router.post('/refresh', refreshAccessToken)

// Get CSRF Token
router.get('/csrf-token', getCSRFToken)

// Revoke All Sessions (Protected)
router.post('/revoke-all-sessions', authenticateToken, revokeAllSessions)

export default router
