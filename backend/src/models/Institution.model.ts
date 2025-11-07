/**
 * Institution Model
 * Data Access Layer for institutions table
 */

import { Pool } from 'pg';
import pool from '../config/database';
import { Institution, CreateInstitutionDto, UpdateInstitutionDto } from '../types/institution.types';

export class InstitutionModel {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  /**
   * Find institution by ID
   */
  async findById(id: number): Promise<Institution | null> {
    const result = await this.pool.query(
      'SELECT * FROM institutions WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find institution by code
   */
  async findByCode(code: string): Promise<Institution | null> {
    const result = await this.pool.query(
      'SELECT * FROM institutions WHERE code = $1',
      [code]
    );
    return result.rows[0] || null;
  }

  /**
   * Create new institution
   */
  async create(data: CreateInstitutionDto): Promise<Institution> {
    const result = await this.pool.query(
      `INSERT INTO institutions (
        name, code, contact_email, contact_phone, address,
        max_users, subscription_type, subscription_expires_at, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        data.name,
        data.code,
        data.contact_email,
        data.contact_phone,
        data.address,
        data.max_users || 100,
        data.subscription_type || 'basic',
        data.subscription_expires_at,
        true
      ]
    );
    return result.rows[0];
  }

  /**
   * Update institution
   */
  async update(id: number, data: UpdateInstitutionDto): Promise<Institution | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const result = await this.pool.query(
      `UPDATE institutions SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete institution (soft delete by setting is_active = false)
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.pool.query(
      'UPDATE institutions SET is_active = false WHERE id = $1',
      [id]
    );
    return result.rowCount! > 0;
  }

  /**
   * Hard delete institution
   */
  async hardDelete(id: number): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM institutions WHERE id = $1',
      [id]
    );
    return result.rowCount! > 0;
  }

  /**
   * Find all institutions with pagination
   */
  async findAll(filters: {
    is_active?: boolean;
    subscription_type?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ institutions: Institution[]; total: number }> {
    let query = 'SELECT * FROM institutions WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.is_active !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(filters.is_active);
      paramIndex++;
    }

    if (filters.subscription_type) {
      query += ` AND subscription_type = $${paramIndex}`;
      params.push(filters.subscription_type);
      paramIndex++;
    }

    if (filters.search) {
      query += ` AND (name ILIKE $${paramIndex} OR code ILIKE $${paramIndex} OR contact_email ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Get total count
    const countResult = await this.pool.query(
      query.replace('SELECT *', 'SELECT COUNT(*)'),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Add pagination
    query += ' ORDER BY created_at DESC';
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
    return { institutions: result.rows, total };
  }

  /**
   * Get institution statistics
   */
  async getStatistics(institutionId: number): Promise<any> {
    const result = await this.pool.query(
      `SELECT
        (SELECT COUNT(*) FROM users WHERE institution_id = $1 AND role IN ('institution_admin', 'admin')) as admin_count,
        (SELECT COUNT(*) FROM users WHERE institution_id = $1 AND role = 'user') as customer_count,
        (SELECT COUNT(*) FROM tests t JOIN users u ON t.user_id = u.id WHERE u.institution_id = $1) as test_count,
        (SELECT COUNT(*) FROM transactions tr JOIN users u ON tr.user_id = u.id WHERE u.institution_id = $1 AND tr.status = 'completed') as completed_transactions
      `,
      [institutionId]
    );
    return result.rows[0];
  }

  /**
   * Get institution admins
   */
  async getAdmins(institutionId: number): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT id, email, name, role, created_at
       FROM users
       WHERE institution_id = $1 AND role IN ('institution_admin', 'admin')
       ORDER BY created_at DESC`,
      [institutionId]
    );
    return result.rows;
  }

  /**
   * Assign admin to institution
   */
  async assignAdmin(institutionId: number, userId: number, role: 'institution_admin' | 'admin'): Promise<void> {
    await this.pool.query(
      'UPDATE users SET institution_id = $1, role = $2 WHERE id = $3',
      [institutionId, role, userId]
    );
  }
}

export default new InstitutionModel();
