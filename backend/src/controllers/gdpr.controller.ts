/**
 * GDPR Compliance Controller
 *
 * Implements:
 * - Right to Access (Article 15) - Export user data
 * - Right to Erasure / "Right to be Forgotten" (Article 17) - Delete user data
 */

import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import logger from '../config/logger';
import { revokeAllUserTokens } from '../utils/token.utils';

/**
 * GDPR Article 15: Right to Access
 * Export all user data in a machine-readable format (JSON)
 */
export const exportUserData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    logger.info(`GDPR data export requested for user ID: ${userId}`);

    // Fetch user profile
    const userResult = await pool.query(
      `SELECT id, email, name, nickname, phone, gender, blood_type, country, city,
              avatar_url, role, institution_id, email_verified, created_at, updated_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    const userData = userResult.rows[0];

    // Fetch all test results
    const testsResult = await pool.query(
      `SELECT id, test_type, total_score, character_type, created_at, completed_at
       FROM tests WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    // Fetch all test answers
    const answersResult = await pool.query(
      `SELECT ta.question_id, ta.selected_option, ta.created_at
       FROM test_answers ta
       JOIN tests t ON ta.test_id = t.id
       WHERE t.user_id = $1
       ORDER BY ta.created_at DESC`,
      [userId]
    );

    // Fetch all transactions
    const transactionsResult = await pool.query(
      `SELECT id, package_type, amount, payment_method, status,
              payment_proof_url, created_at, updated_at
       FROM transactions WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    // Fetch all vouchers
    const vouchersResult = await pool.query(
      `SELECT id, code, package_type, is_used, used_at, expires_at, created_at
       FROM vouchers WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    // Fetch event registrations
    const eventsResult = await pool.query(
      `SELECT er.event_id, e.title, e.event_type, er.status,
              er.attended, er.registered_at
       FROM event_registrations er
       JOIN events e ON er.event_id = e.id
       WHERE er.user_id = $1
       ORDER BY er.registered_at DESC`,
      [userId]
    );

    // Fetch approval requests
    const approvalsResult = await pool.query(
      `SELECT id, type, reference_id, status, notes,
              admin_notes, created_at, updated_at
       FROM approval_requests WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    // Compile all data
    const exportData = {
      metadata: {
        export_date: new Date().toISOString(),
        user_id: userId,
        data_format: 'JSON',
        gdpr_article: 'Article 15 - Right to Access',
      },
      profile: userData,
      tests: {
        count: testsResult.rows.length,
        data: testsResult.rows,
      },
      test_answers: {
        count: answersResult.rows.length,
        data: answersResult.rows,
      },
      transactions: {
        count: transactionsResult.rows.length,
        data: transactionsResult.rows,
      },
      vouchers: {
        count: vouchersResult.rows.length,
        data: vouchersResult.rows,
      },
      event_registrations: {
        count: eventsResult.rows.length,
        data: eventsResult.rows,
      },
      approval_requests: {
        count: approvalsResult.rows.length,
        data: approvalsResult.rows,
      },
    };

    logger.info(`GDPR data export completed for user ID: ${userId}`);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="saintara-data-export-${userId}-${Date.now()}.json"`);

    res.status(200).json(exportData);
  } catch (error) {
    logger.error('GDPR data export error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to export user data',
    });
  }
};

/**
 * GDPR Article 17: Right to Erasure (Right to be Forgotten)
 * Request account deletion
 */
export const requestAccountDeletion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { reason } = req.body;

    logger.info(`Account deletion requested for user ID: ${userId}`);

    // Check if deletion request already exists
    const existingRequest = await pool.query(
      `SELECT id FROM approval_requests
       WHERE user_id = $1 AND type = 'account_deletion' AND status = 'pending'`,
      [userId]
    );

    if (existingRequest.rows.length > 0) {
      res.status(400).json({
        status: 'error',
        message: 'Account deletion request already pending',
      });
      return;
    }

    // Create deletion request
    await pool.query(
      `INSERT INTO approval_requests (user_id, type, notes, status)
       VALUES ($1, 'account_deletion', $2, 'pending')`,
      [userId, reason || 'User requested account deletion (GDPR Article 17)']
    );

    logger.info(`Account deletion request created for user ID: ${userId}`);

    res.status(200).json({
      status: 'success',
      message: 'Account deletion request submitted. An administrator will review your request shortly.',
    });
  } catch (error) {
    logger.error('Account deletion request error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit deletion request',
    });
  }
};

/**
 * GDPR Article 17: Execute Account Deletion
 * Actually delete the account and all associated data
 * This should be called by admin after approval or automatically after confirmation
 */
export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { confirmation } = req.body;

    // Require explicit confirmation
    if (confirmation !== 'DELETE MY ACCOUNT') {
      res.status(400).json({
        status: 'error',
        message: 'Please provide confirmation text: "DELETE MY ACCOUNT"',
      });
      return;
    }

    logger.warn(`Account deletion initiated for user ID: ${userId}`);

    // Start transaction
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Delete in order (respecting foreign key constraints)
      // 1. Test answers (references tests)
      await client.query(
        `DELETE FROM test_answers WHERE test_id IN
         (SELECT id FROM tests WHERE user_id = $1)`,
        [userId]
      );

      // 2. Tests
      await client.query('DELETE FROM tests WHERE user_id = $1', [userId]);

      // 3. Event registrations
      await client.query('DELETE FROM event_registrations WHERE user_id = $1', [userId]);

      // 4. Transactions
      await client.query('DELETE FROM transactions WHERE user_id = $1', [userId]);

      // 5. Vouchers
      await client.query('DELETE FROM vouchers WHERE user_id = $1', [userId]);

      // 6. Approval requests
      await client.query('DELETE FROM approval_requests WHERE user_id = $1', [userId]);

      // 7. Refresh tokens
      await client.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);

      // 8. Password reset tokens
      await client.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);

      // 9. Email verification tokens
      await client.query('DELETE FROM email_verification_tokens WHERE user_id = $1', [userId]);

      // 10. Customer tags (if exists)
      try {
        await client.query('DELETE FROM customer_tags WHERE customer_id = $1', [userId]);
      } catch (e) {
        // Table might not exist
        logger.warn('customer_tags table might not exist');
      }

      // 11. User permissions (if exists)
      try {
        await client.query('DELETE FROM user_permissions WHERE user_id = $1', [userId]);
      } catch (e) {
        logger.warn('user_permissions table might not exist');
      }

      // 12. Finally delete user
      const deleteResult = await client.query(
        'DELETE FROM users WHERE id = $1 RETURNING email',
        [userId]
      );

      await client.query('COMMIT');

      // Revoke all sessions
      await revokeAllUserTokens(userId, 'account_deleted');

      logger.warn(`Account permanently deleted for user: ${deleteResult.rows[0].email}`);

      res.status(200).json({
        status: 'success',
        message: 'Your account and all associated data have been permanently deleted.',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Account deletion error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete account',
    });
  }
};
