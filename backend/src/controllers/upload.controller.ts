/**
 * File Upload Controller
 * Handles file uploads for avatars, payment proofs, etc.
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import pool from '../config/database';
import fs from 'fs/promises';
import path from 'path';

/**
 * Upload user avatar
 */
export const uploadAvatar = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        status: 'error',
        message: 'No file uploaded',
      });
      return;
    }

    const userId = req.user!.id;
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Get old avatar to delete it
    const oldAvatarResult = await pool.query(
      'SELECT avatar_url FROM users WHERE id = $1',
      [userId]
    );

    // Update user avatar URL in database
    await pool.query(
      'UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [avatarUrl, userId]
    );

    // Delete old avatar file if it exists
    if (oldAvatarResult.rows[0]?.avatar_url) {
      const oldAvatarPath = path.join(
        __dirname,
        '../../uploads/avatars',
        path.basename(oldAvatarResult.rows[0].avatar_url)
      );

      try {
        await fs.unlink(oldAvatarPath);
      } catch (error) {
        console.error('Failed to delete old avatar:', error);
        // Continue even if old file deletion fails
      }
    }

    res.json({
      status: 'success',
      data: {
        avatarUrl,
        filename: req.file.filename,
      },
      message: 'Avatar uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload avatar';

    // Delete uploaded file if database update fails
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to cleanup uploaded file:', unlinkError);
      }
    }

    res.status(500).json({
      status: 'error',
      message: errorMessage,
    });
  }
};

/**
 * Upload payment proof
 */
export const uploadPaymentProof = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        status: 'error',
        message: 'No file uploaded',
      });
      return;
    }

    const { transactionId } = req.body;

    if (!transactionId) {
      // Delete uploaded file
      await fs.unlink(req.file.path);

      res.status(400).json({
        status: 'error',
        message: 'Transaction ID is required',
      });
      return;
    }

    // Verify transaction belongs to user
    const transactionResult = await pool.query(
      'SELECT id, user_id, status FROM transactions WHERE id = $1',
      [transactionId]
    );

    if (transactionResult.rows.length === 0) {
      // Delete uploaded file
      await fs.unlink(req.file.path);

      res.status(404).json({
        status: 'error',
        message: 'Transaction not found',
      });
      return;
    }

    const transaction = transactionResult.rows[0];

    // Check if user owns this transaction
    if (
      req.user!.role !== 'superadmin' &&
      req.user!.role !== 'institution_admin' &&
      transaction.user_id !== req.user!.id
    ) {
      // Delete uploaded file
      await fs.unlink(req.file.path);

      res.status(403).json({
        status: 'error',
        message: 'Access denied to this transaction',
      });
      return;
    }

    const proofUrl = `/uploads/payment-proofs/${req.file.filename}`;

    // Get old proof to delete it
    const oldProofResult = await pool.query(
      'SELECT payment_proof_url FROM transactions WHERE id = $1',
      [transactionId]
    );

    // Update transaction with payment proof
    await pool.query(
      `UPDATE transactions
       SET payment_proof_url = $1,
           status = CASE
             WHEN status = 'pending' THEN 'pending_verification'::VARCHAR
             ELSE status::VARCHAR
           END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [proofUrl, transactionId]
    );

    // Delete old proof file if it exists
    if (oldProofResult.rows[0]?.payment_proof_url) {
      const oldProofPath = path.join(
        __dirname,
        '../../uploads/payment-proofs',
        path.basename(oldProofResult.rows[0].payment_proof_url)
      );

      try {
        await fs.unlink(oldProofPath);
      } catch (error) {
        console.error('Failed to delete old payment proof:', error);
        // Continue even if old file deletion fails
      }
    }

    res.json({
      status: 'success',
      data: {
        proofUrl,
        filename: req.file.filename,
        transactionId,
      },
      message: 'Payment proof uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload payment proof';

    // Delete uploaded file if operation fails
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to cleanup uploaded file:', unlinkError);
      }
    }

    res.status(500).json({
      status: 'error',
      message: errorMessage,
    });
  }
};

/**
 * Delete user avatar
 */
export const deleteAvatar = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Get current avatar
    const result = await pool.query(
      'SELECT avatar_url FROM users WHERE id = $1',
      [userId]
    );

    if (!result.rows[0]?.avatar_url) {
      res.status(404).json({
        status: 'error',
        message: 'No avatar to delete',
      });
      return;
    }

    const avatarPath = path.join(
      __dirname,
      '../../uploads/avatars',
      path.basename(result.rows[0].avatar_url)
    );

    // Delete file
    try {
      await fs.unlink(avatarPath);
    } catch (error) {
      console.error('Failed to delete avatar file:', error);
      // Continue even if file deletion fails
    }

    // Update database
    await pool.query(
      'UPDATE users SET avatar_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );

    res.json({
      status: 'success',
      message: 'Avatar deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete avatar';
    res.status(500).json({
      status: 'error',
      message: errorMessage,
    });
  }
};

/**
 * Serve uploaded files (with access control)
 */
export const serveFile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { type, filename } = req.params;

    // Validate file type
    const allowedTypes = ['avatars', 'payment-proofs'];
    if (!allowedTypes.includes(type)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid file type',
      });
      return;
    }

    // Build file path
    const filePath = path.join(__dirname, '../../uploads', type, filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      res.status(404).json({
        status: 'error',
        message: 'File not found',
      });
      return;
    }

    // For payment proofs, check access control
    if (type === 'payment-proofs') {
      // Only admins or the transaction owner can view payment proofs
      if (req.user!.role !== 'superadmin' && req.user!.role !== 'institution_admin') {
        // Check if this payment proof belongs to the user's transaction
        const result = await pool.query(
          'SELECT user_id FROM transactions WHERE payment_proof_url LIKE $1',
          [`%${filename}%`]
        );

        if (result.rows.length === 0 || result.rows[0].user_id !== req.user!.id) {
          res.status(403).json({
            status: 'error',
            message: 'Access denied to this file',
          });
          return;
        }
      }
    }

    // Serve the file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to serve file';
    res.status(500).json({
      status: 'error',
      message: errorMessage,
    });
  }
};
