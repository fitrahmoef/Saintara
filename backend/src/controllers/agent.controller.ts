import { Request, Response } from 'express';
import logger from '../config/logger'
import pool from '../config/database';
import logger from '../config/logger'

// Get all agents (admin)
export const getAllAgents = async (req: Request, res: Response) => {
  try {
    const { status, limit = 20, offset = 0, search } = req.query;

    let query = `
      SELECT a.*, u.name, u.email, u.phone
      FROM agents a
      JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND a.status = $${paramCount}`;
      params.push(status);
    }

    if (search) {
      paramCount++;
      query += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR a.agent_code ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({ agents: result.rows });
  } catch (error) {
    logger.error('Get all agents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new agent
export const createAgent = async (req: Request, res: Response) => {
  try {
    const { user_id, commission_rate } = req.body;

    // Check if user exists
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [user_id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already an agent
    const agentCheck = await pool.query(
      'SELECT * FROM agents WHERE user_id = $1',
      [user_id]
    );

    if (agentCheck.rows.length > 0) {
      return res.status(400).json({ message: 'User is already an agent' });
    }

    // Generate agent code
    const agent_code = `AGT-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    const result = await pool.query(
      `INSERT INTO agents (user_id, agent_code, commission_rate, status)
       VALUES ($1, $2, $3, 'active')
       RETURNING *`,
      [user_id, agent_code, commission_rate || 10.00]
    );

    // Update user role to agent
    await pool.query(
      `UPDATE users SET role = 'agent' WHERE id = $1`,
      [user_id]
    );

    res.status(201).json({
      message: 'Agent created successfully',
      agent: result.rows[0]
    });
  } catch (error) {
    logger.error('Create agent error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get agent by ID
export const getAgentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT a.*, u.name, u.email, u.phone, u.avatar_url
       FROM agents a
       JOIN users u ON a.user_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    // Get agent sales
    const salesResult = await pool.query(
      `SELECT s.*, t.transaction_code, t.amount, t.created_at as transaction_date
       FROM agent_sales s
       JOIN transactions t ON s.transaction_id = t.id
       WHERE s.agent_id = $1
       ORDER BY s.created_at DESC`,
      [id]
    );

    res.json({
      agent: result.rows[0],
      sales: salesResult.rows
    });
  } catch (error) {
    logger.error('Get agent error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update agent status
export const updateAgentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, commission_rate } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (status) {
      updates.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (commission_rate !== undefined) {
      updates.push(`commission_rate = $${paramCount}`);
      values.push(commission_rate);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No updates provided' });
    }

    const result = await pool.query(
      `UPDATE agents SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      [...values, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.json({
      message: 'Agent updated successfully',
      agent: result.rows[0]
    });
  } catch (error) {
    logger.error('Update agent error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get agent sales statistics
export const getAgentStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const statsQuery = `
      SELECT
        COUNT(*) as total_sales,
        COALESCE(SUM(commission_amount), 0) as total_commission,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_commissions,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END), 0) as total_paid
      FROM agent_sales
      WHERE agent_id = $1
    `;

    const result = await pool.query(statsQuery, [id]);

    res.json({ stats: result.rows[0] });
  } catch (error) {
    logger.error('Get agent stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Record agent sale
export const recordAgentSale = async (req: Request, res: Response) => {
  try {
    const { agent_code, transaction_id } = req.body;

    // Get agent details
    const agentResult = await pool.query(
      'SELECT * FROM agents WHERE agent_code = $1 AND status = $2',
      [agent_code, 'active']
    );

    if (agentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Agent not found or inactive' });
    }

    const agent = agentResult.rows[0];

    // Get transaction details
    const transactionResult = await pool.query(
      'SELECT * FROM transactions WHERE id = $1',
      [transaction_id]
    );

    if (transactionResult.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const transaction = transactionResult.rows[0];
    const commission_amount = (parseFloat(transaction.amount) * parseFloat(agent.commission_rate)) / 100;

    // Record sale
    const result = await pool.query(
      `INSERT INTO agent_sales (agent_id, transaction_id, commission_amount, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [agent.id, transaction_id, commission_amount]
    );

    // Update agent totals
    await pool.query(
      `UPDATE agents
       SET total_sales = total_sales + $1,
           total_commission = total_commission + $2
       WHERE id = $3`,
      [transaction.amount, commission_amount, agent.id]
    );

    res.status(201).json({
      message: 'Sale recorded successfully',
      sale: result.rows[0]
    });
  } catch (error) {
    logger.error('Record agent sale error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Pay agent commission
export const payAgentCommission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE agent_sales
       SET status = 'paid', paid_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    res.json({
      message: 'Commission paid successfully',
      sale: result.rows[0]
    });
  } catch (error) {
    logger.error('Pay commission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
