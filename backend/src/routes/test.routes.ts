import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.middleware'

const router = Router()

// Public routes
router.get('/', (req, res) => {
  res.json({ message: 'Get all tests' })
})

router.get('/:id', (req, res) => {
  res.json({ message: `Get test ${req.params.id}` })
})

// Protected routes
router.post('/', authenticateToken, (req, res) => {
  res.json({ message: 'Create test' })
})

router.post('/:id/submit', authenticateToken, (req, res) => {
  res.json({ message: `Submit test ${req.params.id}` })
})

export default router
