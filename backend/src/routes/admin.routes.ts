import { Router } from 'express'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware'

const router = Router()

// All admin routes require authentication and admin role
router.use(authenticateToken)
router.use(authorizeRole('admin'))

router.get('/dashboard', (req, res) => {
  res.json({ message: 'Admin dashboard data' })
})

router.get('/users', (req, res) => {
  res.json({ message: 'Get all users' })
})

router.get('/stats', (req, res) => {
  res.json({ message: 'Get statistics' })
})

export default router
