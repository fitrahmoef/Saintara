import { Response } from 'express'
import pool from '../config/database'
import { AuthRequest } from '../middleware/auth.middleware'

// Get all test questions
export const getTestQuestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT id, question_text, category, question_order FROM test_questions WHERE is_active = true ORDER BY question_order ASC'
    )

    res.status(200).json({
      status: 'success',
      data: {
        questions: result.rows,
      },
    })
  } catch (error) {
    console.error('Get questions error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch questions',
    })
  }
}

// Create a new test for user
export const createTest = async (req: AuthRequest, res: Response): Promise<void> => {
  const { test_type = 'personal' } = req.body
  const userId = req.user!.id

  try {
    const result = await pool.query(
      'INSERT INTO tests (user_id, test_type, status, started_at) VALUES ($1, $2, $3, NOW()) RETURNING id, user_id, test_type, status, started_at',
      [userId, test_type, 'in_progress']
    )

    res.status(201).json({
      status: 'success',
      data: {
        test: result.rows[0],
      },
    })
  } catch (error) {
    console.error('Create test error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to create test',
    })
  }
}

// Submit test answers and calculate results
export const submitTest = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params
  const { answers } = req.body // Array of { question_id, answer_value }
  const userId = req.user!.id

  try {
    // Verify test belongs to user
    const testCheck = await pool.query(
      'SELECT id, user_id, status FROM tests WHERE id = $1 AND user_id = $2',
      [id, userId]
    )

    if (testCheck.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'Test not found',
      })
      return
    }

    if (testCheck.rows[0].status === 'completed') {
      res.status(400).json({
        status: 'error',
        message: 'Test already completed',
      })
      return
    }

    // Save answers
    for (const answer of answers) {
      await pool.query(
        'INSERT INTO test_answers (test_id, question_id, answer_value) VALUES ($1, $2, $3)',
        [id, answer.question_id, answer.answer_value]
      )
    }

    // Calculate results
    const characterType = await calculateCharacterType(answers)

    // Create result
    const resultData = await pool.query(
      `INSERT INTO test_results
      (test_id, user_id, character_type_id, personality_traits, strengths, challenges, career_recommendations)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      [
        id,
        userId,
        characterType.id,
        JSON.stringify(characterType.traits),
        characterType.strengths,
        characterType.challenges,
        characterType.career_paths,
      ]
    )

    // Update test status
    await pool.query(
      'UPDATE tests SET status = $1, completed_at = NOW() WHERE id = $2',
      ['completed', id]
    )

    res.status(200).json({
      status: 'success',
      data: {
        result_id: resultData.rows[0].id,
        character_type: characterType.name,
        message: 'Test completed successfully',
      },
    })
  } catch (error) {
    console.error('Submit test error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit test',
    })
  }
}

// Get user's tests
export const getUserTests = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id

  try {
    const result = await pool.query(
      `SELECT t.id, t.test_type, t.status, t.started_at, t.completed_at,
       ct.name as character_type_name, ct.code as character_type_code
       FROM tests t
       LEFT JOIN test_results tr ON t.id = tr.test_id
       LEFT JOIN character_types ct ON tr.character_type_id = ct.id
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC`,
      [userId]
    )

    res.status(200).json({
      status: 'success',
      data: {
        tests: result.rows,
      },
    })
  } catch (error) {
    console.error('Get user tests error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch tests',
    })
  }
}

// Helper function to calculate character type based on answers
async function calculateCharacterType(answers: any[]) {
  // Simple calculation: average of all answers
  const total = answers.reduce((sum, a) => sum + a.answer_value, 0)
  const average = total / answers.length

  // Map average to character type (simplified logic)
  // In production, this would be more sophisticated
  let characterTypeCode = 'PI' // Default

  if (average >= 4.5) {
    characterTypeCode = 'PE' // Pemikir Extrovert
  } else if (average >= 4.0) {
    characterTypeCode = 'PI' // Pemikir Introvert
  } else if (average >= 3.5) {
    characterTypeCode = 'OE' // Pengamat Extrovert
  } else if (average >= 3.0) {
    characterTypeCode = 'OI' // Pengamat Introvert
  } else if (average >= 2.5) {
    characterTypeCode = 'FE' // Perasa Extrovert
  } else if (average >= 2.0) {
    characterTypeCode = 'FI' // Perasa Introvert
  } else {
    characterTypeCode = 'DI' // Pemimpi Introvert
  }

  // Get character type from database
  const result = await pool.query(
    'SELECT * FROM character_types WHERE code = $1',
    [characterTypeCode]
  )

  if (result.rows.length === 0) {
    // Fallback to first character type
    const fallback = await pool.query('SELECT * FROM character_types LIMIT 1')
    return {
      ...fallback.rows[0],
      traits: { average_score: average },
    }
  }

  return {
    ...result.rows[0],
    traits: { average_score: average },
  }
}
