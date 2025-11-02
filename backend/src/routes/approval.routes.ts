import express from 'express';
import { body } from 'express-validator';
import {
  getAllApprovals,
  getApprovalById,
  createApproval,
  updateApprovalStatus,
  getPendingApprovalsCount,
  getUserApprovals,
  deleteApproval
} from '../controllers/approval.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = express.Router();

// User routes
router.get('/my-approvals', authenticate, getUserApprovals);

router.post(
  '/',
  authenticate,
  [
    body('type').isIn(['agent_commission', 'partnership', 'event_invite']),
    body('reference_id').optional().isInt(),
    body('notes').optional()
  ],
  createApproval
);

// Admin routes
router.get('/', authenticate, requireRole(['admin']), getAllApprovals);
router.get('/pending-count', authenticate, requireRole(['admin']), getPendingApprovalsCount);
router.get('/:id', authenticate, requireRole(['admin']), getApprovalById);

router.put(
  '/:id/status',
  authenticate,
  requireRole(['admin']),
  [
    body('status').isIn(['approved', 'rejected']),
    body('notes').optional()
  ],
  updateApprovalStatus
);

router.delete('/:id', authenticate, deleteApproval);

export default router;
