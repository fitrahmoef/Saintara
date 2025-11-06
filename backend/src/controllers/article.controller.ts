import { Request, Response } from 'express';
import logger from '../config/logger'
import pool from '../config/database';
import logger from '../config/logger'
import { sanitizeArticle } from '../utils/xss-sanitizer';
import logger from '../config/logger'

// Get all articles
export const getAllArticles = async (req: Request, res: Response) => {
  try {
    const { category, is_published, limit = 10, offset = 0, search } = req.query;

    let query = `
      SELECT a.*, u.name as author_name
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND a.category = $${paramCount}`;
      params.push(category);
    }

    if (is_published !== undefined) {
      paramCount++;
      query += ` AND a.is_published = $${paramCount}`;
      params.push(is_published === 'true');
    }

    if (search) {
      paramCount++;
      query += ` AND (a.title ILIKE $${paramCount} OR a.content ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count - FIXED: Use parameterized query to prevent SQL injection
    let countQuery = `SELECT COUNT(*) FROM articles WHERE 1=1`;
    const countParams: any[] = [];
    let countParamIndex = 0;

    if (category) {
      countParamIndex++;
      countQuery += ` AND category = $${countParamIndex}`;
      countParams.push(category);
    }

    if (is_published !== undefined) {
      countParamIndex++;
      countQuery += ` AND is_published = $${countParamIndex}`;
      countParams.push(is_published === 'true');
    }

    if (search) {
      countParamIndex++;
      countQuery += ` AND (title ILIKE $${countParamIndex} OR content ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      articles: result.rows,
      total: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    logger.error('Get all articles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get article by ID
export const getArticleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT a.*, u.name as author_name, u.avatar_url as author_avatar
       FROM articles a
       LEFT JOIN users u ON a.author_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Increment view count
    await pool.query(
      'UPDATE articles SET views = views + 1 WHERE id = $1',
      [id]
    );

    res.json({ article: result.rows[0] });
  } catch (error) {
    logger.error('Get article error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create article (admin)
export const createArticle = async (req: Request, res: Response) => {
  try {
    const authorId = (req as any).user.userId;
    let { title, content, category, featured_image, is_published } = req.body;

    // Sanitize user input to prevent XSS attacks
    const sanitized = sanitizeArticle({ title, content, category });
    title = sanitized.title;
    content = sanitized.content;
    category = sanitized.category;

    // Generate slug from title
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);

    const result = await pool.query(
      `INSERT INTO articles (title, slug, content, category, featured_image, author_id, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, slug, content, category, featured_image, authorId, is_published || false]
    );

    res.status(201).json({
      message: 'Article created successfully',
      article: result.rows[0]
    });
  } catch (error) {
    logger.error('Create article error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update article (admin)
export const updateArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let { title, content, category, featured_image, is_published } = req.body;

    // Sanitize user input to prevent XSS attacks
    if (title || content || category) {
      const sanitized = sanitizeArticle({ title, content, category });
      if (title) title = sanitized.title;
      if (content) content = sanitized.content;
      if (category) category = sanitized.category;
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (title) {
      paramCount++;
      updates.push(`title = $${paramCount}`);
      values.push(title);

      // Update slug if title changes
      const slug = title.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 100);
      paramCount++;
      updates.push(`slug = $${paramCount}`);
      values.push(slug);
    }

    if (content) {
      paramCount++;
      updates.push(`content = $${paramCount}`);
      values.push(content);
    }

    if (category) {
      paramCount++;
      updates.push(`category = $${paramCount}`);
      values.push(category);
    }

    if (featured_image) {
      paramCount++;
      updates.push(`featured_image = $${paramCount}`);
      values.push(featured_image);
    }

    if (is_published !== undefined) {
      paramCount++;
      updates.push(`is_published = $${paramCount}`);
      values.push(is_published);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No updates provided' });
    }

    const result = await pool.query(
      `UPDATE articles SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount + 1} RETURNING *`,
      [...values, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Article not found' });
    }

    res.json({
      message: 'Article updated successfully',
      article: result.rows[0]
    });
  } catch (error) {
    logger.error('Update article error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete article (admin)
export const deleteArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM articles WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Article not found' });
    }

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    logger.error('Delete article error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get featured articles
export const getFeaturedArticles = async (req: Request, res: Response) => {
  try {
    const { limit = 5 } = req.query;

    const result = await pool.query(
      `SELECT a.*, u.name as author_name
       FROM articles a
       LEFT JOIN users u ON a.author_id = u.id
       WHERE a.is_published = true
       ORDER BY a.views DESC, a.created_at DESC
       LIMIT $1`,
      [limit]
    );

    res.json({ articles: result.rows });
  } catch (error) {
    logger.error('Get featured articles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get articles by category
export const getArticlesByCategory = async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT a.*, u.name as author_name
       FROM articles a
       LEFT JOIN users u ON a.author_id = u.id
       WHERE a.category = $1 AND a.is_published = true
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [category, limit, offset]
    );

    res.json({ articles: result.rows });
  } catch (error) {
    logger.error('Get articles by category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
