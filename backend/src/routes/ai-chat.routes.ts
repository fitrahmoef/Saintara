import { Router } from 'express';
import { body } from 'express-validator';
import {
  createOrGetSession,
  sendMessage,
  getChatHistory,
  getUserSessions,
  deleteSession,
} from '../controllers/ai-chat.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All AI chat routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/ai-chat/session:
 *   post:
 *     summary: Create or get active chat session
 *     tags: [AI Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active session retrieved
 *       201:
 *         description: New session created
 */
router.post('/session', createOrGetSession);

/**
 * @swagger
 * /api/ai-chat/message:
 *   post:
 *     summary: Send a message and get AI response
 *     tags: [AI Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               session_id:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent and response received
 */
router.post(
  '/message',
  [
    body('session_id').notEmpty().withMessage('Session ID is required'),
    body('message')
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ max: 2000 })
      .withMessage('Message must not exceed 2000 characters'),
  ],
  sendMessage
);

/**
 * @swagger
 * /api/ai-chat/sessions:
 *   get:
 *     summary: Get all chat sessions for current user
 *     tags: [AI Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of chat sessions
 */
router.get('/sessions', getUserSessions);

/**
 * @swagger
 * /api/ai-chat/history/{session_id}:
 *   get:
 *     summary: Get chat history for a specific session
 *     tags: [AI Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat history retrieved
 */
router.get('/history/:session_id', getChatHistory);

/**
 * @swagger
 * /api/ai-chat/session/{session_id}:
 *   delete:
 *     summary: Delete a chat session
 *     tags: [AI Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session deleted successfully
 */
router.delete('/session/:session_id', deleteSession);

export default router;
