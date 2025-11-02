import { Request, Response } from 'express';
import pool from '../config/database';

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

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM articles WHERE 1=1`;
    if (category) countQuery += ` AND category = '${category}'`;
    if (is_published !== undefined) countQuery += ` AND is_published = ${is_published === 'true'}`;
    if (search) countQuery += ` AND (title ILIKE '%${search}%' OR content ILIKE '%${search}%')`;

    const countResult = await pool.query(countQuery);

    res.json({
      articles: result.rows,
      total: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get all articles error:', error);
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
    console.error('Get article error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create article (admin)
export const createArticle = async (req: Request, res: Response) => {
  try {
    const authorId = (req as any).user.userId;
    const { title, content, category, featured_image, is_published } = req.body;

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
    console.error('Create article error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update article (admin)
export const updateArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, category, featured_image, is_published } = req.body;

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
    console.error('Update article error:', error);
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
    console.error('Delete article error:', error);
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
    console.error('Get featured articles error:', error);
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
    console.error('Get articles by category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
