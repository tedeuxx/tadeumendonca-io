// User account routes (/backend/lambda-handler) — the signed-in user's OWN profile + communication
// prefs. requireAuth (any authenticated user, NOT admin); the caller is always identified by their
// Cognito sub from the token, never from the path/body — so /me only ever reads/writes the caller's
// own item. snake_case; `digest_schedule` (the sparse by-digest GSI key) is DERIVED from opt-in and
// stripped from the API surface, never accepted from the client. Avatar upload is its own endpoint.
import { createRoute, z } from '@hono/zod-openapi';
import type { BffApp } from '../../shared/types/app';
import type { User, DigestSchedule } from '../../shared/types/entities';
import { getUser, saveUser } from './repository';
import { requireAuth } from '../../shared/auth/authorize';

const SECURED = [{ CognitoAuth: [] }];
const ScheduleEnum = z.enum(['daily', 'weekly']);

const UserSchema = z
  .object({
    cognito_sub: z.string(),
    nickname: z.string().optional(),
    avatar_key: z.string().optional(),
    newsletter_opt_in: z.boolean(),
    newsletter_schedule: ScheduleEnum.optional(),
    created_at: z.string(),
    updated_at: z.string().optional(),
  })
  .openapi('User');

const UserInput = z
  .object({
    nickname: z.string().max(40).optional(),
    newsletter_opt_in: z.boolean(),
    newsletter_schedule: ScheduleEnum.optional(),
  })
  .openapi('UserInput');

// Strip the sparse GSI key (digest_schedule is an index detail, not API surface).
const toApi = (u: User): Omit<User, 'digest_schedule'> => {
  const copy = { ...u };
  delete copy.digest_schedule;
  return copy;
};

export function registerUsers(app: BffApp): void {
  // GET /me — the caller's profile. If there's no item yet (hasn't saved prefs), return an opted-out
  // default so the settings form always renders; the item is created on the first PUT.
  app.openapi(
    createRoute({
      method: 'get',
      path: '/me',
      tags: ['users'],
      summary: 'Get my profile',
      security: SECURED,
      responses: {
        200: { description: 'My profile', content: { 'application/json': { schema: UserSchema } } },
        403: { description: 'Forbidden' },
      },
    }),
    async (c) => {
      const sub = requireAuth(c).sub as string;
      const user = await getUser(sub);
      if (user) return c.json(toApi(user), 200);
      return c.json({ cognito_sub: sub, newsletter_opt_in: false, created_at: new Date().toISOString() }, 200);
    },
  );

  // PUT /me — upsert nickname + communication prefs. Opting in defaults the cadence to weekly and sets
  // the sparse digest_schedule GSI key; opting out drops it (removeUndefinedValues). avatar_key and
  // created_at are preserved across updates (avatar has its own endpoint).
  app.openapi(
    createRoute({
      method: 'put',
      path: '/me',
      tags: ['users'],
      summary: 'Update my profile',
      security: SECURED,
      request: { body: { content: { 'application/json': { schema: UserInput } } } },
      responses: {
        200: { description: 'Updated', content: { 'application/json': { schema: UserSchema } } },
        403: { description: 'Forbidden' },
      },
    }),
    async (c) => {
      const sub = requireAuth(c).sub as string;
      const input = c.req.valid('json');
      const existing = await getUser(sub);
      const schedule: DigestSchedule = input.newsletter_schedule ?? existing?.newsletter_schedule ?? 'weekly';
      const now = new Date().toISOString();
      const user: User = {
        cognito_sub: sub,
        nickname: input.nickname ?? existing?.nickname,
        avatar_key: existing?.avatar_key, // managed by the avatar endpoint, preserved here
        newsletter_opt_in: input.newsletter_opt_in,
        newsletter_schedule: schedule,
        digest_schedule: input.newsletter_opt_in ? schedule : undefined, // sparse GSI key; dropped when opted out
        created_at: existing?.created_at ?? now,
        updated_at: now,
      };
      await saveUser(user);
      return c.json(toApi(user), 200);
    },
  );
}
