import express from 'express';
import { body } from 'express-validator';
import {
  getUserVouchers,
  useVoucher,
  createVoucher,
  getAllVouchers,
  deleteVoucher
} from '../controllers/voucher.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = express.Router();

// User routes (protected)
router.get('/', authenticate, getUserVouchers);
router.post(
  '/use',
  authenticate,
  [body('code').notEmpty()],
  useVoucher
);

// Admin routes
router.post(
  '/create',
  authenticate,
  requireRole(['admin']),
  [
    body('user_id').isInt(),
    body('package_type').isIn(['personal', 'couple', 'team']),
    body('expires_at').isISO8601()
  ],
  createVoucher
);

router.get('/admin/all', authenticate, requireRole(['admin']), getAllVouchers);
router.delete('/:id', authenticate, requireRole(['admin']), deleteVoucher);

export default router;
