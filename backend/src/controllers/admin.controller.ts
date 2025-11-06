import { Response } from 'express'
import logger from '../config/logger'
import pool from '../config/database'
import logger from '../config/logger'
import { AuthRequest } from '../middleware/auth.middleware'
import logger from '../config/logger'

// Get dashboard statistics
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Total tests this month
    const testsThisMonth = await pool.query(
      `SELECT COUNT(*) as count
       FROM tests
       WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`
    )

    // Active agents
    const activeAgents = await pool.query(
      `SELECT COUNT(*) as count
       FROM agents
       WHERE status = 'active'`
    )

    // Total users
    const totalUsers = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE role = $1',
      ['user']
    )

    // Completed tests
    const completedTests = await pool.query(
      'SELECT COUNT(*) as count FROM tests WHERE status = $1',
      ['completed']
    )

    // Tests by type distribution
    const testDistribution = await pool.query(
      `SELECT test_type, COUNT(*) as count
       FROM tests
       WHERE status = 'completed'
       GROUP BY test_type`
    )

    // Recent tests
    const recentTests = await pool.query(
      `SELECT t.id, t.test_type, t.completed_at, u.name as user_name, ct.name as character_type
       FROM tests t
       JOIN users u ON t.user_id = u.id
       LEFT JOIN test_results tr ON t.id = tr.test_id
       LEFT JOIN character_types ct ON tr.character_type_id = ct.id
       WHERE t.status = 'completed'
       ORDER BY t.completed_at DESC
       LIMIT 10`
    )

    // Monthly sales (mock data for now - would come from transactions table)
    const monthlySales = await pool.query(
      `SELECT
        COALESCE(SUM(amount), 0) as total
       FROM transactions
       WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
       AND status = 'paid'`
    )

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          tests_this_month: parseInt(testsThisMonth.rows[0].count),
          active_agents: parseInt(activeAgents.rows[0].count),
          total_users: parseInt(totalUsers.rows[0].count),
          completed_tests: parseInt(completedTests.rows[0].count),
          monthly_sales: parseFloat(monthlySales.rows[0].total) || 0,
        },
        test_distribution: testDistribution.rows,
        recent_tests: recentTests.rows,
      },
    })
  } catch (error) {
    logger.error('Get dashboard stats error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard statistics',
    })
  }
}

// Get all users (admin only)
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query

    const offset = (Number(page) - 1) * Number(limit)

    let query = `
      SELECT id, email, name, role, is_active, created_at,
      (SELECT COUNT(*) FROM tests WHERE user_id = users.id) as total_tests
      FROM users
    `
    let countQuery = 'SELECT COUNT(*) FROM users'
    const params: any[] = []

    if (search) {
      query += ' WHERE name ILIKE $1 OR email ILIKE $1'
      countQuery += ' WHERE name ILIKE $1 OR email ILIKE $1'
      params.push(`%${search}%`)
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(Number(limit), offset)

    const [users, total] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, search ? [`%${search}%`] : []),
    ])

    res.status(200).json({
      status: 'success',
      data: {
        users: users.rows,
        pagination: {
          total: parseInt(total.rows[0].count),
          page: Number(page),
          limit: Number(limit),
          total_pages: Math.ceil(parseInt(total.rows[0].count) / Number(limit)),
        },
      },
    })
  } catch (error) {
    logger.error('Get all users error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users',
    })
  }
}

// Get user details
export const getUserDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params

  try {
    const user = await pool.query(
      `SELECT
        u.id, u.email, u.name, u.role, u.phone, u.is_active, u.created_at,
        COUNT(DISTINCT t.id) as total_tests,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tests
      FROM users u
      LEFT JOIN tests t ON u.id = t.user_id
      WHERE u.id = $1
      GROUP BY u.id`,
      [id]
    )

    if (user.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      })
      return
    }

    // Get user's recent tests
    const recentTests = await pool.query(
      `SELECT t.id, t.test_type, t.status, t.created_at, t.completed_at,
       ct.name as character_type
       FROM tests t
       LEFT JOIN test_results tr ON t.id = tr.test_id
       LEFT JOIN character_types ct ON tr.character_type_id = ct.id
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC
       LIMIT 5`,
      [id]
    )

    res.status(200).json({
      status: 'success',
      data: {
        user: user.rows[0],
        recent_tests: recentTests.rows,
      },
    })
  } catch (error) {
    logger.error('Get user details error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user details',
    })
  }
}
