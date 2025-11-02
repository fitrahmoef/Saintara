import { Request, Response } from 'express'
import { validationResult } from 'express-validator'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../config/database'
import { AuthRequest } from '../middleware/auth.middleware'
import { emailService } from '../services/email.service'

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

    // Send welcome email (async, don't wait for it)
    emailService.sendWelcomeEmail(user.email, user.name).catch(err =>
      console.error('Failed to send welcome email:', err)
    )

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
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
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
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
      'SELECT id, email, name, role, phone, avatar_url, created_at FROM users WHERE id = $1',
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

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone, avatar_url } = req.body
    const userId = req.user!.id

    const updates: string[] = []
    const values: any[] = []
    let paramCount = 0

    if (name) {
      paramCount++
      updates.push(`name = $${paramCount}`)
      values.push(name)
    }

    if (phone) {
      paramCount++
      updates.push(`phone = $${paramCount}`)
      values.push(phone)
    }

    if (avatar_url) {
      paramCount++
      updates.push(`avatar_url = $${paramCount}`)
      values.push(avatar_url)
    }

    if (updates.length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'No updates provided',
      })
      return
    }

    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount + 1} RETURNING id, email, name, role, phone, avatar_url`,
      [...values, userId]
    )

    res.status(200).json({
      status: 'success',
      data: {
        user: result.rows[0],
      },
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile',
    })
  }
}

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { current_password, new_password } = req.body
    const userId = req.user!.id

    // Get current password hash
    const userResult = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    )

    if (userResult.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      })
      return
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(current_password, userResult.rows[0].password)

    if (!isPasswordValid) {
      res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect',
      })
      return
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10)

    // Update password
    await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, userId]
    )

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully',
    })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to change password',
    })
  }
}

export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body

    // Check if user exists
    const userResult = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email]
    )

    // Always return success to prevent email enumeration
    if (userResult.rows.length === 0) {
      res.status(200).json({
        status: 'success',
        message: 'If the email exists, a password reset link has been sent',
      })
      return
    }

    const user = userResult.rows[0]

    // Generate reset token
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const expiresAt = new Date(Date.now() + 3600000) // 1 hour from now

    // Store reset token
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3, created_at = CURRENT_TIMESTAMP`,
      [user.id, resetToken, expiresAt]
    )

    // Get user name for email
    const userWithName = await pool.query(
      'SELECT name FROM users WHERE id = $1',
      [user.id]
    )

    // Send password reset email
    const emailSent = await emailService.sendPasswordResetEmail(
      email,
      resetToken,
      userWithName.rows[0]?.name || 'User'
    )

    if (!emailSent) {
      console.error(`Failed to send password reset email to ${email}`)
      // Log token for development if email fails
      console.log(`Password reset token for ${email}: ${resetToken}`)
    }

    res.status(200).json({
      status: 'success',
      message: 'If the email exists, a password reset link has been sent',
      // Include token in dev mode only
      ...(process.env.NODE_ENV === 'development' && { devToken: resetToken }),
    })
  } catch (error) {
    console.error('Request password reset error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to process request',
    })
  }
}

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, new_password } = req.body

    // Find valid reset token
    const tokenResult = await pool.query(
      'SELECT user_id FROM password_reset_tokens WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP',
      [token]
    )

    if (tokenResult.rows.length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token',
      })
      return
    }

    const userId = tokenResult.rows[0].user_id

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10)

    // Update password
    await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, userId]
    )

    // Delete used reset token
    await pool.query(
      'DELETE FROM password_reset_tokens WHERE user_id = $1',
      [userId]
    )

    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to reset password',
    })
  }
}
