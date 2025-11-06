import pool from '../config/database';
import logger from '../config/logger';
import { Request } from 'express';

export interface AuditLogEntry {
  userId?: number;
  userEmail?: string;
  userRole?: string;
  action: string;
  resourceType: string;
  resourceId?: string | number;
  description?: string;
  changes?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  requestMethod?: string;
  requestPath?: string;
  status?: 'success' | 'failure' | 'error';
  errorMessage?: string;
}

/**
 * Audit Log Service
 * Handles security audit logging for all admin actions and sensitive operations
 */
export class AuditLogService {
  /**
   * Create an audit log entry
   */
  static async log(entry: AuditLogEntry): Promise<void> {
    try {
      const query = `
        INSERT INTO audit_logs (
          user_id, user_email, user_role, action, resource_type, resource_id,
          description, changes, metadata, ip_address, user_agent,
          request_method, request_path, status, error_message
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `;

      const values = [
        entry.userId || null,
        entry.userEmail || null,
        entry.userRole || null,
        entry.action,
        entry.resourceType,
        entry.resourceId?.toString() || null,
        entry.description || null,
        entry.changes ? JSON.stringify(entry.changes) : null,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
        entry.ipAddress || null,
        entry.userAgent || null,
        entry.requestMethod || null,
        entry.requestPath || null,
        entry.status || 'success',
        entry.errorMessage || null,
      ];

      await pool.query(query, values);

      // Also log to application logs for critical actions
      if (entry.action.includes('delete') || entry.action.includes('approve')) {
        logger.info('Audit log created', {
          action: entry.action,
          user: entry.userEmail,
          resource: `${entry.resourceType}:${entry.resourceId}`,
        });
      }
    } catch (error) {
      // Don't throw error to avoid breaking the main flow
      logger.error('Failed to create audit log:', error);
    }
  }

  /**
   * Log from Express request
   */
  static async logFromRequest(req: Request, entry: Omit<AuditLogEntry, 'ipAddress' | 'userAgent' | 'requestMethod' | 'requestPath'>): Promise<void> {
    const user = (req as any).user;

    await this.log({
      ...entry,
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
      requestMethod: req.method,
      requestPath: req.originalUrl || req.url,
    });
  }

  /**
   * Get audit logs with filters
   */
  static async getLogs(filters: {
    userId?: number;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    try {
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (filters.userId) {
        conditions.push(`user_id = $${paramIndex++}`);
        values.push(filters.userId);
      }

      if (filters.action) {
        conditions.push(`action = $${paramIndex++}`);
        values.push(filters.action);
      }

      if (filters.resourceType) {
        conditions.push(`resource_type = $${paramIndex++}`);
        values.push(filters.resourceType);
      }

      if (filters.resourceId) {
        conditions.push(`resource_id = $${paramIndex++}`);
        values.push(filters.resourceId);
      }

      if (filters.startDate) {
        conditions.push(`created_at >= $${paramIndex++}`);
        values.push(filters.startDate);
      }

      if (filters.endDate) {
        conditions.push(`created_at <= $${paramIndex++}`);
        values.push(filters.endDate);
      }

      if (filters.status) {
        conditions.push(`status = $${paramIndex++}`);
        values.push(filters.status);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const limit = filters.limit || 100;
      const offset = filters.offset || 0;

      const query = `
        SELECT * FROM audit_logs
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;

      values.push(limit, offset);

      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      logger.error('Failed to fetch audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit log count
   */
  static async getLogCount(filters: {
    userId?: number;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<number> {
    try {
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (filters.userId) {
        conditions.push(`user_id = $${paramIndex++}`);
        values.push(filters.userId);
      }

      if (filters.action) {
        conditions.push(`action = $${paramIndex++}`);
        values.push(filters.action);
      }

      if (filters.resourceType) {
        conditions.push(`resource_type = $${paramIndex++}`);
        values.push(filters.resourceType);
      }

      if (filters.startDate) {
        conditions.push(`created_at >= $${paramIndex++}`);
        values.push(filters.startDate);
      }

      if (filters.endDate) {
        conditions.push(`created_at <= $${paramIndex++}`);
        values.push(filters.endDate);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const query = `SELECT COUNT(*) FROM audit_logs ${whereClause}`;
      const result = await pool.query(query, values);

      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Failed to count audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit log statistics
   */
  static async getStatistics(startDate: Date, endDate: Date): Promise<any> {
    try {
      const query = `
        SELECT
          COUNT(*) as total_logs,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(CASE WHEN status = 'failure' THEN 1 END) as failed_actions,
          resource_type,
          COUNT(*) as count
        FROM audit_logs
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY resource_type
        ORDER BY count DESC
      `;

      const result = await pool.query(query, [startDate, endDate]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get audit log statistics:', error);
      throw error;
    }
  }

  /**
   * Clean up old audit logs (for data retention policy)
   */
  static async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const query = `
        DELETE FROM audit_logs
        WHERE created_at < $1
        RETURNING id
      `;

      const result = await pool.query(query, [cutoffDate]);
      const deletedCount = result.rowCount || 0;

      logger.info(`Cleaned up ${deletedCount} audit logs older than ${daysToKeep} days`);

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old audit logs:', error);
      throw error;
    }
  }
}

// Predefined action types for consistency
export const AuditActions = {
  // User actions
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_PASSWORD_CHANGE: 'user.password_change',
  USER_PASSWORD_RESET: 'user.password_reset',
  USER_ROLE_CHANGE: 'user.role_change',

  // Transaction actions
  TRANSACTION_CREATE: 'transaction.create',
  TRANSACTION_UPDATE: 'transaction.update',
  TRANSACTION_APPROVE: 'transaction.approve',
  TRANSACTION_REJECT: 'transaction.reject',

  // Approval actions
  APPROVAL_CREATE: 'approval.create',
  APPROVAL_APPROVE: 'approval.approve',
  APPROVAL_REJECT: 'approval.reject',

  // Customer actions
  CUSTOMER_CREATE: 'customer.create',
  CUSTOMER_UPDATE: 'customer.update',
  CUSTOMER_DELETE: 'customer.delete',
  CUSTOMER_BULK_IMPORT: 'customer.bulk_import',

  // Institution actions
  INSTITUTION_CREATE: 'institution.create',
  INSTITUTION_UPDATE: 'institution.update',
  INSTITUTION_DELETE: 'institution.delete',
  INSTITUTION_ADMIN_ASSIGN: 'institution.admin_assign',
  INSTITUTION_ADMIN_REMOVE: 'institution.admin_remove',

  // System actions
  SYSTEM_BACKUP: 'system.backup',
  SYSTEM_RESTORE: 'system.restore',
  SYSTEM_CONFIG_CHANGE: 'system.config_change',
  SYSTEM_CACHE_CLEAR: 'system.cache_clear',
} as const;

export default AuditLogService;
