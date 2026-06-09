// Powertools Logger + a Hono middleware that binds the Lambda context (cold start, request id) and
// per-request keys (path, method) (/backend/logging). Service name + level from env (POWERTOOLS_*).
import type { MiddlewareHandler } from 'hono';
import type { LambdaBindings } from '../types/app';
import { Logger } from '@aws-lambda-powertools/logger';
import { config } from '../config';

export const logger = new Logger({ serviceName: config.serviceName });

export const loggerContext = (): MiddlewareHandler<{ Bindings: LambdaBindings }> => {
  return async (c, next) => {
    // Hono's LambdaContext omits the legacy done/fail/succeed callbacks Powertools' type wants.
    if (c.env?.lambdaContext) {
      logger.addContext(c.env.lambdaContext as unknown as Parameters<typeof logger.addContext>[0]);
    }
    logger.appendKeys({ path: c.req.path, method: c.req.method });
    await next();
    logger.resetKeys();
  };
};
