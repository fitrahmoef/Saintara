/**
 * Institution Controller
 * Handles institution management and multi-tenancy operations
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import pool from '../config/database';
import { validationResult } from 'express-validator';
import {
  Institution,
  CreateInstitutionDto,
  UpdateInstitutionDto,
  InstitutionStatistics,
  AdminHierarchy,
} from '../types/institution.types';
import { getUserPermissions } from '../utils/permission.utils';
import logger from '../config/logger';

/**
 * Create a new institution (Superadmin only)
 */
export const createInstitution = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        status: 'error',
        errors: errors.array(),
      });
      return;
    }

    const {
      name,
      code,
      contact_email,
      contact_phone,
      address,
      max_users = 100,
      subscription_type = 'basic',
      subscription_expires_at,
    }: CreateInstitutionDto = req.body;

    // Check if code already exists
    const existingInstitution = await pool.query(
      'SELECT id FROM institutions WHERE code = $1',
      [code]
    );

    if (existingInstitution.rows.length > 0) {
      res.status(400).json({
        status: 'error',
        message: 'Institution code already exists',
      });
      return;
    }

    const result = await pool.query(
      `INSERT INTO institutions
      (name, code, contact_email, contact_phone, address, max_users, subscription_type, subscription_expires_at, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        name,
        code,
        contact_email,
        contact_phone,
        address,
        max_users,
        subscription_type,
        subscription_expires_at,
        req.user!.id,
      ]
    );

    res.status(201).json({
      status: 'success',
      data: {
        institution: result.rows[0],
      },
    });
  } catch (error) {
    logger.error('Error creating institution:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create institution',
    });
  }
};

/**
 * Get all institutions (with pagination)
 */
export const getInstitutions = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const is_active = req.query.is_active as string;
    const offset = (page - 1) * limit;

    let countQuery = 'SELECT COUNT(*) FROM institutions WHERE 1=1';
    let dataQuery = `
      SELECT i.*,
        u.name as created_by_name,
        u.email as created_by_email,
        (SELECT COUNT(*) FROM users WHERE institution_id = i.id AND role = 'user') as customer_count
      FROM institutions i
      LEFT JOIN users u ON i.created_by = u.id
      WHERE 1=1
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    // Add search filter
    if (search) {
      const searchCondition = ` AND (i.name ILIKE $${paramIndex} OR i.code ILIKE $${paramIndex})`;
      countQuery += searchCondition;
      dataQuery += searchCondition;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Add active filter
    if (is_active !== undefined) {
      const activeCondition = ` AND i.is_active = $${paramIndex}`;
      countQuery += activeCondition;
      dataQuery += activeCondition;
      queryParams.push(is_active === 'true');
      paramIndex++;
    }

    // If not superadmin, filter by user's institution
    if (req.user!.role !== 'superadmin' && req.user!.institution_id) {
      const institutionCondition = ` AND i.id = $${paramIndex}`;
      countQuery += institutionCondition;
      dataQuery += institutionCondition;
      queryParams.push(req.user!.institution_id);
      paramIndex++;
    }

    // Get total count
    const countResult = await pool.query(countQuery, queryParams);
    const totalInstitutions = parseInt(countResult.rows[0].count);

    // Get paginated data
    dataQuery += ` ORDER BY i.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const dataResult = await pool.query(dataQuery, [
      ...queryParams,
      limit,
      offset,
    ]);

    res.json({
      status: 'success',
      data: {
        institutions: dataResult.rows,
        pagination: {
          total: totalInstitutions,
          page,
          limit,
          total_pages: Math.ceil(totalInstitutions / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Error getting institutions:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get institutions',
    });
  }
};

/**
 * Get single institution by ID
 */
export const getInstitution = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { institutionId } = req.params;

    const result = await pool.query(
      `SELECT i.*,
        u.name as created_by_name,
        u.email as created_by_email,
        (SELECT COUNT(*) FROM users WHERE institution_id = i.id AND role = 'user') as customer_count,
        (SELECT COUNT(*) FROM users WHERE institution_id = i.id AND role IN ('institution_admin', 'admin')) as admin_count
      FROM institutions i
      LEFT JOIN users u ON i.created_by = u.id
      WHERE i.id = $1`,
      [institutionId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'Institution not found',
      });
      return;
    }

    res.json({
      status: 'success',
      data: {
        institution: result.rows[0],
      },
    });
  } catch (error) {
    logger.error('Error getting institution:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get institution',
    });
  }
};

/**
 * Update institution
 */
export const updateInstitution = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        status: 'error',
        errors: errors.array(),
      });
      return;
    }

    const { institutionId } = req.params;
    const updateData: UpdateInstitutionDto = req.body;

    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'No fields to update',
      });
      return;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(institutionId);

    const query = `
      UPDATE institutions
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, updateValues);

    if (result.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'Institution not found',
      });
      return;
    }

    res.json({
      status: 'success',
      data: {
        institution: result.rows[0],
      },
    });
  } catch (error) {
    logger.error('Error updating institution:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update institution',
    });
  }
};

