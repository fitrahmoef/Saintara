import { Router } from 'express'
import { body } from 'express-validator'
import { register, login, getProfile } from '../controllers/auth.controller'
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

export default router
