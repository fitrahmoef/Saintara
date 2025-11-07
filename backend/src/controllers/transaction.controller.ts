import { Request, Response } from 'express';
import pool from '../config/database';
import logger from '../config/logger';

// Create a new transaction
export const createTransaction = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { package_type, amount, payment_method } = req.body;

    // Generate unique transaction code
    const transaction_code = `TRX-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    const result = await pool.query(
      `INSERT INTO transactions (user_id, package_type, amount, payment_method, transaction_code, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [userId, package_type, amount, payment_method, transaction_code]
    );

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction: result.rows[0]
    });
  } catch (error) {
    logger.error('Create transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all user transactions
export const getUserTransactions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { status, limit = 10, offset = 0 } = req.query;

    let query = `
      SELECT * FROM transactions
      WHERE user_id = $1
    `;
    const params: any[] = [userId];

    if (status) {
      query += ` AND status = $2`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      transactions: result.rows,
      total: result.rowCount
    });
  } catch (error) {
    logger.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get transaction by ID
export const getTransactionById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({ transaction: result.rows[0] });
  } catch (error) {
    logger.error('Get transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload payment proof
export const uploadPaymentProof = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { payment_proof_url } = req.body;

    const result = await pool.query(
      `UPDATE transactions
       SET payment_proof_url = $1, status = 'pending'
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [payment_proof_url, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({
      message: 'Payment proof uploaded successfully',
      transaction: result.rows[0]
    });
  } catch (error) {
    logger.error('Upload payment proof error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Get all transactions
export const getAllTransactions = async (req: Request, res: Response) => {
  try {
    const { status, limit = 20, offset = 0, search } = req.query;

    let query = `
      SELECT t.*, u.name as user_name, u.email as user_email
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND t.status = $${paramCount}`;
      params.push(status);
    }

    if (search) {
      paramCount++;
      query += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR t.transaction_code ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY t.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count with parameterized query to prevent SQL injection
    let countQuery = `SELECT COUNT(*) FROM transactions t JOIN users u ON t.user_id = u.id WHERE 1=1`;
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (status) {
      countQuery += ` AND t.status = $${countParamIndex++}`;
      countParams.push(status);
    }

    if (search) {
      countQuery += ` AND (u.name ILIKE $${countParamIndex} OR u.email ILIKE $${countParamIndex} OR t.transaction_code ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      transactions: result.rows,
      total: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    logger.error('Get all transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Update transaction status
export const updateTransactionStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updateData: any = { status };

    if (status === 'paid') {
      updateData.paid_at = new Date();

      // Get transaction details to create voucher
      const transactionResult = await pool.query(
        'SELECT * FROM transactions WHERE id = $1',
        [id]
      );

      if (transactionResult.rows.length > 0) {
        const transaction = transactionResult.rows[0];

        // Create voucher for the user
        const voucherCode = `${transaction.package_type.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Valid for 1 year

        await pool.query(
          `INSERT INTO vouchers (user_id, code, package_type, expires_at)
           VALUES ($1, $2, $3, $4)`,
          [transaction.user_id, voucherCode, transaction.package_type, expiresAt]
        );
      }
    }

    const fields = Object.keys(updateData).map((key, idx) => `${key} = $${idx + 2}`).join(', ');
    const values = Object.values(updateData);

    const result = await pool.query(
      `UPDATE transactions SET ${fields} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({
      message: 'Transaction updated successfully',
      transaction: result.rows[0]
    });
  } catch (error) {
    logger.error('Update transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get transaction statistics (admin)
export const getTransactionStats = async (req: Request, res: Response) => {
  try {
    const statsQuery = `
      SELECT
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_transactions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'paid' AND DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) as monthly_revenue
      FROM transactions
    `;

    const result = await pool.query(statsQuery);

    res.json({ stats: result.rows[0] });
  } catch (error) {
    logger.error('Get transaction stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
