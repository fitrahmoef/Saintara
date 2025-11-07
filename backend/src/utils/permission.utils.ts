/**
 * Permission Utilities
 * Helper functions for checking user permissions
 */

import pool from '../config/database';
import { UserRole, PermissionScope, AuthContext } from '../types/institution.types';
import logger from '../config/logger';

/**
 * Check if a user has a specific permission
 */
export async function checkUserPermission(
  userId: number,
  permissionCode: string,
  scope: PermissionScope = 'own',
  targetInstitutionId?: number
): Promise<boolean> {
  try {
    // Get user details
    const userResult = await pool.query(
      'SELECT id, role, institution_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return false;
    }

    const user = userResult.rows[0];

    // Superadmin has all permissions
    if (user.role === 'superadmin') {
      return true;
    }

    // Check role-based permissions
    const rolePermissionQuery = `
      SELECT rp.scope
      FROM role_permissions rp
      JOIN permissions p ON p.id = rp.permission_id
      WHERE rp.role = $1 AND p.code = $2
    `;

    const rolePermResult = await pool.query(rolePermissionQuery, [
      user.role,
      permissionCode,
    ]);

    if (rolePermResult.rows.length === 0) {
      // Check custom user permissions
      const userPermQuery = `
        SELECT up.institution_id
        FROM user_permissions up
        JOIN permissions p ON p.id = up.permission_id
        WHERE up.user_id = $1 AND p.code = $2
      `;

      const userPermResult = await pool.query(userPermQuery, [
        userId,
        permissionCode,
      ]);

      if (userPermResult.rows.length === 0) {
        return false;
      }

      // If custom permission exists, check institution scope
      const customPerm = userPermResult.rows[0];
      if (targetInstitutionId && customPerm.institution_id !== targetInstitutionId) {
        return false;
      }

      return true;
    }

    const permissionScope = rolePermResult.rows[0].scope;

    // Check scope
    if (permissionScope === 'all') {
      return true;
    }

    if (permissionScope === 'institution') {
      // Institution-scoped permission
      if (!user.institution_id) {
        return false; // User not part of any institution
      }

      if (targetInstitutionId && user.institution_id !== targetInstitutionId) {
        return false; // Different institution
      }

      return true;
    }

    if (permissionScope === 'own') {
      // Own-scoped permission (user can only access their own data)
      return true; // Further checks needed at endpoint level
    }

    return false;
  } catch (error) {
    logger.error('Error checking user permission:', error);
    return false;
  }
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(userId: number): Promise<string[]> {
  try {
    const userResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return [];
    }

    const userRole = userResult.rows[0].role;

    // Superadmin has all permissions
    if (userRole === 'superadmin') {
      const allPermissions = await pool.query('SELECT code FROM permissions');
      return allPermissions.rows.map((row) => row.code);
    }

    // Get role-based permissions
    const rolePermQuery = `
      SELECT DISTINCT p.code
      FROM permissions p
      JOIN role_permissions rp ON rp.permission_id = p.id
      WHERE rp.role = $1
    `;

    const rolePermResult = await pool.query(rolePermQuery, [userRole]);

    // Get custom user permissions
    const userPermQuery = `
      SELECT DISTINCT p.code
      FROM permissions p
      JOIN user_permissions up ON up.permission_id = p.id
      WHERE up.user_id = $1
    `;

    const userPermResult = await pool.query(userPermQuery, [userId]);

    const permissions = new Set<string>();

    rolePermResult.rows.forEach((row) => permissions.add(row.code));
    userPermResult.rows.forEach((row) => permissions.add(row.code));

    return Array.from(permissions);
  } catch (error) {
    logger.error('Error getting user permissions:', error);
    return [];
  }
}

/**
 * Check if user can access a specific institution
 */
