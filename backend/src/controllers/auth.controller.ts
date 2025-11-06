import { Request, Response } from 'express'
import { validationResult } from 'express-validator'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import pool from '../config/database'
import { AuthRequest } from '../middleware/auth.middleware'
import { emailService } from '../services/email.service'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAuthCookies,
} from '../utils/token.utils'
import { generateCSRFToken } from '../middleware/csrf.middleware'
import logger from '../config/logger'

/**
 * Hash a token using SHA-256 for secure storage
 * Prevents password reset token theft in case of database breach
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

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
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user with email_verified = false
    const result = await pool.query(
      'INSERT INTO users (email, password, name, role, email_verified) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role, email_verified, created_at',
      [email, hashedPassword, name, 'user', false]
    )

    const user = result.rows[0]

    // Generate email verification token (32 bytes = 64 hex characters)
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 3600000) // 24 hours from now

    // Hash token before storing
    const hashedVerificationToken = hashToken(verificationToken)

    // Store email verification token
    try {
      await pool.query(
        `INSERT INTO email_verification_tokens (user_id, token, expires_at)
         VALUES ($1, $2, $3)`,
        [user.id, hashedVerificationToken, expiresAt]
      )
    } catch (tokenError) {
      // If table doesn't exist yet (migration not applied), log but continue
      logger.warn('Email verification token table may not exist yet:', tokenError)
    }

    // Send verification email (async, don't wait for it)
    emailService.sendVerificationEmail(user.email, verificationToken, user.name).catch(err => {
      logger.error('Failed to send verification email:', err)
      // SECURITY: Never log tokens - removed sensitive data logging
      logger.warn(`Verification email failed for user ${user.email}. Check email service configuration.`)
    })

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    })

    const refreshToken = await generateRefreshToken({
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    })

    // Generate CSRF token
    const csrfToken = generateCSRFToken()

    // Set httpOnly cookies
    setAccessTokenCookie(res, accessToken)
    setRefreshTokenCookie(res, refreshToken)

    logger.info(`User registered successfully: ${user.email}`)

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        csrfToken, // Send CSRF token to be stored in memory/localStorage (not sensitive)
      },
    })
  } catch (error) {
    logger.error('Register error:', error)
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
    // Find user with lockout and verification status
    const result = await pool.query(
      'SELECT id, email, password, name, role, institution_id, email_verified, login_attempts, locked_until FROM users WHERE email = $1',
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

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000)
      res.status(423).json({
        status: 'error',
        message: `Account locked due to multiple failed login attempts. Try again in ${remainingMinutes} minute(s).`,
      })
      return
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      // Increment failed login attempts
      const loginAttempts = (user.login_attempts || 0) + 1
      const maxAttempts = 5
      const lockDuration = 15 // minutes

      if (loginAttempts >= maxAttempts) {
        // Lock account for 15 minutes
        const lockedUntil = new Date(Date.now() + lockDuration * 60000)
        try {
          await pool.query(
            'UPDATE users SET login_attempts = $1, locked_until = $2 WHERE id = $3',
            [loginAttempts, lockedUntil, user.id]
          )
        } catch (updateError) {
          // If columns don't exist yet (migration not applied), just log
          logger.warn('Account lockout columns may not exist yet:', updateError)
        }

        logger.warn(`Account locked for user ${user.email} after ${loginAttempts} failed attempts`)

        res.status(423).json({
          status: 'error',
          message: `Account locked due to ${maxAttempts} failed login attempts. Try again in ${lockDuration} minutes.`,
        })
      } else {
        // Increment attempts but don't lock yet
        try {
          await pool.query(
            'UPDATE users SET login_attempts = $1 WHERE id = $2',
            [loginAttempts, user.id]
          )
        } catch (updateError) {
          logger.warn('Account lockout columns may not exist yet:', updateError)
        }

        const remainingAttempts = maxAttempts - loginAttempts

        res.status(401).json({
          status: 'error',
          message: 'Invalid credentials',
          remainingAttempts,
        })
      }
      return
    }

    // Reset login attempts on successful login
    try {
      await pool.query(
        'UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = $1',
        [user.id]
      )
    } catch (updateError) {
      logger.warn('Account lockout columns may not exist yet:', updateError)
    }

    // Get user permissions
    const { getUserPermissions } = await import('../utils/permission.utils')
    const permissions = await getUserPermissions(user.id)

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      institution_id: user.institution_id,
      permissions,
    })

    const refreshToken = await generateRefreshToken({
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    })

    // Generate CSRF token
    const csrfToken = generateCSRFToken()

    // Set httpOnly cookies
    setAccessTokenCookie(res, accessToken)
    setRefreshTokenCookie(res, refreshToken)

    logger.info(`User logged in successfully: ${user.email}`)

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          institution_id: user.institution_id,
        },
        permissions,
        csrfToken, // Send CSRF token to be stored in memory/localStorage (not sensitive)
      },
    })
  } catch (error) {
    logger.error('Login error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Login failed',
    })
  }
}

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, nickname, role, phone, gender, blood_type, country, city, avatar_url, created_at FROM users WHERE id = $1',
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
    logger.error('Get profile error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch profile',
    })
  }
}

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, nickname, phone, gender, blood_type, country, city, avatar_url } = req.body
    const userId = req.user!.id

    // Validate gender if provided
    if (gender && !['Laki-laki', 'Perempuan'].includes(gender)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid gender. Must be "Laki-laki" or "Perempuan"',
      })
      return
    }

    // Validate blood_type if provided
    const validBloodTypes = ['A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    if (blood_type && !validBloodTypes.includes(blood_type)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid blood type',
      })
      return
    }

    const updates: string[] = []
    const values: any[] = []
    let paramCount = 0

    if (name !== undefined) {
      paramCount++
      updates.push(`name = $${paramCount}`)
      values.push(name)
    }

    if (nickname !== undefined) {
      paramCount++
      updates.push(`nickname = $${paramCount}`)
      values.push(nickname)
    }

    if (phone !== undefined) {
      paramCount++
      updates.push(`phone = $${paramCount}`)
      values.push(phone)
    }

    if (gender !== undefined) {
      paramCount++
      updates.push(`gender = $${paramCount}`)
      values.push(gender)
    }

    if (blood_type !== undefined) {
      paramCount++
      updates.push(`blood_type = $${paramCount}`)
      values.push(blood_type)
    }

    if (country !== undefined) {
      paramCount++
      updates.push(`country = $${paramCount}`)
      values.push(country)
    }

    if (city !== undefined) {
      paramCount++
      updates.push(`city = $${paramCount}`)
      values.push(city)
    }

    if (avatar_url !== undefined) {
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
      `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount + 1} RETURNING id, email, name, nickname, role, phone, gender, blood_type, country, city, avatar_url`,
      [...values, userId]
    )

    res.status(200).json({
      status: 'success',
      data: {
        user: result.rows[0],
      },
    })
  } catch (error) {
    logger.error('Update profile error:', error)
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
    const hashedPassword = await bcrypt.hash(new_password, 12)

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
    logger.error('Change password error:', error)
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

    // Generate cryptographically secure reset token (32 bytes = 64 hex characters)
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 3600000) // 1 hour from now

    // Hash token before storing (security: prevents token theft from DB breach)
    const hashedToken = hashToken(resetToken)

    // Store hashed reset token
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3, created_at = CURRENT_TIMESTAMP`,
      [user.id, hashedToken, expiresAt]
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
      logger.error(`Failed to send password reset email to ${email}`)
      // SECURITY: Never log tokens - removed sensitive data logging
      logger.warn('Password reset email failed. Check email service configuration.')
    }

    res.status(200).json({
      status: 'success',
      message: 'If the email exists, a password reset link has been sent',
      // Include token in dev mode only
      ...(process.env.NODE_ENV === 'development' && { devToken: resetToken }),
    })
  } catch (error) {
    logger.error('Request password reset error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to process request',
    })
  }
}

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, new_password } = req.body

    // Hash the provided token to compare with stored hash
    const hashedToken = hashToken(token)

    // Find valid reset token using hashed comparison
    const tokenResult = await pool.query(
      'SELECT user_id FROM password_reset_tokens WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP',
      [hashedToken]
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
    const hashedPassword = await bcrypt.hash(new_password, 12)

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
    logger.error('Reset password error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to reset password',
    })
  }
}

/**
 * Logout - Revoke refresh token and clear cookies
 */
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken

    if (refreshToken) {
      // Revoke refresh token in database
      await revokeRefreshToken(refreshToken, 'user_logout')
    }

    // Clear cookies
    clearAuthCookies(res)

    logger.info(`User logged out successfully: ${req.user?.email || 'unknown'}`)

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    })
  } catch (error) {
    logger.error('Logout error:', error)
    // Still clear cookies even if database operation fails
    clearAuthCookies(res)
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    })
  }
}

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken

    if (!refreshToken) {
      res.status(401).json({
        status: 'error',
        message: 'Refresh token required',
      })
      return
    }

    // Verify refresh token and get user ID
    const userId = await verifyRefreshToken(refreshToken)

    if (!userId) {
      clearAuthCookies(res)
      res.status(403).json({
        status: 'error',
        message: 'Invalid or expired refresh token',
      })
      return
    }

    // Get user data
    const userResult = await pool.query(
      'SELECT id, email, name, role, institution_id FROM users WHERE id = $1',
      [userId]
    )

    if (userResult.rows.length === 0) {
      clearAuthCookies(res)
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      })
      return
    }

    const user = userResult.rows[0]

    // Get user permissions
    const { getUserPermissions } = await import('../utils/permission.utils')
    const permissions = await getUserPermissions(user.id)

    // Generate new access token
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      institution_id: user.institution_id,
      permissions,
    })

    // Set new access token cookie
    setAccessTokenCookie(res, accessToken)

    logger.info(`Access token refreshed for user: ${user.email}`)

    res.status(200).json({
      status: 'success',
      message: 'Access token refreshed',
    })
  } catch (error) {
    logger.error('Refresh token error:', error)
    clearAuthCookies(res)
    res.status(500).json({
      status: 'error',
      message: 'Failed to refresh token',
    })
  }
}

