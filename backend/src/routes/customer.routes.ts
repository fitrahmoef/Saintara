/**
 * Customer Management Routes
 * Handles customer management for institution admins including bulk upload
 */

import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  downloadTemplate,
  bulkImportCustomers,
  getImportHistory,
} from '../controllers/customer.controller';
import {
  authenticateToken,
  requireAdmin,
  requirePermission,
} from '../middleware/auth.middleware';
import { upload } from '../config/multer.config';
import { uploadLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get all customers for institution (with pagination and filters)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  authenticateToken,
  requireAdmin,
  requirePermission('customer.read', 'institution'),
  getCustomers
);

/**
 * @swagger
 * /api/customers/:customerId:
 *   get:
 *     summary: Get single customer details
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:customerId',
  authenticateToken,
  requireAdmin,
  requirePermission('customer.read', 'institution'),
  param('customerId').isInt().withMessage('Invalid customer ID'),
  getCustomer
);

/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  requirePermission('customer.create', 'institution'),
  [
    body('email')
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('phone').optional().trim(),
    body('gender').optional().isIn(['male', 'female']),
    body('blood_type')
      .optional()
      .isIn(['A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  ],
  createCustomer
);

/**
 * @swagger
 * /api/customers/:customerId:
 *   put:
 *     summary: Update customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:customerId',
  authenticateToken,
  requireAdmin,
  requirePermission('customer.update', 'institution'),
  [
    param('customerId').isInt().withMessage('Invalid customer ID'),
    body('name').optional().trim().notEmpty(),
    body('phone').optional().trim(),
    body('gender').optional().isIn(['male', 'female']),
  ],
  updateCustomer
);

/**
 * @swagger
 * /api/customers/:customerId:
 *   delete:
 *     summary: Delete customer (soft delete - deactivate)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:customerId',
  authenticateToken,
  requireAdmin,
  requirePermission('customer.delete', 'institution'),
  param('customerId').isInt().withMessage('Invalid customer ID'),
  deleteCustomer
);

/**
 * @swagger
 * /api/customers/bulk/template:
 *   get:
 *     summary: Download customer import template (Excel)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/bulk/template',
  authenticateToken,
  requireAdmin,
  downloadTemplate
);

/**
 * @swagger
 * /api/customers/bulk/import:
 *   post:
 *     summary: Bulk import customers from Excel/CSV file
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/bulk/import',
  authenticateToken,
  requireAdmin,
  requirePermission('customer.import', 'institution'),
  uploadLimiter,
  upload.single('file'),
  bulkImportCustomers
);

/**
 * @swagger
 * /api/customers/bulk/history:
 *   get:
 *     summary: Get bulk import history
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/bulk/history',
  authenticateToken,
  requireAdmin,
  requirePermission('customer.read', 'institution'),
  getImportHistory
);

export default router;
