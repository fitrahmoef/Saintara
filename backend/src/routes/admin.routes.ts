import { Router } from 'express'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware'
import { getDashboardStats, getAllUsers, getUserDetails } from '../controllers/admin.controller'

const router = Router()

// All admin routes require authentication and admin role
router.use(authenticateToken)
router.use(authorizeRole('admin'))

router.get('/dashboard', getDashboardStats)
router.get('/users', getAllUsers)
router.get('/users/:id', getUserDetails)

export default router
