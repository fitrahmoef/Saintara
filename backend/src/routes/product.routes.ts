import express from 'express';
import {
  getAllProducts,
  getProductByCode,
  getAllFrameworks,
  getAllAttributes,
  getProductComparison,
} from '../controllers/product.controller';

const router = express.Router();

// Public routes - no authentication needed
router.get('/', getAllProducts);
router.get('/comparison', getProductComparison);
router.get('/frameworks', getAllFrameworks);
router.get('/attributes', getAllAttributes);
router.get('/:code', getProductByCode);

export default router;
