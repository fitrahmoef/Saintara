import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.middleware'

const router = Router()

// All user routes require authentication
router.use(authenticateToken)

// User routes will be implemented here
router.get('/tests', (req, res) => {
  res.json({ message: 'Get user tests' })
})

router.get('/results', (req, res) => {
  res.json({ message: 'Get user results' })
})

export default router
