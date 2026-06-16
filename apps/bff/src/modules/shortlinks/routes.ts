// Short-link resolution (/backend/lambda-handler) — public. The SPA's /p/<code> route calls this to
// turn a code into its target, then navigates to the canonical URL. Social/SEO crawlers don't use
// this: og-edge hits /og-meta/p/<code> + /prerender/p/<code> (handled in the prerender module).
import { createRoute, z } from '@hono/zod-openapi';
import type { BffApp } from '../../shared/types/app';
import { resolveCode } from './repository';
import { NotFoundError } from '../../shared/errors/http-errors';

const ResolvedSchema = z.object({ type: z.enum(['post', 'article']), target_id: z.string() }).openapi('ResolvedShortLink');

export function registerShortlinks(app: BffApp): void {
  app.openapi(
    createRoute({
      method: 'get',
      path: '/shortlinks/{code}',
      tags: ['shortlinks'],
      summary: 'Resolve a share code to its target',
      request: { params: z.object({ code: z.string() }) },
      responses: {
        200: { description: 'Resolved target', content: { 'application/json': { schema: ResolvedSchema } } },
        404: { description: 'Unknown code' },
      },
    }),
    async (c) => {
      const { code } = c.req.valid('param');
      const link = await resolveCode(code);
      if (!link) throw new NotFoundError('short link not found');
      return c.json({ type: link.type, target_id: link.target_id }, 200);
    },
  );
}
