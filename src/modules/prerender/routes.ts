// Bot-rendering routes (/backend/prerender) — public, no auth. og-edge (Lambda@Edge) fetches these:
//   /og-meta/{type}/{slug}  → JSON meta for social scrapers
//   /prerender/{type}/{slug} → full indexable HTML for search crawlers
// Phase 1 serves `profile` (the CV); posts/articles land in Phase 2/3. snake_case payloads.
import type { BffApp } from '../../shared/types/app';
import { getProfile } from '../profile/repository';
import { profileMeta, profileHtml } from '../../shared/render';
import { NotFoundError } from '../../shared/errors/http-errors';

const CACHE = 'public, max-age=300';

export function registerPrerender(app: BffApp): void {
  app.get('/og-meta/:type/:slug', async (c) => {
    const { type } = c.req.param();
    if (type !== 'profile') throw new NotFoundError(`no og-meta for type ${type}`);
    const profile = await getProfile();
    if (!profile) throw new NotFoundError('profile not found');
    c.header('cache-control', CACHE);
    return c.json(profileMeta(profile));
  });

  app.get('/prerender/:type/:slug', async (c) => {
    const { type } = c.req.param();
    if (type !== 'profile') throw new NotFoundError(`no prerender for type ${type}`);
    const profile = await getProfile();
    if (!profile) throw new NotFoundError('profile not found');
    c.header('cache-control', CACHE);
    return c.html(profileHtml(profile));
  });
}
