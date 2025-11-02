import { Router } from 'express'
import { body } from 'express-validator'
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword
} from '../controllers/auth.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router = Router()

// Register
router.post(
  '/register',
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
  [body('email').isEmail().normalizeEmail()],
  requestPasswordReset
)

// Reset Password
router.post(
  '/reset-password',
  [
    body('token').notEmpty(),
    body('new_password').isLength({ min: 6 })
  ],
  resetPassword
)

export default router
