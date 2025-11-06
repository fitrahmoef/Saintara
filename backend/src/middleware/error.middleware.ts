/**
 * Centralized Error Handling Middleware
 * 
 * Handles all errors in a consistent way:
 * - Logs errors appropriately
 * - Returns standardized error responses
 * - Hides sensitive information in production
 * - Handles both operational and programming errors
 */

import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../utils/errors'
import logger from '../config/logger'

interface ErrorResponse {
  status: 'error'
  code?: string
  message: string
  errors?: Array<{ field: string; message: string }>
  stack?: string
}

/**
 * Convert errors to API error format
 */
function convertToApiError(err: any): ApiError {
  // Already an ApiError
  if (err instanceof ApiError) {
    return err
  }

  // PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        return new ApiError(409, 'Resource already exists', 'DUPLICATE_ENTRY')
      case '23503': // Foreign key violation
        return new ApiError(400, 'Referenced resource does not exist', 'FOREIGN_KEY_VIOLATION')
      case '23502': // Not null violation
        return new ApiError(400, 'Required field is missing', 'NOT_NULL_VIOLATION')
      case '22P02': // Invalid text representation
        return new ApiError(400, 'Invalid data format', 'INVALID_FORMAT')
      default:
        return new ApiError(500, 'Database error', 'DATABASE_ERROR', false)
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return new ApiError(401, 'Invalid token', 'INVALID_TOKEN')
  }

  if (err.name === 'TokenExpiredError') {
    return new ApiError(401, 'Token expired', 'TOKEN_EXPIRED')
  }

  // Validation errors (from express-validator)
  if (err.array && typeof err.array === 'function') {
    const validationErrors = err.array().map((e: any) => ({
      field: e.param || e.path,
      message: e.msg,
    }))
    const apiErr = new ApiError(422, 'Validation failed', 'VALIDATION_ERROR')
    ;(apiErr as any).errors = validationErrors
    return apiErr
  }

  // Default to 500
  return new ApiError(500, err.message || 'Internal server error', 'INTERNAL_ERROR', false)
}

/**
 * Log error with appropriate level
 */
function logError(err: ApiError, req: Request): void {
  const errorInfo = {
    message: err.message,
    code: err.code,
    statusCode: err.statusCode,
    stack: err.stack,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: (req as any).user?.id,
  }

  if (err.statusCode >= 500) {
    logger.error('Server error:', errorInfo)
  } else if (err.statusCode >= 400) {
    logger.warn('Client error:', errorInfo)
  } else {
    logger.info('API error:', errorInfo)
  }
}

/**
 * Error Handler Middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const apiError = convertToApiError(err)

  // Log the error
  logError(apiError, req)

  // Prepare response
  const response: ErrorResponse = {
    status: 'error',
    code: apiError.code,
    message: apiError.isOperational
      ? apiError.message
      : process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : apiError.message,
  }

  // Add validation errors if present
  if ((apiError as any).errors) {
    response.errors = (apiError as any).errors
  }

  // Add stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    response.stack = apiError.stack
  }

  // Send response
  res.status(apiError.statusCode).json(response)
}

/**
 * 404 Not Found Handler
 * Catches all unmatched routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new ApiError(
    404,
    `Route not found: ${req.method} ${req.path}`,
    'ROUTE_NOT_FOUND'
  )
  next(error)
}

/**
 * Async Route Handler Wrapper
 * Catches errors in async route handlers and passes them to error middleware
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
