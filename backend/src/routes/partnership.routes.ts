import express from 'express';
import { body } from 'express-validator';
import {
  getPartnershipContent,
  getPartnershipBySection,
  createPartnershipContent,
  updatePartnershipContent,
  deletePartnershipContent,
  getAgentStatistics,
  submitPartnershipApplication,
} from '../controllers/partnership.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = express.Router();

// Public routes
router.get('/content', getPartnershipContent);
router.get('/content/:section', getPartnershipBySection);
router.get('/statistics', getAgentStatistics);

// Partnership application submission
router.post(
  '/apply',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').notEmpty().withMessage('Phone is required'),
    body('message').notEmpty().withMessage('Message is required'),
  ],
  submitPartnershipApplication
);

// Admin routes for content management
router.post(
  '/content',
  authenticate,
  requireRole(['admin', 'superadmin']),
  [
    body('section').notEmpty().withMessage('Section is required'),
    body('title').optional(),
    body('content').optional(),
    body('image_url').optional(),
    body('sort_order').optional().isInt(),
  ],
  createPartnershipContent
);

router.put(
  '/content/:id',
  authenticate,
  requireRole(['admin', 'superadmin']),
  updatePartnershipContent
);

router.delete(
  '/content/:id',
  authenticate,
  requireRole(['admin', 'superadmin']),
  deletePartnershipContent
);

export default router;
