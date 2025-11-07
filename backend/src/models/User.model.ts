/**
 * User Model
 * Data Access Layer for users table
 */

import { Pool } from 'pg';
import pool from '../config/database';

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  password_hash: string;
  role: 'superadmin' | 'institution_admin' | 'admin' | 'agent' | 'user';
  institution_id?: number;
  managed_by_admin_id?: number;
  email_verified: boolean;
  avatar_url?: string;
  login_attempts: number;
  locked_until?: Date;
  created_at: Date;
  updated_at: Date;
}

export class UserModel {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  /**
   * Find user by ID
   */
  async findById(id: number): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  /**
   * Create new user
   */
  async create(userData: {
    email: string;
    name: string;
    phone?: string;
    password_hash: string;
    role?: string;
    institution_id?: number;
    managed_by_admin_id?: number;
  }): Promise<User> {
    const result = await this.pool.query(
      `INSERT INTO users (email, name, phone, password_hash, role, institution_id, managed_by_admin_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userData.email,
        userData.name,
        userData.phone,
        userData.password_hash,
        userData.role || 'user',
        userData.institution_id,
        userData.managed_by_admin_id
      ]
    );
    return result.rows[0];
  }

  /**
   * Update user
   */
  async update(id: number, updates: Partial<User>): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
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
      `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete user
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM users WHERE id = $1',
      [id]
    );
    return result.rowCount! > 0;
  }

  /**
   * Find all users with filters
   */
  async findAll(filters: {
    role?: string;
    institution_id?: number;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ users: User[]; total: number }> {
    let query = 'SELECT * FROM users WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.role) {
      query += ` AND role = $${paramIndex}`;
      params.push(filters.role);
      paramIndex++;
    }

    if (filters.institution_id) {
      query += ` AND institution_id = $${paramIndex}`;
      params.push(filters.institution_id);
      paramIndex++;
    }

    if (filters.search) {
      query += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
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
    return { users: result.rows, total };
  }

  /**
   * Update login attempts
   */
  async updateLoginAttempts(email: string, attempts: number, lockUntil?: Date): Promise<void> {
    await this.pool.query(
      'UPDATE users SET login_attempts = $1, locked_until = $2 WHERE email = $3',
      [attempts, lockUntil, email]
    );
  }

  /**
   * Verify email
   */
  async verifyEmail(id: number): Promise<void> {
    await this.pool.query(
      'UPDATE users SET email_verified = true WHERE id = $1',
      [id]
    );
  }
}

export default new UserModel();
