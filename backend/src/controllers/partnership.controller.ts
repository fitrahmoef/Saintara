import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import pool from '../config/database';
import logger from '../config/logger';

/**
 * Get all partnership content (grouped by section)
 */
export const getPartnershipContent = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT id, section, title, content, image_url, sort_order
      FROM partnership_content
      WHERE is_active = true
      ORDER BY section ASC, sort_order ASC
    `);

    // Group by section
    const grouped: { [key: string]: any[] } = {};
    result.rows.forEach(item => {
      if (!grouped[item.section]) {
        grouped[item.section] = [];
      }
      grouped[item.section].push(item);
    });

    res.status(200).json({
      status: 'success',
      data: {
        content: result.rows,
        sections: grouped,
      },
    });
  } catch (error) {
    logger.error('Error fetching partnership content:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch partnership content',
    });
  }
};

/**
 * Get partnership content by section
 */
export const getPartnershipBySection = async (req: Request, res: Response) => {
  try {
    const { section } = req.params;

    const result = await pool.query(`
      SELECT id, section, title, content, image_url, sort_order
      FROM partnership_content
      WHERE section = $1 AND is_active = true
      ORDER BY sort_order ASC
    `, [section]);

    res.status(200).json({
      status: 'success',
      data: result.rows,
    });
  } catch (error) {
    logger.error('Error fetching partnership section:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch partnership section',
    });
  }
};

/**
 * Create partnership content (Admin only)
 */
export const createPartnershipContent = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array(),
      });
    }

    const { section, title, content, image_url, sort_order } = req.body;

    const result = await pool.query(`
      INSERT INTO partnership_content (section, title, content, image_url, sort_order)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [section, title, content, image_url || null, sort_order || 0]);

    logger.info(`Partnership content created: ${result.rows[0].id}`);

    res.status(201).json({
      status: 'success',
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error creating partnership content:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create partnership content',
    });
  }
};

/**
 * Update partnership content (Admin only)
 */
export const updatePartnershipContent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { section, title, content, image_url, sort_order, is_active } = req.body;

    const result = await pool.query(`
      UPDATE partnership_content
      SET
        section = COALESCE($1, section),
        title = COALESCE($2, title),
        content = COALESCE($3, content),
        image_url = COALESCE($4, image_url),
        sort_order = COALESCE($5, sort_order),
        is_active = COALESCE($6, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [section, title, content, image_url, sort_order, is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Partnership content not found',
      });
    }

    logger.info(`Partnership content updated: ${id}`);

    res.status(200).json({
      status: 'success',
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error updating partnership content:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update partnership content',
    });
  }
};

/**
 * Delete partnership content (Admin only)
 */
export const deletePartnershipContent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      DELETE FROM partnership_content WHERE id = $1 RETURNING id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Partnership content not found',
      });
    }

    logger.info(`Partnership content deleted: ${id}`);

    res.status(200).json({
      status: 'success',
      message: 'Partnership content deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting partnership content:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete partnership content',
    });
  }
};

/**
 * Get agent statistics (for partnership page)
 */
export const getAgentStatistics = async (req: Request, res: Response) => {
  try {
    const stats = await pool.query(`
      SELECT
        COUNT(*) as total_agents,
        SUM(total_sales) as total_revenue,
        SUM(total_commission) as total_commissions,
        AVG(commission_rate) as avg_commission_rate
      FROM agents
      WHERE status = 'active'
    `);

    const topAgents = await pool.query(`
      SELECT
        u.name,
        a.total_sales,
        a.total_commission
      FROM agents a
      INNER JOIN users u ON a.user_id = u.id
      WHERE a.status = 'active'
      ORDER BY a.total_sales DESC
      LIMIT 5
    `);

    res.status(200).json({
      status: 'success',
      data: {
        statistics: stats.rows[0],
        top_agents: topAgents.rows,
      },
    });
  } catch (error) {
    logger.error('Error fetching agent statistics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch agent statistics',
    });
  }
};

/**
 * Submit partnership application
 */
export const submitPartnershipApplication = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array(),
      });
    }

    const {
      name,
      email,
      phone,
      organization,
      message,
      experience,
      social_media,
    } = req.body;

    // Store in approvals table as 'partnership' type
    const result = await pool.query(`
      INSERT INTO approvals (
        type,
        reference_id,
        status,
        notes
      )
      VALUES (
        'partnership',
        0,
        'pending',
        $1
      )
      RETURNING id
    `, [JSON.stringify({
      name,
      email,
      phone,
      organization,
      message,
      experience,
      social_media,
      submitted_at: new Date().toISOString(),
    })]);

    logger.info(`Partnership application submitted: ${email}`);

    // TODO: Send email notification to admin

    res.status(201).json({
      status: 'success',
      message: 'Partnership application submitted successfully',
      data: {
        application_id: result.rows[0].id,
      },
    });
  } catch (error) {
    logger.error('Error submitting partnership application:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit partnership application',
    });
  }
};
