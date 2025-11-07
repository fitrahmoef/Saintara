/**
 * Customer Model
 * Data Access Layer for managing institution customers (users)
 */

import { Pool } from 'pg';
import pool from '../config/database';

export class CustomerModel {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  /**
   * Get customers for an institution
   */
  async findByInstitution(filters: {
    institution_id: number;
    tag_id?: number;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
    sort_by?: string;
    sort_order?: string;
  }): Promise<{ customers: any[]; total: number }> {
    let query = `
      SELECT
        u.id, u.email, u.name, u.phone, u.email_verified,
        u.created_at, u.updated_at,
        COALESCE(json_agg(
          DISTINCT jsonb_build_object('id', ct.id, 'name', ct.name, 'color', ct.color)
        ) FILTER (WHERE ct.id IS NOT NULL), '[]') as tags
      FROM users u
      LEFT JOIN customer_tag_assignments cta ON u.id = cta.user_id
      LEFT JOIN customer_tags ct ON cta.tag_id = ct.id
      WHERE u.institution_id = $1 AND u.role = 'user'
    `;

    const params: any[] = [filters.institution_id];
    let paramIndex = 2;

    if (filters.tag_id) {
      query += ` AND cta.tag_id = $${paramIndex}`;
      params.push(filters.tag_id);
      paramIndex++;
    }

    if (filters.search) {
      query += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.phone ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ' GROUP BY u.id';

    // Get total count before pagination
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as count
      FROM users u
      LEFT JOIN customer_tag_assignments cta ON u.id = cta.user_id
      WHERE u.institution_id = $1 AND u.role = 'user'
      ${filters.tag_id ? `AND cta.tag_id = $2` : ''}
      ${filters.search ? `AND (u.name ILIKE $${filters.tag_id ? 3 : 2} OR u.email ILIKE $${filters.tag_id ? 3 : 2} OR u.phone ILIKE $${filters.tag_id ? 3 : 2})` : ''}
    `;
    const countResult = await this.pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Add sorting
    const sortBy = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order || 'desc';
    query += ` ORDER BY u.${sortBy} ${sortOrder}`;

    // Add pagination
    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }
    if (filters.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
      paramIndex++;
    }

    const result = await this.pool.query(query, params);
    return { customers: result.rows, total };
  }

  /**
   * Create customer for institution
   */
  async create(data: {
    email: string;
    name: string;
    phone?: string;
    password_hash: string;
    institution_id: number;
    managed_by_admin_id: number;
  }): Promise<any> {
    const result = await this.pool.query(
      `INSERT INTO users (
        email, name, phone, password_hash, role,
        institution_id, managed_by_admin_id, email_verified
      ) VALUES ($1, $2, $3, $4, 'user', $5, $6, false)
      RETURNING id, email, name, phone, created_at`,
      [data.email, data.name, data.phone, data.password_hash, data.institution_id, data.managed_by_admin_id]
    );
    return result.rows[0];
  }

  /**
   * Update customer
   */
  async update(id: number, institutionId: number, updates: {
    name?: string;
    phone?: string;
    email?: string;
  }): Promise<any | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return null;
    }

    values.push(id, institutionId);
    const result = await this.pool.query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex} AND institution_id = $${paramIndex + 1} AND role = 'user'
       RETURNING id, email, name, phone, updated_at`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete customer
   */
  async delete(id: number, institutionId: number): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM users WHERE id = $1 AND institution_id = $2 AND role = $3',
      [id, institutionId, 'user']
    );
    return result.rowCount! > 0;
  }

  /**
   * Bulk import customers
   */
  async bulkCreate(customers: Array<{
    email: string;
    name: string;
    phone?: string;
    password_hash: string;
    institution_id: number;
    managed_by_admin_id: number;
  }>): Promise<{ success: any[]; failed: any[] }> {
    const success: any[] = [];
    const failed: any[] = [];

    for (const customer of customers) {
      try {
        const result = await this.create(customer);
        success.push(result);
      } catch (error: any) {
        failed.push({
          email: customer.email,
          error: error.message
        });
      }
    }

    return { success, failed };
  }

  /**
   * Assign tags to customer
   */
  async assignTags(userId: number, tagIds: number[]): Promise<void> {
    // Remove existing tags
    await this.pool.query(
      'DELETE FROM customer_tag_assignments WHERE user_id = $1',
      [userId]
    );

    // Insert new tags
    if (tagIds.length > 0) {
      const values = tagIds.map((tagId, index) => {
        return `($1, $${index + 2})`;
      }).join(', ');

      await this.pool.query(
        `INSERT INTO customer_tag_assignments (user_id, tag_id) VALUES ${values}`,
        [userId, ...tagIds]
      );
    }
  }

  /**
   * Get customer by ID with institution check
   */
  async findById(id: number, institutionId: number): Promise<any | null> {
    const result = await this.pool.query(
      `SELECT id, email, name, phone, email_verified, created_at
       FROM users
       WHERE id = $1 AND institution_id = $2 AND role = 'user'`,
      [id, institutionId]
    );
    return result.rows[0] || null;
  }
}

export default new CustomerModel();
