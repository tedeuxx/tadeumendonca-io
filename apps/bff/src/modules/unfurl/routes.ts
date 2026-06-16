// Unfurl route (/backend/unfurl, /backend/lambda-handler). Admin-only: the compose UI calls this to
// live-preview a curated link (YouTube/Spotify/web → rich card; X/Instagram → degraded card). The
// stored previews are re-resolved server-side on post save (see posts/routes) — this endpoint drives
// the cosmetic preview. Gated by the Cognito authorizer (security) AND a server-side admin check.
import { createRoute, z } from '@hono/zod-openapi';
import type { BffApp } from '../../shared/types/app';
import { requireGroup } from '../../shared/auth/authorize';
import { resolveUrl } from './resolve';

const SECURED = [{ CognitoAuth: [] }];

export const LinkPreviewSchema = z
  .object({
    url: z.string(),
    provider: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    site_name: z.string().optional(),
    author: z.string().optional(),
  })
  .openapi('LinkPreview');

const UnfurlInputSchema = z.object({ url: z.string().url().max(2048) }).openapi('UnfurlInput');

export function registerUnfurl(app: BffApp): void {
  app.openapi(
    createRoute({
      method: 'post',
      path: '/admin/unfurl',
      tags: ['unfurl'],
      summary: 'Resolve an external URL to a link-preview card (admin)',
      security: SECURED,
      request: { body: { content: { 'application/json': { schema: UnfurlInputSchema } } } },
      responses: {
        200: { description: 'Link preview', content: { 'application/json': { schema: LinkPreviewSchema } } },
        400: { description: 'Invalid or disallowed URL' },
        403: { description: 'Forbidden' },
      },
    }),
    async (c) => {
      requireGroup(c, 'admin');
      const { url } = c.req.valid('json');
      const preview = await resolveUrl(url); // throws BadRequestError (→400) on invalid/SSRF-blocked URLs
      return c.json(preview, 200);
    },
  );
}
