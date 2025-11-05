/**
 * Institution Routes
 * Handles all institution management endpoints
 */

import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createInstitution,
  getInstitutions,
  getInstitution,
  updateInstitution,
  deleteInstitution,
  getInstitutionStatistics,
  getInstitutionAnalytics,
  assignAdmin,
  getInstitutionAdmins,
  removeAdmin,
} from '../controllers/institution.controller';
import {
  authenticateToken,
  requireSuperAdmin,
  requireAdmin,
  requireInstitutionAccess,
  requirePermission,
} from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/institutions:
 *   post:
 *     summary: Create a new institution (Superadmin only)
 *     tags: [Institutions]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authenticateToken,
  requireSuperAdmin,
  [
    body('name').trim().notEmpty().withMessage('Institution name is required'),
    body('code')
      .trim()
      .notEmpty()
      .withMessage('Institution code is required')
      .isLength({ min: 3, max: 50 })
      .withMessage('Code must be 3-50 characters'),
    body('contact_email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format'),
    body('max_users')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Max users must be at least 1'),
    body('subscription_type')
      .optional()
      .isIn(['basic', 'premium', 'enterprise'])
      .withMessage('Invalid subscription type'),
  ],
  createInstitution
);

/**
 * @swagger
 * /api/institutions:
 *   get:
 *     summary: Get all institutions (with pagination)
 *     tags: [Institutions]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticateToken, requireAdmin, getInstitutions);

/**
 * @swagger
 * /api/institutions/:institutionId:
 *   get:
 *     summary: Get single institution details
 *     tags: [Institutions]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:institutionId',
  authenticateToken,
  requireAdmin,
  requireInstitutionAccess,
  param('institutionId').isInt().withMessage('Invalid institution ID'),
  getInstitution
);

/**
 * @swagger
 * /api/institutions/:institutionId:
 *   put:
 *     summary: Update institution
 *     tags: [Institutions]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:institutionId',
  authenticateToken,
  requireAdmin,
  requireInstitutionAccess,
  [
    param('institutionId').isInt().withMessage('Invalid institution ID'),
    body('name').optional().trim().notEmpty(),
    body('contact_email').optional().isEmail(),
    body('max_users').optional().isInt({ min: 1 }),
  ],
  updateInstitution
);

/**
 * @swagger
 * /api/institutions/:institutionId:
 *   delete:
 *     summary: Delete institution (soft delete)
 *     tags: [Institutions]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:institutionId',
  authenticateToken,
  requireSuperAdmin,
  param('institutionId').isInt().withMessage('Invalid institution ID'),
  deleteInstitution
);

/**
 * @swagger
 * /api/institutions/:institutionId/statistics:
 *   get:
 *     summary: Get institution statistics
 *     tags: [Institutions]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:institutionId/statistics',
  authenticateToken,
  requireAdmin,
  requireInstitutionAccess,
  param('institutionId').isInt().withMessage('Invalid institution ID'),
  getInstitutionStatistics
);

/**
 * @swagger
 * /api/institutions/:institutionId/analytics:
 *   get:
 *     summary: Get detailed institution analytics
 *     tags: [Institutions]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:institutionId/analytics',
  authenticateToken,
  requireAdmin,
  requireInstitutionAccess,
  param('institutionId').isInt().withMessage('Invalid institution ID'),
  getInstitutionAnalytics
);

/**
 * @swagger
 * /api/institutions/:institutionId/admins:
 *   post:
 *     summary: Assign admin to institution
 *     tags: [Institutions]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:institutionId/admins',
  authenticateToken,
  requireSuperAdmin,
  [
    param('institutionId').isInt().withMessage('Invalid institution ID'),
    body('user_id').isInt().withMessage('User ID is required'),
    body('role')
      .isIn(['institution_admin', 'admin'])
      .withMessage('Invalid role'),
  ],
  assignAdmin
);

/**
 * @swagger
 * /api/institutions/:institutionId/admins:
 *   get:
 *     summary: Get all admins for an institution
 *     tags: [Institutions]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:institutionId/admins',
  authenticateToken,
  requireAdmin,
  requireInstitutionAccess,
  param('institutionId').isInt().withMessage('Invalid institution ID'),
  getInstitutionAdmins
);

/**
 * @swagger
 * /api/institutions/:institutionId/admins/:adminId:
 *   delete:
 *     summary: Remove admin from institution
 *     tags: [Institutions]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:institutionId/admins/:adminId',
  authenticateToken,
  requireSuperAdmin,
  [
    param('institutionId').isInt().withMessage('Invalid institution ID'),
    param('adminId').isInt().withMessage('Invalid admin ID'),
  ],
  removeAdmin
);

export default router;