/**
 * Get CSRF token
 */
export const getCSRFToken = (req: Request, res: Response): void => {
  const csrfToken = generateCSRFToken()

  res.status(200).json({
    status: 'success',
    data: {
      csrfToken,
    },
  })
}

/**
 * Revoke all user sessions (security feature)
 */
export const revokeAllSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id

    // Revoke all refresh tokens
    await revokeAllUserTokens(userId, 'user_requested_revocation')

    // Clear cookies
    clearAuthCookies(res)

    logger.info(`All sessions revoked for user: ${req.user!.email}`)

    res.status(200).json({
      status: 'success',
      message: 'All sessions revoked successfully',
    })
  } catch (error) {
    logger.error('Revoke all sessions error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to revoke sessions',
    })
  }
}

/**
 * Verify email address
 */
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body

    if (!token) {
      res.status(400).json({
        status: 'error',
        message: 'Verification token required',
      })
      return
    }

    // Hash the provided token to compare with stored hash
    const hashedToken = hashToken(token)

    // Find valid verification token
    const tokenResult = await pool.query(
      'SELECT user_id FROM email_verification_tokens WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP',
      [hashedToken]
    )

    if (tokenResult.rows.length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid or expired verification token',
      })
      return
    }

    const userId = tokenResult.rows[0].user_id

    // Update user email_verified status
    await pool.query(
      'UPDATE users SET email_verified = true, email_verified_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    )

    // Delete used verification token
    await pool.query(
      'DELETE FROM email_verification_tokens WHERE user_id = $1',
      [userId]
    )

    logger.info(`Email verified for user ID: ${userId}`)

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully',
    })
  } catch (error) {
    logger.error('Email verification error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify email',
    })
  }
}

