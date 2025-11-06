import { Request, Response } from 'express';
import logger from '../config/logger'
import pool from '../config/database';
import logger from '../config/logger'

// Get user vouchers
export const getUserVouchers = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { is_used } = req.query;

    let query = `
      SELECT * FROM vouchers
      WHERE user_id = $1
    `;
    const params: any[] = [userId];

    if (is_used !== undefined) {
      query += ` AND is_used = $2`;
      params.push(is_used === 'true');
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);

    res.json({
      vouchers: result.rows,
      available: result.rows.filter((v: any) => !v.is_used && new Date(v.expires_at) > new Date()).length
    });
  } catch (error) {
    logger.error('Get vouchers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Validate and use voucher
export const useVoucher = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { code } = req.body;

    // Check if voucher exists and is valid
    const voucherResult = await pool.query(
      `SELECT * FROM vouchers
       WHERE code = $1 AND user_id = $2`,
      [code, userId]
    );

    if (voucherResult.rows.length === 0) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    const voucher = voucherResult.rows[0];

    if (voucher.is_used) {
      return res.status(400).json({ message: 'Voucher already used' });
    }

    if (new Date(voucher.expires_at) < new Date()) {
      return res.status(400).json({ message: 'Voucher has expired' });
    }

    // Mark voucher as used
    const updateResult = await pool.query(
      `UPDATE vouchers
       SET is_used = true, used_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [voucher.id]
    );

    res.json({
      message: 'Voucher used successfully',
      voucher: updateResult.rows[0]
    });
  } catch (error) {
    logger.error('Use voucher error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Create manual voucher
export const createVoucher = async (req: Request, res: Response) => {
  try {
    const { user_id, package_type, expires_at } = req.body;

    const code = `${package_type.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    const result = await pool.query(
      `INSERT INTO vouchers (user_id, code, package_type, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_id, code, package_type, expires_at]
    );

    res.status(201).json({
      message: 'Voucher created successfully',
      voucher: result.rows[0]
    });
  } catch (error) {
    logger.error('Create voucher error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Get all vouchers
export const getAllVouchers = async (req: Request, res: Response) => {
  try {
    const { is_used, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT v.*, u.name as user_name, u.email as user_email
      FROM vouchers v
      JOIN users u ON v.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (is_used !== undefined) {
      query += ` AND v.is_used = $${params.length + 1}`;
      params.push(is_used === 'true');
    }

    query += ` ORDER BY v.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({ vouchers: result.rows });
  } catch (error) {
    logger.error('Get all vouchers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Delete voucher
export const deleteVoucher = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM vouchers WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    res.json({ message: 'Voucher deleted successfully' });
  } catch (error) {
    logger.error('Delete voucher error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
