import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.middleware'
import { getTestQuestions, createTest, submitTest, getUserTests } from '../controllers/test.controller'

const router = Router()

// Public routes
router.get('/questions', getTestQuestions)

// Protected routes
router.use(authenticateToken)

router.get('/my-tests', getUserTests)
router.post('/', createTest)
router.post('/:id/submit', submitTest)

export default router
