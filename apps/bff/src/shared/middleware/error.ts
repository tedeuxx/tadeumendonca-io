// Centralised Hono onError: AppError → its HTTP status + a snake_case body; anything else → 500.
// Handlers throw (NotFoundError, …) and never return 4xx themselves (/backend/error-handling).
import type { ErrorHandler } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { AppError } from '../errors/http-errors';
import { logger } from './logger';

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof AppError) {
    logger.warn('handled error', { code: err.code, status: err.status });
    return c.json({ error: { code: err.code, message: err.message } }, err.status as ContentfulStatusCode);
  }
  logger.error('unhandled error', err as Error);
  return c.json({ error: { code: 'internal_error', message: 'internal server error' } }, 500);
};
