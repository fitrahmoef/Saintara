import { pool } from '../config/database';
import { logger } from '../utils/logger';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';

/**
 * GDPR Compliance Service
 * Implements data subject rights under GDPR/Privacy laws
 */

interface UserData {
  personal: any;
  tests: any[];
  transactions: any[];
  auditLogs: any[];
}

export class GDPRService {
  /**
   * Export all user data (Right to Data Portability)
   */
  async exportUserData(userId: string): Promise<UserData> {
    try {
      // Get personal information
      const userResult = await pool.query(
        `SELECT id, email, full_name, phone, date_of_birth, gender,
                address, city, province, country, created_at, updated_at
         FROM users WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      // Get test results
      const testsResult = await pool.query(
        `SELECT tr.id, tr.test_id, t.test_name, tr.score, tr.character_type_id,
                ct.type_name, tr.completed_at, tr.time_taken
         FROM test_results tr
         JOIN tests t ON tr.test_id = t.id
         LEFT JOIN character_types ct ON tr.character_type_id = ct.id
         WHERE tr.user_id = $1
         ORDER BY tr.completed_at DESC`,
        [userId]
      );

      // Get transactions
      const transactionsResult = await pool.query(
        `SELECT id, package_id, amount, status, payment_method,
                external_id, created_at, paid_at
         FROM transactions
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );

      // Get audit logs
      const auditLogsResult = await pool.query(
        `SELECT action, details, ip_address, user_agent, created_at
         FROM audit_logs
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );

      // Get OAuth accounts
      const oauthResult = await pool.query(
        `SELECT provider, email, name, created_at
         FROM oauth_accounts
         WHERE user_id = $1`,
        [userId]
      );

      return {
        personal: {
          ...userResult.rows[0],
          oauth_accounts: oauthResult.rows,
        },
        tests: testsResult.rows,
        transactions: transactionsResult.rows,
        auditLogs: auditLogsResult.rows,
      };
    } catch (error) {
      logger.error('Export User Data Error:', error);
      throw error;
    }
  }

  /**
   * Create downloadable ZIP archive of user data
   */
  async createDataExportArchive(userId: string, outputPath: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const userData = await this.exportUserData(userId);

        // Create ZIP archive
        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
          logger.info(`Data export archive created: ${archive.pointer()} bytes`);
          resolve(outputPath);
        });

        archive.on('error', (err) => {
          reject(err);
        });

        archive.pipe(output);

        // Add JSON files to archive
        archive.append(JSON.stringify(userData.personal, null, 2), {
          name: 'personal-information.json',
        });
        archive.append(JSON.stringify(userData.tests, null, 2), {
          name: 'test-results.json',
        });
        archive.append(JSON.stringify(userData.transactions, null, 2), {
          name: 'transactions.json',
        });
        archive.append(JSON.stringify(userData.auditLogs, null, 2), {
          name: 'audit-logs.json',
        });

        // Add README
        const readme = `# Your Saintara Data Export

This archive contains all personal data we have about you.

## Files Included:
- personal-information.json: Your account and profile information
- test-results.json: All test results and scores
- transactions.json: Payment and transaction history
- audit-logs.json: Account activity logs

## Data Format:
All data is in JSON format for easy readability and portability.

## Questions?
Contact us at privacy@saintara.com

Generated: ${new Date().toISOString()}
`;

        archive.append(readme, { name: 'README.txt' });

        archive.finalize();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Delete user account (Right to be Forgotten)
   * Implements grace period and data retention policies
   */
  async requestAccountDeletion(userId: string): Promise<Date> {
    try {
      const gracePeriod = 30; // 30 days grace period
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + gracePeriod);

      // Mark account for deletion
      await pool.query(
        `UPDATE users
         SET deletion_requested_at = NOW(),
             scheduled_deletion_at = $1,
             status = 'pending_deletion'
         WHERE id = $2`,
        [deletionDate, userId]
      );

      logger.info(`Account deletion requested for user ${userId}, scheduled for ${deletionDate}`);

      return deletionDate;
    } catch (error) {
      logger.error('Request Account Deletion Error:', error);
      throw error;
    }
  }

  /**
   * Cancel account deletion (within grace period)
   */
  async cancelAccountDeletion(userId: string): Promise<boolean> {
    try {
      const result = await pool.query(
        `UPDATE users
         SET deletion_requested_at = NULL,
             scheduled_deletion_at = NULL,
             status = 'active'
         WHERE id = $1
           AND scheduled_deletion_at > NOW()`,
        [userId]
      );

      if (result.rowCount === 0) {
        return false; // Already deleted or grace period expired
      }

      logger.info(`Account deletion cancelled for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Cancel Account Deletion Error:', error);
      throw error;
    }
  }

  /**
   * Permanently delete user account and anonymize data
   */
  async permanentlyDeleteAccount(userId: string): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Anonymize test results (keep for statistics but remove personal link)
      await client.query(
        `UPDATE test_results
         SET user_id = NULL,
             anonymized = true,
             anonymized_at = NOW()
         WHERE user_id = $1`,
        [userId]
      );

      // Anonymize transactions (required for financial records)
      await client.query(
        `UPDATE transactions
         SET user_id = NULL,
             anonymized = true,
             anonymized_at = NOW()
         WHERE user_id = $1`,
        [userId]
      );

      // Delete personal data
      await client.query('DELETE FROM two_factor_auth WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM oauth_accounts WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM user_subscriptions WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM audit_logs WHERE user_id = $1', [userId]);

      // Delete user account
      await client.query('DELETE FROM users WHERE id = $1', [userId]);

      await client.query('COMMIT');

      logger.info(`User ${userId} permanently deleted and data anonymized`);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Permanent Account Deletion Error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Process scheduled deletions (run as cron job)
   */
  async processScheduledDeletions(): Promise<number> {
    try {
      // Find accounts scheduled for deletion
      const result = await pool.query(
        `SELECT id FROM users
         WHERE scheduled_deletion_at IS NOT NULL
           AND scheduled_deletion_at <= NOW()
           AND status = 'pending_deletion'`
      );

      const count = result.rows.length;

      for (const row of result.rows) {
        try {
          await this.permanentlyDeleteAccount(row.id);
        } catch (error) {
          logger.error(`Failed to delete user ${row.id}:`, error);
        }
      }

      logger.info(`Processed ${count} scheduled account deletions`);
      return count;
    } catch (error) {
      logger.error('Process Scheduled Deletions Error:', error);
      throw error;
    }
  }

  /**
   * Rectify user data (Right to Rectification)
   */
  async rectifyUserData(userId: string, updates: any): Promise<void> {
    try {
      const allowedFields = [
        'full_name',
        'phone',
        'date_of_birth',
        'gender',
        'address',
        'city',
        'province',
        'country',
      ];

      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = $${paramIndex}`);
          updateValues.push(value);
          paramIndex++;
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      updateValues.push(userId);

      const query = `UPDATE users SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`;

      await pool.query(query, updateValues);

      logger.info(`User data rectified for user ${userId}`);
    } catch (error) {
      logger.error('Rectify User Data Error:', error);
      throw error;
    }
  }

  /**
   * Restrict data processing (Right to Restriction)
   */
  async restrictDataProcessing(userId: string, restrict: boolean): Promise<void> {
    try {
      await pool.query(
        `UPDATE users
         SET data_processing_restricted = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [restrict, userId]
      );

      logger.info(`Data processing ${restrict ? 'restricted' : 'unrestricted'} for user ${userId}`);
    } catch (error) {
      logger.error('Restrict Data Processing Error:', error);
      throw error;
    }
  }

