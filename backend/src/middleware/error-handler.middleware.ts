/**
 * Global Error Handler Middleware
 *
 * Handles all errors in a centralized way with proper logging and response formatting
 */

import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'

export interface AppError extends Error {
  statusCode?: number
  isOperational?: boolean
  code?: string
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Set defaults
  err.statusCode = err.statusCode || 500
  err.message = err.message || 'Internal Server Error'

  // Log error with context
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  })

  // Handle specific error types

  // JWT Errors
  if (err instanceof TokenExpiredError) {
    res.status(401).json({
      status: 'error',
      error: 'TokenExpired',
      message: 'Your session has expired. Please login again.',
    })
    return
  }

  if (err instanceof JsonWebTokenError) {
    res.status(401).json({
      status: 'error',
      error: 'InvalidToken',
      message: 'Invalid authentication token.',
    })
    return
  }

  // PostgreSQL Database Errors
  if (err.code?.startsWith('23')) {
    // PostgreSQL integrity constraint violations
    if (err.code === '23505') {
      // Unique violation
      res.status(409).json({
        status: 'error',
        error: 'DuplicateEntry',
        message: 'A record with this value already exists.',
      })
      return
    }

    if (err.code === '23503') {
      // Foreign key violation
      res.status(400).json({
        status: 'error',
        error: 'InvalidReference',
        message: 'Referenced record does not exist.',
      })
      return
    }

    if (err.code === '23502') {
      // Not null violation
      res.status(400).json({
        status: 'error',
        error: 'MissingRequiredField',
        message: 'Required field is missing.',
      })
      return
    }
  }

  // Validation Errors (from express-validator)
  if (err.name === 'ValidationError') {
    res.status(400).json({
      status: 'error',
      error: 'ValidationError',
      message: err.message,
    })
    return
  }

  // Cast Errors (invalid data types)
  if (err.name === 'CastError') {
    res.status(400).json({
      status: 'error',
      error: 'InvalidDataType',
      message: 'Invalid data format provided.',
    })
    return
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    res.status(400).json({
      status: 'error',
      error: 'FileUploadError',
      message: err.message,
    })
    return
  }

  // Default error response
  const isDevelopment = process.env.NODE_ENV === 'development'

  res.status(err.statusCode).json({
    status: 'error',
    error: err.name || 'InternalServerError',
    message: isDevelopment ? err.message : 'An unexpected error occurred.',
    ...(isDevelopment && { stack: err.stack }),
  })
}

/**
 * Helper to create operational errors
 */
export class OperationalError extends Error {
  statusCode: number
  isOperational: boolean

  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new OperationalError(`Route not found: ${req.originalUrl}`, 404)
  next(error)
}