/**
 * Delete institution (soft delete - set is_active to false)
 */
export const deleteInstitution = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { institutionId } = req.params;

    // Check if institution has active customers
    const customersResult = await pool.query(
      'SELECT COUNT(*) FROM users WHERE institution_id = $1 AND role = $2',
      [institutionId, 'user']
    );

    const customerCount = parseInt(customersResult.rows[0].count);

    if (customerCount > 0) {
      res.status(400).json({
        status: 'error',
        message: `Cannot delete institution with ${customerCount} active customers. Please remove customers first.`,
      });
      return;
    }

    // Soft delete
    const result = await pool.query(
      'UPDATE institutions SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [institutionId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'Institution not found',
      });
      return;
    }

    res.json({
      status: 'success',
      message: 'Institution deactivated successfully',
    });
  } catch (error) {
    logger.error('Error deleting institution:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete institution',
    });
  }
};

/**
 * Get institution statistics
 */
export const getInstitutionStatistics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { institutionId } = req.params;

    const result = await pool.query(
      'SELECT * FROM institution_statistics WHERE institution_id = $1',
      [institutionId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'Institution not found',
      });
      return;
    }

    res.json({
      status: 'success',
      data: {
        statistics: result.rows[0],
      },
    });
  } catch (error) {
    logger.error('Error getting institution statistics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get institution statistics',
    });
  }
};

/**
 * Get institution analytics
 */
