import { Response } from 'express'
import pool from '../config/database'
import { AuthRequest } from '../middleware/auth.middleware'

// Get all user results
export const getUserResults = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id

  try {
    const result = await pool.query(
      `SELECT
        tr.id,
        tr.created_at,
        ct.name as character_type_name,
        ct.code as character_type_code,
        ct.description,
        tr.strengths,
        tr.challenges,
        tr.career_recommendations,
        t.test_type
      FROM test_results tr
      JOIN character_types ct ON tr.character_type_id = ct.id
      JOIN tests t ON tr.test_id = t.id
      WHERE tr.user_id = $1
      ORDER BY tr.created_at DESC`,
      [userId]
    )

    res.status(200).json({
      status: 'success',
      data: {
        results: result.rows,
      },
    })
  } catch (error) {
    console.error('Get results error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch results',
    })
  }
}

// Get specific result details
export const getResultById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params
  const userId = req.user!.id

  try {
    const result = await pool.query(
      `SELECT
        tr.*,
        ct.name as character_type_name,
        ct.code as character_type_code,
        ct.description as character_description,
        ct.communication_style,
        t.test_type,
        t.completed_at,
        u.name as user_name,
        u.email as user_email
      FROM test_results tr
      JOIN character_types ct ON tr.character_type_id = ct.id
      JOIN tests t ON tr.test_id = t.id
      JOIN users u ON tr.user_id = u.id
      WHERE tr.id = $1 AND tr.user_id = $2`,
      [id, userId]
    )

    if (result.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'Result not found',
      })
      return
    }

    res.status(200).json({
      status: 'success',
      data: {
        result: result.rows[0],
      },
    })
  } catch (error) {
    console.error('Get result error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch result',
    })
  }
}

// Get latest result for dashboard
export const getLatestResult = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id

  try {
    const result = await pool.query(
      `SELECT
        tr.id,
        tr.created_at,
        ct.name as character_type_name,
        ct.code as character_type_code,
        ct.description,
        tr.strengths,
        tr.challenges,
        tr.career_recommendations,
        ct.communication_style,
        t.test_type
      FROM test_results tr
      JOIN character_types ct ON tr.character_type_id = ct.id
      JOIN tests t ON tr.test_id = t.id
      WHERE tr.user_id = $1
      ORDER BY tr.created_at DESC
      LIMIT 1`,
      [userId]
    )

    if (result.rows.length === 0) {
      res.status(200).json({
        status: 'success',
        data: {
          result: null,
        },
      })
      return
    }

    res.status(200).json({
      status: 'success',
      data: {
        result: result.rows[0],
      },
    })
  } catch (error) {
    console.error('Get latest result error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch latest result',
    })
  }
}
