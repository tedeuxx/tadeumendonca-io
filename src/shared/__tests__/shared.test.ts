import { describe, it, expect } from 'vitest';
import { TABLES } from '../db/tables';
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} from '../errors/http-errors';
import { loggerContext } from '../middleware/logger';
import type { LambdaBindings } from '../types/app';
import type { Context } from 'hono';

describe('TABLES', () => {
  it('reads each table name from env', () => {
    process.env.PROFILE_TABLE_NAME = 'p';
    process.env.POSTS_TABLE_NAME = 'po';
    process.env.ARTICLES_TABLE_NAME = 'a';
    process.env.SUBSCRIPTIONS_TABLE_NAME = 's';
    process.env.AUDITS_TABLE_NAME = 'au';
    expect(TABLES.profile).toBe('p');
    expect(TABLES.posts).toBe('po');
    expect(TABLES.articles).toBe('a');
    expect(TABLES.subscriptions).toBe('s');
    expect(TABLES.audits).toBe('au');
  });
});

describe('http-errors', () => {
  it('maps each error to its status + code', () => {
    expect(new AppError(418, 'teapot', 'm').status).toBe(418);
    expect(new NotFoundError().status).toBe(404);
    expect(new NotFoundError().code).toBe('not_found');
    expect(new UnauthorizedError().status).toBe(403);
    expect(new BadRequestError().status).toBe(400);
  });
});

describe('loggerContext', () => {
  it('binds the lambda context and resets keys', async () => {
    const mw = loggerContext();
    const lambdaContext = {
      callbackWaitsForEmptyEventLoop: false,
      functionName: 'bff',
      functionVersion: '$LATEST',
      invokedFunctionArn: 'arn:aws:lambda:us-east-1:0:function:bff',
      memoryLimitInMB: '256',
      awsRequestId: 'req-1',
      logGroupName: '/aws/lambda/bff',
      logStreamName: 'stream',
      getRemainingTimeInMillis: () => 1000,
    };
    const c = {
      env: { lambdaContext } as LambdaBindings,
      req: { path: '/profile', method: 'GET' },
    } as unknown as Context<{ Bindings: LambdaBindings }>;
    let ran = false;
    await mw(c, async () => {
      ran = true;
    });
    expect(ran).toBe(true);
  });
});
