// Giphy proxy route (/backend/lambda-handler) — ADMIN only: GIF search powers the blog editor, and it
// spends our server-side Giphy key/quota, so it sits behind the gateway authorizer + the `admin` group
// (like article writes). The key never reaches the browser; the SPA picker calls this and hotlinks the
// returned Giphy CDN URLs (their ToS — we don't rehost). Attribution is returned for the UI to display.
import { createRoute, z } from '@hono/zod-openapi';
import type { BffApp } from '../../shared/types/app';
import { requireGroup } from '../../shared/auth/authorize';
import { searchGifs } from './client';

const ADMIN = 'admin';
const SECURED = [{ CognitoAuth: [] }];

const SearchQuery = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).default(24),
  offset: z.coerce.number().int().min(0).max(4999).default(0),
});

const GifSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    url: z.string(),
    width: z.number(),
    height: z.number(),
    preview_url: z.string(),
  })
  .openapi('Gif');

const GifSearchSchema = z.object({ items: z.array(GifSchema), attribution: z.string() }).openapi('GifSearch');

export function registerGiphy(app: BffApp): void {
  app.openapi(
    createRoute({
      method: 'get',
      path: '/giphy/search',
      tags: ['giphy'],
      summary: 'Search Giphy for GIFs (admin)',
      security: SECURED,
      request: { query: SearchQuery },
      responses: {
        200: { description: 'Matching GIFs', content: { 'application/json': { schema: GifSearchSchema } } },
        403: { description: 'Forbidden' },
        502: { description: 'Giphy upstream error' },
      },
    }),
    async (c) => {
      requireGroup(c, ADMIN);
      const { q, limit, offset } = c.req.valid('query');
      return c.json(await searchGifs(q, limit, offset), 200);
    },
  );
}
