import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import pool from '../config/database';
import logger from '../config/logger';

/**
 * Get all FAQs (with optional filtering)
 */
export const getAllFAQs = async (req: Request, res: Response) => {
  try {
    const { category, product_type_code } = req.query;

    let query = `
      SELECT id, category, product_type_code, question, answer, sort_order, views
      FROM faqs
      WHERE is_active = true
    `;

    const params: any[] = [];

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    if (product_type_code) {
      params.push(product_type_code);
      query += ` AND (product_type_code = $${params.length} OR product_type_code IS NULL)`;
    }

    query += ` ORDER BY category ASC, sort_order ASC`;

    const result = await pool.query(query, params);

    // Group by category
    const grouped: { [key: string]: any[] } = {};
    result.rows.forEach(faq => {
      if (!grouped[faq.category]) {
        grouped[faq.category] = [];
      }
      grouped[faq.category].push(faq);
    });

    res.status(200).json({
      status: 'success',
      data: {
        faqs: result.rows,
        grouped,
      },
    });
  } catch (error) {
    logger.error('Error fetching FAQs:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch FAQs',
    });
  }
};

/**
 * Get FAQ by ID
 */
export const getFAQById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT id, category, product_type_code, question, answer, sort_order, views
      FROM faqs
      WHERE id = $1 AND is_active = true
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'FAQ not found',
      });
    }

    // Increment views
    await pool.query(`
      UPDATE faqs SET views = views + 1 WHERE id = $1
    `, [id]);

    res.status(200).json({
      status: 'success',
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error fetching FAQ:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch FAQ',
    });
  }
};

/**
 * Create new FAQ (Admin only)
 */
export const createFAQ = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array(),
      });
    }

    const { category, product_type_code, question, answer, sort_order } = req.body;

    const result = await pool.query(`
      INSERT INTO faqs (category, product_type_code, question, answer, sort_order)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [category, product_type_code || null, question, answer, sort_order || 0]);

    logger.info(`FAQ created: ${result.rows[0].id}`);

    res.status(201).json({
      status: 'success',
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error creating FAQ:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create FAQ',
    });
  }
};

/**
 * Update FAQ (Admin only)
 */
export const updateFAQ = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { category, product_type_code, question, answer, sort_order, is_active } = req.body;

    const result = await pool.query(`
      UPDATE faqs
      SET
        category = COALESCE($1, category),
        product_type_code = COALESCE($2, product_type_code),
        question = COALESCE($3, question),
        answer = COALESCE($4, answer),
        sort_order = COALESCE($5, sort_order),
        is_active = COALESCE($6, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [category, product_type_code, question, answer, sort_order, is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'FAQ not found',
      });
    }

    logger.info(`FAQ updated: ${id}`);

    res.status(200).json({
      status: 'success',
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error updating FAQ:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update FAQ',
    });
  }
};

/**
 * Delete FAQ (Admin only)
 */
export const deleteFAQ = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      DELETE FROM faqs WHERE id = $1 RETURNING id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'FAQ not found',
      });
    }

    logger.info(`FAQ deleted: ${id}`);

    res.status(200).json({
      status: 'success',
      message: 'FAQ deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting FAQ:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete FAQ',
    });
  }
};

/**
 * Get FAQ categories
 */
export const getFAQCategories = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT category, COUNT(*) as count
      FROM faqs
      WHERE is_active = true
      GROUP BY category
      ORDER BY category ASC
    `);

    res.status(200).json({
      status: 'success',
      data: result.rows,
    });
  } catch (error) {
    logger.error('Error fetching FAQ categories:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch FAQ categories',
    });
  }
};
