import { Request, Response } from 'express';
import pool from '../config/database';
import logger from '../config/logger';

/**
 * Get all product types
 */
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        id, code, name, description, target_audience,
        price_individual, price_bulk, min_bulk_quantity,
        features, is_active, sort_order
      FROM product_types
      WHERE is_active = true
      ORDER BY sort_order ASC
    `);

    res.status(200).json({
      status: 'success',
      data: result.rows,
    });
  } catch (error) {
    logger.error('Error fetching products:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch products',
    });
  }
};

/**
 * Get product by code
 */
export const getProductByCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const productResult = await pool.query(`
      SELECT
        id, code, name, description, target_audience,
        price_individual, price_bulk, min_bulk_quantity,
        features, is_active, sort_order
      FROM product_types
      WHERE code = $1 AND is_active = true
    `, [code]);

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found',
      });
    }

    const product = productResult.rows[0];

    // Get attributes for this product
    const attributesResult = await pool.query(`
      SELECT
        pa.id, pa.code, pa.name, pa.description,
        pa.category, pa.is_core,
        pf.name as framework_name,
        pf.code as framework_code
      FROM personality_attributes pa
      LEFT JOIN personality_frameworks pf ON pa.framework_id = pf.id
      WHERE $1 = ANY(pa.product_types)
      ORDER BY pa.sort_order ASC
    `, [code]);

    // Get frameworks for this product
    const frameworksResult = await pool.query(`
      SELECT DISTINCT
        pf.id, pf.code, pf.name, pf.description, pf.category
      FROM personality_frameworks pf
      INNER JOIN personality_attributes pa ON pf.id = pa.framework_id
      WHERE $1 = ANY(pa.product_types)
      ORDER BY pf.sort_order ASC
    `, [code]);

    res.status(200).json({
      status: 'success',
      data: {
        ...product,
        attributes: attributesResult.rows,
        frameworks: frameworksResult.rows,
      },
    });
  } catch (error) {
    logger.error('Error fetching product:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch product',
    });
  }
};

/**
 * Get all frameworks
 */
export const getAllFrameworks = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT id, code, name, description, category, icon, sort_order
      FROM personality_frameworks
      ORDER BY sort_order ASC
    `);

    res.status(200).json({
      status: 'success',
      data: result.rows,
    });
  } catch (error) {
    logger.error('Error fetching frameworks:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch frameworks',
    });
  }
};

/**
 * Get all attributes
 */
export const getAllAttributes = async (req: Request, res: Response) => {
  try {
    const { framework_code, product_code } = req.query;

    let query = `
      SELECT
        pa.id, pa.code, pa.name, pa.description,
        pa.category, pa.product_types, pa.is_core, pa.sort_order,
        pf.name as framework_name,
        pf.code as framework_code
      FROM personality_attributes pa
      LEFT JOIN personality_frameworks pf ON pa.framework_id = pf.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (framework_code) {
      params.push(framework_code);
      query += ` AND pf.code = $${params.length}`;
    }

    if (product_code) {
      params.push(product_code);
      query += ` AND $${params.length} = ANY(pa.product_types)`;
    }

    query += ` ORDER BY pa.sort_order ASC`;

    const result = await pool.query(query, params);

    res.status(200).json({
      status: 'success',
      data: result.rows,
    });
  } catch (error) {
    logger.error('Error fetching attributes:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch attributes',
    });
  }
};

/**
 * Get product comparison
 */
export const getProductComparison = async (req: Request, res: Response) => {
  try {
    const productsResult = await pool.query(`
      SELECT
        id, code, name, description, target_audience,
        price_individual, price_bulk, min_bulk_quantity,
        features, sort_order
      FROM product_types
      WHERE is_active = true
      ORDER BY sort_order ASC
    `);

    // Get attribute counts per product
    const attributeCountsResult = await pool.query(`
      SELECT
        unnest(product_types) as product_code,
        COUNT(*) as attribute_count
      FROM personality_attributes
      GROUP BY product_code
    `);

    const attributeCounts: { [key: string]: number } = {};
    attributeCountsResult.rows.forEach(row => {
      attributeCounts[row.product_code] = parseInt(row.attribute_count);
    });

    const comparison = productsResult.rows.map(product => ({
      ...product,
      attribute_count: attributeCounts[product.code] || 0,
    }));

    res.status(200).json({
      status: 'success',
      data: comparison,
    });
  } catch (error) {
    logger.error('Error fetching product comparison:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch product comparison',
    });
  }
};
