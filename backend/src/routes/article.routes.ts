import express from 'express';
import { body } from 'express-validator';
import {
  getAllArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  getFeaturedArticles,
  getArticlesByCategory
} from '../controllers/article.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = express.Router();

// Public routes
router.get('/', getAllArticles);
router.get('/featured', getFeaturedArticles);
router.get('/category/:category', getArticlesByCategory);
router.get('/:id', getArticleById);

// Admin routes
router.post(
  '/',
  authenticate,
  requireRole(['admin']),
  [
    body('title').notEmpty(),
    body('content').notEmpty(),
    body('category').optional(),
    body('featured_image').optional(),
    body('is_published').optional().isBoolean()
  ],
  createArticle
);

router.put('/:id', authenticate, requireRole(['admin']), updateArticle);
router.delete('/:id', authenticate, requireRole(['admin']), deleteArticle);

export default router;