export async function canAccessInstitution(
  userId: number,
  institutionId: number
): Promise<boolean> {
  try {
    const userResult = await pool.query(
      'SELECT role, institution_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return false;
    }

    const user = userResult.rows[0];

    // Superadmin can access all institutions
    if (user.role === 'superadmin') {
      return true;
    }

    // Institution admin/admin can only access their institution
    if (user.role === 'institution_admin' || user.role === 'admin') {
      return user.institution_id === institutionId;
    }

    return false;
  } catch (error) {
    logger.error('Error checking institution access:', error);
    return false;
  }
}

/**
 * Get institutions that user can access
 */
export async function getAccessibleInstitutions(
  userId: number
): Promise<number[]> {
  try {
    const userResult = await pool.query(
      'SELECT role, institution_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return [];
    }

    const user = userResult.rows[0];

    // Superadmin can access all institutions
    if (user.role === 'superadmin') {
      const allInstitutions = await pool.query(
        'SELECT id FROM institutions WHERE is_active = true'
      );
      return allInstitutions.rows.map((row) => row.id);
    }

    // Other roles can only access their own institution
    if (user.institution_id) {
      return [user.institution_id];
    }

    return [];
  } catch (error) {
    logger.error('Error getting accessible institutions:', error);
    return [];
  }
}

/**
 * Check if user can manage a specific customer
 */
export async function canManageCustomer(
  adminId: number,
  customerId: number
): Promise<boolean> {
  try {
    const adminResult = await pool.query(
      'SELECT role, institution_id FROM users WHERE id = $1',
      [adminId]
    );

    if (adminResult.rows.length === 0) {
      return false;
    }

    const admin = adminResult.rows[0];

    // Superadmin can manage all customers
    if (admin.role === 'superadmin') {
      return true;
    }

    // Get customer details
    const customerResult = await pool.query(
      'SELECT institution_id, managed_by_admin_id FROM users WHERE id = $1',
      [customerId]
    );

    if (customerResult.rows.length === 0) {
      return false;
    }

    const customer = customerResult.rows[0];

    // Institution admin can manage customers in their institution
    if (admin.role === 'institution_admin' || admin.role === 'admin') {
      return (
        admin.institution_id === customer.institution_id &&
        admin.institution_id !== null
      );
    }

    return false;
  } catch (error) {
    logger.error('Error checking customer management permission:', error);
    return false;
  }
}

/**
 * Get permission scope for a user and permission
 */
export async function getPermissionScope(
  userId: number,
  permissionCode: string
): Promise<PermissionScope | null> {
  try {
    const userResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return null;
    }

    const userRole = userResult.rows[0].role;

    // Superadmin always has 'all' scope
    if (userRole === 'superadmin') {
      return 'all';
    }

    const query = `
      SELECT rp.scope
      FROM role_permissions rp
      JOIN permissions p ON p.id = rp.permission_id
      WHERE rp.role = $1 AND p.code = $2
    `;

    const result = await pool.query(query, [userRole, permissionCode]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].scope as PermissionScope;
  } catch (error) {
    logger.error('Error getting permission scope:', error);
    return null;
  }
}

/**
 * Build auth context from user ID
 */
export async function buildAuthContext(userId: number): Promise<AuthContext | null> {
  try {
    const userResult = await pool.query(
      'SELECT id, email, role, institution_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return null;
    }

    const user = userResult.rows[0];
    const permissions = await getUserPermissions(userId);

    return {
      user_id: user.id,
      email: user.email,
      role: user.role,
      institution_id: user.institution_id,
      permissions,
    };
  } catch (error) {
    logger.error('Error building auth context:', error);
    return null;
  }
}

/**
 * Check if role is admin-level or higher
 */
export function isAdminRole(role: UserRole): boolean {
  return ['superadmin', 'institution_admin', 'admin'].includes(role);
}

/**
 * Check if role is superadmin
 */
export function isSuperAdmin(role: UserRole): boolean {
  return role === 'superadmin';
}

/**
 * Check if role is institution admin
 */
export function isInstitutionAdmin(role: UserRole): boolean {
  return role === 'institution_admin';
}

/**
 * Format permission code
 */
export function formatPermissionCode(
  resource: string,
  action: string
): string {
  return `${resource}.${action}`;
}
