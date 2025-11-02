import express from 'express';
import { body } from 'express-validator';
import {
  getAllAgents,
  createAgent,
  getAgentById,
  updateAgentStatus,
  getAgentStats,
  recordAgentSale,
  payAgentCommission
} from '../controllers/agent.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = express.Router();

// Admin routes
router.get('/', authenticate, requireRole(['admin']), getAllAgents);

router.post(
  '/',
  authenticate,
  requireRole(['admin']),
  [
    body('user_id').isInt(),
    body('commission_rate').optional().isFloat()
  ],
  createAgent
);

router.get('/:id', authenticate, requireRole(['admin']), getAgentById);
router.get('/:id/stats', authenticate, requireRole(['admin']), getAgentStats);

router.put(
  '/:id/status',
  authenticate,
  requireRole(['admin']),
  updateAgentStatus
);

router.post(
  '/sales',
  authenticate,
  requireRole(['admin']),
  [
    body('agent_code').notEmpty(),
    body('transaction_id').isInt()
  ],
  recordAgentSale
);

router.put(
  '/sales/:id/pay',
  authenticate,
  requireRole(['admin']),
  payAgentCommission
);

export default router;
