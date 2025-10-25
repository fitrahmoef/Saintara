import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.middleware'

const router = Router()

// All result routes require authentication
router.use(authenticateToken)

router.get('/', (req, res) => {
  res.json({ message: 'Get all user results' })
})

router.get('/:id', (req, res) => {
  res.json({ message: `Get result ${req.params.id}` })
})

router.get('/:id/pdf', (req, res) => {
  res.json({ message: `Download result ${req.params.id} as PDF` })
})

export default router
