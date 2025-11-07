import { Request, Response } from 'express';
import pool from '../config/database';
import logger from '../config/logger';

// Get all approvals (admin)
export const getAllApprovals = async (req: Request, res: Response) => {
  try {
    const { type, status, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT a.*,
        u1.name as requester_name, u1.email as requester_email,
        u2.name as approver_name, u2.email as approver_email
      FROM approvals a
      LEFT JOIN users u1 ON a.requester_id = u1.id
      LEFT JOIN users u2 ON a.approver_id = u2.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 0;

    if (type) {
      paramCount++;
      query += ` AND a.type = $${paramCount}`;
      params.push(type);
    }

    if (status) {
      paramCount++;
      query += ` AND a.status = $${paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({ approvals: result.rows });
  } catch (error) {
    logger.error('Get all approvals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get approval by ID
export const getApprovalById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT a.*,
        u1.name as requester_name, u1.email as requester_email,
        u2.name as approver_name, u2.email as approver_email
       FROM approvals a
       LEFT JOIN users u1 ON a.requester_id = u1.id
       LEFT JOIN users u2 ON a.approver_id = u2.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Approval not found' });
    }

    res.json({ approval: result.rows[0] });
  } catch (error) {
    logger.error('Get approval error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create approval request
export const createApproval = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { type, reference_id, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO approvals (type, reference_id, requester_id, status, notes)
       VALUES ($1, $2, $3, 'pending', $4)
       RETURNING *`,
      [type, reference_id, userId, notes]
    );

    res.status(201).json({
      message: 'Approval request created successfully',
      approval: result.rows[0]
    });
  } catch (error) {
    logger.error('Create approval error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update approval status (admin)
export const updateApprovalStatus = async (req: Request, res: Response) => {
  try {
    const approverId = (req as any).user.userId;
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE approvals
       SET status = $1, approver_id = $2, notes = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [status, approverId, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Approval not found' });
    }

    const approval = result.rows[0];

    // Handle post-approval actions based on type
    if (status === 'approved') {
      if (approval.type === 'agent_commission') {
        // Mark commission as approved
        await pool.query(
          `UPDATE agent_sales SET status = 'approved' WHERE id = $1`,
          [approval.reference_id]
        );
      } else if (approval.type === 'event_invite') {
        // Handle event invitation approval
        // Could trigger email notification here
      }
    }

    res.json({
      message: `Approval ${status} successfully`,
      approval: result.rows[0]
    });
  } catch (error) {
    logger.error('Update approval error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get pending approvals count
export const getPendingApprovalsCount = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM approvals WHERE status = 'pending'`
    );

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    logger.error('Get pending count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's approval requests
export const getUserApprovals = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const result = await pool.query(
      `SELECT a.*,
        u.name as approver_name, u.email as approver_email
       FROM approvals a
       LEFT JOIN users u ON a.approver_id = u.id
       WHERE a.requester_id = $1
       ORDER BY a.created_at DESC`,
      [userId]
    );

    res.json({ approvals: result.rows });
  } catch (error) {
    logger.error('Get user approvals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete approval
export const deleteApproval = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM approvals WHERE id = $1 AND status = $2 RETURNING *',
      [id, 'pending']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Approval not found or already processed' });
    }

    res.json({ message: 'Approval deleted successfully' });
  } catch (error) {
    logger.error('Delete approval error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