/**
 * Resend verification email
 */
export const resendVerification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id

    // Check if already verified
    const userResult = await pool.query(
      'SELECT email, name, email_verified FROM users WHERE id = $1',
      [userId]
    )

    if (userResult.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      })
      return
    }

    const user = userResult.rows[0]

    if (user.email_verified) {
      res.status(400).json({
        status: 'error',
        message: 'Email already verified',
      })
      return
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 3600000) // 24 hours

    // Hash token before storing
    const hashedToken = hashToken(verificationToken)

    // Update or insert verification token
    await pool.query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3, created_at = CURRENT_TIMESTAMP`,
      [userId, hashedToken, expiresAt]
    )

    // Send verification email
    const emailSent = await emailService.sendVerificationEmail(user.email, verificationToken, user.name)

    if (!emailSent.success) {
      logger.error(`Failed to send verification email to ${user.email}`)
      // SECURITY: Never log tokens - removed sensitive data logging
      logger.warn('Verification email failed. Check email service configuration.')
    }

    logger.info(`Verification email resent to: ${user.email}`)

    res.status(200).json({
      status: 'success',
      message: 'Verification email sent',
      // Include token in dev mode only
      ...(process.env.NODE_ENV === 'development' && { devToken: verificationToken }),
    })
  } catch (error) {
    logger.error('Resend verification error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to resend verification email',
    })
  }
}
