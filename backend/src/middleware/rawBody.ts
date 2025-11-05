import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Middleware to capture raw body for webhook signature verification
 * This is needed for Stripe and Xendit webhook signature verification
 *
 * IMPORTANT: This middleware must be applied BEFORE express.json() middleware
 * for webhook routes
 */
export const rawBodyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Only capture raw body for webhook routes
  if (req.path.includes('/webhook')) {
    let data = '';

    req.on('data', (chunk) => {
      data += chunk;
    });

    req.on('end', () => {
      (req as any).rawBody = data;
      next();
    });
  } else {
    next();
  }
};

/**
 * Alternative middleware using express.raw() for webhook routes
 * Can be used instead of rawBodyMiddleware
 */
export const webhookRawBody = (path: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.path === path) {
      let data: Buffer[] = [];

      req.on('data', (chunk: Buffer) => {
        data.push(chunk);
      });

      req.on('end', () => {
        const rawBody = Buffer.concat(data);
        (req as any).rawBody = rawBody;

        // Parse the body as JSON for convenience
        try {
          req.body = JSON.parse(rawBody.toString());
        } catch (error) {
          logger.warn('Failed to parse webhook body as JSON');
        }

        next();
      });
    } else {
      next();
    }
  };
};
