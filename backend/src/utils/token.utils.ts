/**
 * Token Utility Functions
 *
 * Provides secure token management for authentication:
 * - Access tokens (short-lived, 15 minutes)
 * - Refresh tokens (long-lived, 7 days)
 * - HttpOnly cookie management
 * - Token rotation and revocation
 */

import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { Response } from 'express'
import pool from '../config/database'
import logger from '../config/logger'

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '15m' // 15 minutes
const REFRESH_TOKEN_EXPIRY_DAYS = 7 // 7 days
const REFRESH_TOKEN_EXPIRY_MS = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000

interface TokenPayload {
  id: number
  email: string
  role: string
  institution_id?: number
  permissions?: string[]
}

interface RefreshTokenData {
  userId: number
  ipAddress?: string
  userAgent?: string
}

/**
 * Generate access token (JWT, short-lived)
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET!,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  )
}

/**
 * Generate refresh token (UUID, long-lived)
 */
export async function generateRefreshToken(data: RefreshTokenData): Promise<string> {
  const token = uuidv4()
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS)

  try {
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [data.userId, token, expiresAt, data.ipAddress, data.userAgent]
    )

    logger.info(`Refresh token created for user ${data.userId}`)
    return token
  } catch (error) {
    logger.error('Failed to create refresh token:', error)
    throw new Error('Failed to generate refresh token')
  }
}

/**
 * Verify and decode access token
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload
  } catch (error) {
    return null
  }
}

/**
 * Verify refresh token and get user ID
 */
export async function verifyRefreshToken(token: string): Promise<number | null> {
  try {
    const result = await pool.query(
      `SELECT user_id FROM refresh_tokens
       WHERE token = $1
       AND expires_at > NOW()
       AND is_revoked = FALSE`,
      [token]
    )

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0].user_id
  } catch (error) {
    logger.error('Failed to verify refresh token:', error)
    return null
  }
}

/**
 * Revoke a specific refresh token
 */
export async function revokeRefreshToken(token: string, reason?: string): Promise<void> {
  try {
    await pool.query(
      `UPDATE refresh_tokens
       SET is_revoked = TRUE, revoked_at = NOW(), revoked_reason = $2
       WHERE token = $1`,
      [token, reason || 'user_logout']
    )

    logger.info(`Refresh token revoked: ${reason || 'user_logout'}`)
  } catch (error) {
    logger.error('Failed to revoke refresh token:', error)
    throw new Error('Failed to revoke token')
  }
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeAllUserTokens(userId: number, reason?: string): Promise<void> {
  try {
    await pool.query(
      `UPDATE refresh_tokens
       SET is_revoked = TRUE, revoked_at = NOW(), revoked_reason = $2
       WHERE user_id = $1 AND is_revoked = FALSE`,
      [userId, reason || 'security_action']
    )

    logger.info(`All tokens revoked for user ${userId}: ${reason || 'security_action'}`)
  } catch (error) {
    logger.error('Failed to revoke user tokens:', error)
    throw new Error('Failed to revoke tokens')
  }
}

/**
 * Rotate refresh token (revoke old, create new)
 */
export async function rotateRefreshToken(
  oldToken: string,
  data: RefreshTokenData
): Promise<string> {
  try {
    // Revoke old token
    await revokeRefreshToken(oldToken, 'token_rotation')

    // Generate new token
    return await generateRefreshToken(data)
  } catch (error) {
    logger.error('Failed to rotate refresh token:', error)
    throw new Error('Failed to rotate token')
  }
}

/**
 * Set access token as httpOnly cookie
 */
export function setAccessTokenCookie(res: Response, token: string): void {
  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/',
  })
}

/**
 * Set refresh token as httpOnly cookie
 */
export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_EXPIRY_MS,
    path: '/api/auth', // Only send to auth endpoints
  })
}

/**
 * Clear authentication cookies
 */
export function clearAuthCookies(res: Response): void {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  })

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
  })
}

/**
 * Clean up expired refresh tokens (should be run periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const result = await pool.query(
      `DELETE FROM refresh_tokens
       WHERE expires_at < NOW() - INTERVAL '7 days'`
    )

    const deletedCount = result.rowCount || 0
    logger.info(`Cleaned up ${deletedCount} expired refresh tokens`)
    return deletedCount
  } catch (error) {
    logger.error('Failed to cleanup expired tokens:', error)
    return 0
  }
}
