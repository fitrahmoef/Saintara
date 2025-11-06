/**
 * Custom Error Classes for API
 * Provides standardized error handling across the application
 */

export class ApiError extends Error {
  public readonly statusCode: number
  public readonly code?: string
  public readonly isOperational: boolean

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    isOperational: boolean = true
  ) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = isOperational
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * 400 Bad Request
 */
export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad Request', code?: string) {
    super(400, message, code || 'BAD_REQUEST')
  }
}

/**
 * 401 Unauthorized
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized', code?: string) {
    super(401, message, code || 'UNAUTHORIZED')
  }
}

/**
 * 403 Forbidden
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden', code?: string) {
    super(403, message, code || 'FORBIDDEN')
  }
}

/**
 * 404 Not Found
 */
export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found', code?: string) {
    super(404, message, code || 'NOT_FOUND')
  }
}

/**
 * 409 Conflict
 */
export class ConflictError extends ApiError {
  constructor(message: string = 'Resource already exists', code?: string) {
    super(409, message, code || 'CONFLICT')
  }
}

/**
 * 422 Unprocessable Entity (Validation Error)
 */
export class ValidationError extends ApiError {
  public readonly errors?: Array<{ field: string; message: string }>

  constructor(
    message: string = 'Validation failed',
    errors?: Array<{ field: string; message: string }>,
    code?: string
  ) {
    super(422, message, code || 'VALIDATION_ERROR')
    this.errors = errors
  }
}

/**
 * 429 Too Many Requests
 */
export class TooManyRequestsError extends ApiError {
  constructor(message: string = 'Too many requests', code?: string) {
    super(429, message, code || 'TOO_MANY_REQUESTS')
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal server error', code?: string) {
    super(500, message, code || 'INTERNAL_SERVER_ERROR', false)
  }
}

/**
 * Database Error
 */
export class DatabaseError extends ApiError {
  constructor(message: string = 'Database operation failed', code?: string) {
    super(500, message, code || 'DATABASE_ERROR', false)
  }
}

/**
 * External Service Error
 */
export class ExternalServiceError extends ApiError {
  constructor(message: string = 'External service error', code?: string) {
    super(502, message, code || 'EXTERNAL_SERVICE_ERROR', false)
  }
}
