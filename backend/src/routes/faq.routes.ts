import express from 'express';
import { body } from 'express-validator';
import {
  getAllFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  getFAQCategories,
} from '../controllers/faq.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = express.Router();

// Public routes
router.get('/', getAllFAQs);
router.get('/categories', getFAQCategories);
router.get('/:id', getFAQById);

// Admin routes
router.post(
  '/',
  authenticate,
  requireRole(['admin', 'superadmin']),
  [
    body('category').notEmpty().withMessage('Category is required'),
    body('question').notEmpty().withMessage('Question is required'),
    body('answer').notEmpty().withMessage('Answer is required'),
    body('product_type_code').optional(),
    body('sort_order').optional().isInt(),
  ],
  createFAQ
);

router.put(
  '/:id',
  authenticate,
  requireRole(['admin', 'superadmin']),
  updateFAQ
);

router.delete(
  '/:id',
  authenticate,
  requireRole(['admin', 'superadmin']),
  deleteFAQ
);

export default router;
