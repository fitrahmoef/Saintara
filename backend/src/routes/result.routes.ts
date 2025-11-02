import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.middleware'
import { getUserResults, getResultById, getLatestResult, downloadResultPDF } from '../controllers/result.controller'

const router = Router()

// All result routes require authentication
router.use(authenticateToken)

router.get('/', getUserResults)
router.get('/latest', getLatestResult)
router.get('/:id/pdf', downloadResultPDF)
router.get('/:id', getResultById)

export default router