export const getInstitutionAnalytics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { institutionId } = req.params;

    // Get basic stats
    const statsQuery = `
      SELECT
        COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'user') as total_customers,
        COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'user' AND u.is_active = true) as active_customers,
        COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'user' AND u.is_active = false) as inactive_customers,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed' AND t.completed_at >= DATE_TRUNC('month', CURRENT_DATE)) as tests_completed_this_month,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') as total_completed_tests,
        COUNT(DISTINCT t.id) as total_tests,
        COALESCE(SUM(tr.amount) FILTER (WHERE tr.status = 'paid' AND tr.created_at >= DATE_TRUNC('month', CURRENT_DATE)), 0) as revenue_this_month,
        COALESCE(SUM(tr.amount) FILTER (WHERE tr.status = 'paid'), 0) as total_revenue
      FROM users u
      LEFT JOIN tests t ON t.user_id = u.id
      LEFT JOIN transactions tr ON tr.user_id = u.id
      WHERE u.institution_id = $1
    `;

    const statsResult = await pool.query(statsQuery, [institutionId]);
    const stats = statsResult.rows[0];

    // Calculate test completion rate
    const testCompletionRate =
      stats.total_tests > 0
        ? ((stats.total_completed_tests / stats.total_tests) * 100).toFixed(1)
        : '0.0';

    // Get most common personality type
    const personalityQuery = `
      SELECT ct.name, COUNT(*) as count
      FROM test_results tr
      JOIN character_types ct ON ct.id = tr.character_type_id
      JOIN tests t ON t.id = tr.test_id
      JOIN users u ON u.id = t.user_id
      WHERE u.institution_id = $1
      GROUP BY ct.name
      ORDER BY count DESC
      LIMIT 1
    `;

    const personalityResult = await pool.query(personalityQuery, [
      institutionId,
    ]);
    const mostCommonPersonality = personalityResult.rows[0]?.name || null;

    // Get customer growth (last 6 months)
    const growthQuery = `
      SELECT
        TO_CHAR(created_at, 'Mon') as month,
        COUNT(*) as count
      FROM users
      WHERE institution_id = $1
        AND role = 'user'
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
      GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `;

    const growthResult = await pool.query(growthQuery, [institutionId]);
    const customerGrowth: { [key: string]: number } = {};
    growthResult.rows.forEach((row) => {
      customerGrowth[row.month] = parseInt(row.count);
    });

    // Get test distribution by type
    const testDistQuery = `
      SELECT
        test_type,
        COUNT(*) as count
      FROM tests t
      JOIN users u ON u.id = t.user_id
      WHERE u.institution_id = $1
      GROUP BY test_type
    `;

    const testDistResult = await pool.query(testDistQuery, [institutionId]);
    const testDistribution: any = {
      personal: 0,
      couple: 0,
      family: 0,
      team: 0,
    };
    testDistResult.rows.forEach((row) => {
      testDistribution[row.test_type] = parseInt(row.count);
    });

    res.json({
      status: 'success',
      data: {
        total_customers: parseInt(stats.total_customers),
        active_customers: parseInt(stats.active_customers),
        inactive_customers: parseInt(stats.inactive_customers),
        tests_completed_this_month: parseInt(stats.tests_completed_this_month),
        test_completion_rate: parseFloat(testCompletionRate),
        most_common_personality: mostCommonPersonality,
        customer_growth: customerGrowth,
        test_distribution: testDistribution,
        revenue_this_month: parseFloat(stats.revenue_this_month),
        total_revenue: parseFloat(stats.total_revenue),
      },
    });
  } catch (error) {
    logger.error('Error getting institution analytics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get institution analytics',
    });
  }
};

/**
 * Assign admin to institution
 */
export const assignAdmin = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        status: 'error',
        errors: errors.array(),
      });
      return;
    }

    const { institutionId } = req.params;
    const { user_id, role } = req.body;

    // Verify user exists
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [
      user_id,
    ]);

    if (userResult.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Verify institution exists
    const institutionResult = await pool.query(
      'SELECT * FROM institutions WHERE id = $1',
      [institutionId]
    );

    if (institutionResult.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'Institution not found',
      });
      return;
    }

    // Update user to admin role and assign to institution
    const updateResult = await pool.query(
      'UPDATE users SET role = $1, institution_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [role, institutionId, user_id]
    );

    // Get permissions for the new role
    const permissions = await getUserPermissions(user_id);

    res.json({
      status: 'success',
      data: {
        user: updateResult.rows[0],
        permissions,
      },
      message: 'Admin assigned successfully',
    });
  } catch (error) {
    logger.error('Error assigning admin:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to assign admin',
    });
  }
};

/**
 * Get admins for an institution
 */
export const getInstitutionAdmins = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { institutionId } = req.params;

    const result = await pool.query(
      `SELECT
        u.id,
        u.email,
        u.name,
        u.role,
        u.is_active,
        u.created_at,
        (SELECT COUNT(*) FROM users WHERE managed_by_admin_id = u.id) as managed_customers_count
      FROM users u
      WHERE u.institution_id = $1
        AND u.role IN ('institution_admin', 'admin')
      ORDER BY u.created_at DESC`,
      [institutionId]
    );

    res.json({
      status: 'success',
      data: {
        admins: result.rows,
      },
    });
  } catch (error) {
    logger.error('Error getting institution admins:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get institution admins',
    });
  }
};

/**
 * Remove admin from institution
 */
export const removeAdmin = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { institutionId, adminId } = req.params;

    // Update user back to regular user role
    const result = await pool.query(
      'UPDATE users SET role = $1, institution_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND institution_id = $3 RETURNING *',
      ['user', adminId, institutionId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'Admin not found in this institution',
      });
      return;
    }

    res.json({
      status: 'success',
      message: 'Admin removed successfully',
    });
  } catch (error) {
    logger.error('Error removing admin:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove admin',
    });
  }
};
