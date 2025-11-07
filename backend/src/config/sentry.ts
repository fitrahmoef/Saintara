import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { Express } from 'express';
import logger from './logger';

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export function initSentry(app: Express) {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    logger.warn('⚠️  SENTRY_DSN not configured. Error tracking is disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // Adjust in production (e.g., 0.1 for 10%)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Set profilesSampleRate to 1.0 to profile every transaction.
    // Adjust in production (e.g., 0.1 for 10%)
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    integrations: [
      // Enable HTTP calls tracing
      Sentry.httpIntegration(),

      // Enable Express.js middleware tracing
      Sentry.expressIntegration(),

      // Enable Profiling
      nodeProfilingIntegration(),
    ],

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      // Network errors that are expected
      'NetworkError',
      'ECONNREFUSED',
      'ETIMEDOUT',
    ],

    // Filter sensitive data
    beforeSend(event, hint) {
      // Don't send events for health checks
      if (event.request?.url && typeof event.request.url === 'string' && event.request.url.includes('/health')) {
        return null;
      }

      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }

      // Remove sensitive query params
      if (event.request?.query_string && typeof event.request.query_string === 'string') {
        const sensitiveParams = ['token', 'password', 'secret', 'api_key'];
        for (const param of sensitiveParams) {
          if (event.request.query_string.includes(param)) {
            event.request.query_string = '[FILTERED]';
            break;
          }
        }
      }

      return event;
    },
  });

  logger.info('✅ Sentry initialized for error tracking');
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: any) {
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });
}

/**
 * Capture message manually
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser(user);
}

/**
 * Clear user context
 */
export function clearUser() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string, data?: any) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

export default Sentry;
