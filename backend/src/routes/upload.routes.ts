/**
 * Upload Routes
 * Handles file upload endpoints
 */

import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { uploadAvatar, uploadPaymentProof } from '../config/multer.config';
import * as uploadController from '../controllers/upload.controller';

const router = express.Router();

/**
 * @route   POST /api/upload/avatar
 * @desc    Upload user avatar
 * @access  Private (any authenticated user)
 */
router.post(
  '/avatar',
  authenticate,
  uploadAvatar.single('avatar'),
  uploadController.uploadAvatar
);

/**
 * @route   DELETE /api/upload/avatar
 * @desc    Delete user avatar
 * @access  Private (any authenticated user)
 */
router.delete(
  '/avatar',
  authenticate,
  uploadController.deleteAvatar
);

/**
 * @route   POST /api/upload/payment-proof
 * @desc    Upload payment proof for a transaction
 * @access  Private (any authenticated user)
 */
router.post(
  '/payment-proof',
  authenticate,
  uploadPaymentProof.single('proof'),
  uploadController.uploadPaymentProof
);

/**
 * @route   GET /api/upload/:type/:filename
 * @desc    Serve uploaded files with access control
 * @access  Private (any authenticated user, with access control)
 */
router.get(
  '/:type/:filename',
  authenticate,
  uploadController.serveFile
);

export default router;
