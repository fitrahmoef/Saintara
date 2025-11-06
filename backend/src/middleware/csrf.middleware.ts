/**
 * CSRF Protection Middleware
 *
 * Implements defense-in-depth CSRF protection for JWT-based API:
 * 1. Validates custom X-CSRF-Token header on state-changing requests
 * 2. Validates Origin/Referer headers match allowed origins
 * 3. Skips validation for webhook endpoints (they use signature verification)
 *
 * Note: Traditional CSRF attacks primarily target cookie-based authentication.
 * Since this API uses JWT in Authorization headers (which browsers don't automatically send),
 * the CSRF risk is lower. However, this middleware provides additional security layers.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Allowed origins for CSRF validation
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  process.env.FRONTEND_URL_PROD || 'https://saintara.com',
  'http://localhost:3000',
  'http://localhost:5173', // Vite default port
  'https://saintara.com',
  'https://www.saintara.com',
];

// Methods that require CSRF protection (state-changing operations)
const PROTECTED_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

// Paths that should skip CSRF validation
const CSRF_SKIP_PATHS = [
  '/api/webhooks/',      // Webhook endpoints use signature verification
  '/api/auth/login',     // Login doesn't have a token yet
  '/api/auth/register',  // Registration doesn't have a token yet
  '/health',             // Health check endpoint
  '/api/health',         // Health check endpoint
];

/**
 * Validate if a request origin is allowed
 */
function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;

  // Check exact match
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  // Check if origin matches any allowed origin pattern
  try {
    const originUrl = new URL(origin);
    for (const allowed of ALLOWED_ORIGINS) {
      const allowedUrl = new URL(allowed);
      if (originUrl.hostname === allowedUrl.hostname) {
        return true;
      }
    }
  } catch {
    // Invalid URL, reject
    return false;
  }

  return false;
}

/**
 * Check if path should skip CSRF validation
 */
function shouldSkipCSRF(path: string): boolean {
  return CSRF_SKIP_PATHS.some(skipPath => path.startsWith(skipPath));
}

/**
 * CSRF Protection Middleware
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Only protect state-changing methods
  if (!PROTECTED_METHODS.includes(req.method)) {
    return next();
  }

  // Skip CSRF for specific paths
  if (shouldSkipCSRF(req.path)) {
    logger.debug(`CSRF validation skipped for path: ${req.path}`);
    return next();
  }

  // Get origin and referer headers
  const origin = req.get('origin');
  const referer = req.get('referer');
  const csrfToken = req.get('x-csrf-token');

  // Validate Origin or Referer header
  let validOrigin = false;

  if (origin && isAllowedOrigin(origin)) {
    validOrigin = true;
  } else if (referer) {
    // Extract origin from referer
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
      if (isAllowedOrigin(refererOrigin)) {
        validOrigin = true;
      }
    } catch {
      // Invalid referer URL
      validOrigin = false;
    }
  }

  if (!validOrigin) {
    logger.warn(`CSRF validation failed: Invalid origin/referer for ${req.method} ${req.path}`, {
      origin,
      referer,
      ip: req.ip,
    });

    res.status(403).json({
      status: 'error',
      error: 'CSRF validation failed',
      message: 'Invalid origin. This request appears to come from an untrusted source.',
    });
    return;
  }

  // Validate custom CSRF token header (additional layer)
  // For JWT-based APIs, the presence of a custom header proves it's an AJAX request, not a simple form POST
  // This is now MANDATORY for production security
  if (!csrfToken && req.get('x-requested-with') !== 'XMLHttpRequest') {
    logger.warn(`CSRF validation failed: Missing CSRF token or X-Requested-With header for ${req.method} ${req.path}`, {
      origin,
      ip: req.ip,
    });

    res.status(403).json({
      status: 'error',
      error: 'CSRF validation failed',
      message: 'Missing CSRF token. Please include X-CSRF-Token header in your request.',
    });
    return;
  }

  // CSRF validation passed
  logger.debug(`CSRF validation passed for ${req.method} ${req.path}`);
  next();
};

/**
 * Generate CSRF token for a user session
 * This can be returned during login and stored in the frontend
 */
export function generateCSRFToken(): string {
  // Generate a random token (32 bytes hex = 64 characters)
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate CSRF token (if using token-based validation)
 * This is optional - we're using Origin validation as primary method
 */
export function validateCSRFToken(providedToken: string, storedToken: string): boolean {
  if (!providedToken || !storedToken) {
    return false;
  }

  // Use constant-time comparison to prevent timing attacks
  const crypto = require('crypto');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(providedToken),
      Buffer.from(storedToken)
    );
  } catch {
    return false;
  }
}

export default csrfProtection;
