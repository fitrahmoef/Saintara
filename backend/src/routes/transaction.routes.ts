import express from 'express';
import { body } from 'express-validator';
import {
  createTransaction,
  getUserTransactions,
  getTransactionById,
  uploadPaymentProof,
  getAllTransactions,
  updateTransactionStatus,
  getTransactionStats
} from '../controllers/transaction.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = express.Router();

// User routes (protected)
router.post(
  '/',
  authenticate,
  [
    body('package_type').isIn(['personal', 'couple', 'team']),
    body('amount').isNumeric(),
    body('payment_method').notEmpty()
  ],
  createTransaction
);

router.get('/', authenticate, getUserTransactions);
router.get('/stats', authenticate, requireRole(['admin']), getTransactionStats);
router.get('/:id', authenticate, getTransactionById);

router.put(
  '/:id/payment-proof',
  authenticate,
  [body('payment_proof_url').notEmpty()],
  uploadPaymentProof
);

// Admin routes
router.get('/admin/all', authenticate, requireRole(['admin']), getAllTransactions);
router.put('/:id/status', authenticate, requireRole(['admin']), updateTransactionStatus);

export default router;