  /**
   * Get consent history
   */
  async getConsentHistory(userId: string): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT consent_type, granted, ip_address, user_agent, created_at
         FROM consent_history
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      logger.error('Get Consent History Error:', error);
      throw error;
    }
  }

  /**
   * Record consent
   */
  async recordConsent(
    userId: string,
    consentType: string,
    granted: boolean,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO consent_history (user_id, consent_type, granted, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, consentType, granted, ipAddress, userAgent]
      );

      logger.info(`Consent recorded for user ${userId}: ${consentType} = ${granted}`);
    } catch (error) {
      logger.error('Record Consent Error:', error);
      throw error;
    }
  }

  /**
   * Cleanup old data (data retention policy)
   */
  async cleanupOldData(): Promise<void> {
    try {
      // Delete audit logs older than 2 years
      await pool.query(
        `DELETE FROM audit_logs
         WHERE created_at < NOW() - INTERVAL '2 years'`
      );

      // Delete expired sessions
      await pool.query(
        `DELETE FROM sessions
         WHERE expires_at < NOW()`
      );

      // Archive old transactions (older than 7 years, but keep for compliance)
      // This is a placeholder - actual implementation would move to archive table

      logger.info('Old data cleanup completed');
    } catch (error) {
      logger.error('Cleanup Old Data Error:', error);
      throw error;
    }
  }
}

export default new GDPRService();
