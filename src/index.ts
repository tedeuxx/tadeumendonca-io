// The BFF — one OpenAPIHono app, routes at root, + the aws-lambda adapter (one handler). Domain
// modules register their routes here (/backend/framework-hono, /backend/bff). Auth is external (the
// API GW Cognito authorizer); this app reads claims, never validates tokens.
import { OpenAPIHono } from '@hono/zod-openapi';
import { handle } from 'hono/aws-lambda';
import { cors } from 'hono/cors';
import type { LambdaBindings } from './shared/types/app';
import { loggerContext } from './shared/middleware/logger';
import { errorHandler } from './shared/middleware/error';
import { config } from './shared/config';
import { registerProfile } from './modules/profile/routes';
import { registerPrerender } from './modules/prerender/routes';
import { registerOgImage } from './modules/og-image/routes';
import { registerPosts } from './modules/posts/routes';
import { registerSubscriptions } from './modules/subscriptions/routes';
import { registerArticles } from './modules/articles/routes';
import { registerUnfurl } from './modules/unfurl/routes';
import { registerReactions } from './modules/reactions/routes';
import { registerComments } from './modules/comments/routes';
import { registerShortlinks } from './modules/shortlinks/routes';

export const app = new OpenAPIHono<{ Bindings: LambdaBindings }>();

// Success-path CORS header (the gateway OpenAPI owns OPTIONS preflight + error CORS).
app.use('*', cors({ origin: config.spaOrigin, allowHeaders: ['authorization', 'content-type'] }));
app.use('*', loggerContext());
app.onError(errorHandler);

// Liveness — also the API GW seed route (/infrastructure/api-gateway).
app.get('/health', (c) => c.json({ status: 'ok', service: config.serviceName }));

// Bearer security scheme referenced by protected routes (security: [{ CognitoAuth: [] }]). The neutral
// doc carries a plain apiKey scheme; the AWS overlay (build-openapi-aws) replaces it with the Cognito
// User Pools authorizer (x-amazon-apigateway-authorizer) at deploy (/backend/openapi).
app.openAPIRegistry.registerComponent('securitySchemes', 'CognitoAuth', {
  type: 'apiKey',
  name: 'Authorization',
  in: 'header',
});

registerProfile(app);
registerPrerender(app);
registerOgImage(app);
registerPosts(app);
registerSubscriptions(app);
registerArticles(app);
registerUnfurl(app);
registerReactions(app);
registerComments(app);
registerShortlinks(app);

// OpenAPI document served from the app (the api repo's gen-openapi reads this — /backend/openapi).
app.doc('/openapi.json', {
  openapi: '3.0.1',
  info: { title: 'tadeumendonca-api', version: process.env.API_VERSION ?? '0.0.0' },
});

export const handler = handle(app);
