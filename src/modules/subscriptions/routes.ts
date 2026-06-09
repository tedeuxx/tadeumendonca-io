// Subscription routes (/backend/notifications) — authenticated (registered users). The gateway
// authorizer proves a valid token; cognito_sub comes from the claims, the email from the body (the
// access token doesn't carry email). Upsert = idempotent subscribe; DELETE = soft unsubscribe.
import { createRoute, z } from '@hono/zod-openapi';
import type { BffApp } from '../../shared/types/app';
import type { Subscription } from '../../shared/types/entities';
import { upsertSubscription, unsubscribe } from './repository';
import { requireAuth } from '../../shared/auth/authorize';

const SECURED = [{ CognitoAuth: [] }];

const SubscribeInput = z.object({ email: z.string().email() }).openapi('SubscribeInput');
const SubscriptionView = z
  .object({ email: z.string(), status: z.enum(['active', 'unsubscribed']) })
  .openapi('Subscription');

export function registerSubscriptions(app: BffApp): void {
  // POST /subscriptions — subscribe (idempotent upsert).
  app.openapi(
    createRoute({
      method: 'post',
      path: '/subscriptions',
      tags: ['subscriptions'],
      summary: 'Subscribe to the feed (registered user)',
      security: SECURED,
      request: { body: { content: { 'application/json': { schema: SubscribeInput } } } },
      responses: {
        200: { description: 'Subscribed', content: { 'application/json': { schema: SubscriptionView } } },
        403: { description: 'Forbidden' },
      },
    }),
    async (c) => {
      const claims = requireAuth(c);
      const { email } = c.req.valid('json');
      const sub: Subscription = {
        email,
        status: 'active',
        cognito_sub: claims.sub!,
        created_at: new Date().toISOString(),
      };
      await upsertSubscription(sub);
      return c.json({ email, status: 'active' as const }, 200);
    },
  );

  // DELETE /subscriptions — soft unsubscribe the caller's email.
  app.openapi(
    createRoute({
      method: 'delete',
      path: '/subscriptions',
      tags: ['subscriptions'],
      summary: 'Unsubscribe from the feed',
      security: SECURED,
      request: { body: { content: { 'application/json': { schema: SubscribeInput } } } },
      responses: { 204: { description: 'Unsubscribed' }, 403: { description: 'Forbidden' } },
    }),
    async (c) => {
      requireAuth(c);
      const { email } = c.req.valid('json');
      await unsubscribe(email);
      return c.body(null, 204);
    },
  );
}
