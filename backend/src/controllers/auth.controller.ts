import { Request, Response } from 'express'
import { validationResult } from 'express-validator'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../config/database'
import { AuthRequest } from '../middleware/auth.middleware'

export const register = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({
      status: 'error',
      errors: errors.array(),
    })
    return
  }

  const { email, password, name } = req.body

  try {
    // Check if user already exists
    const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email])

    if (userExists.rows.length > 0) {
      res.status(400).json({
        status: 'error',
        message: 'User already exists',
      })
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at',
      [email, hashedPassword, name, 'user']
    )

    const user = result.rows[0]

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      },
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Registration failed',
    })
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({
      status: 'error',
      errors: errors.array(),
    })
    return
  }

  const { email, password } = req.body

  try {
    // Find user
    const result = await pool.query(
      'SELECT id, email, password, name, role FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      })
      return
    }

    const user = result.rows[0]

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      })
      return
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Login failed',
    })
  }
}

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
      [req.user!.id]
    )

    if (result.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      })
      return
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: result.rows[0],
      },
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch profile',
    })
  }
}
