// Bot-rendering routes (/backend/prerender) — public, no auth. og-edge (Lambda@Edge) fetches these:
//   /og-meta/{type}/{slug}  → JSON meta for social scrapers
//   /prerender/{type}/{slug} → full indexable HTML for search crawlers
// Serves `profile` (the CV) and `posts` (the feed); articles land in Phase 3. snake_case payloads.
import type { BffApp } from '../../shared/types/app';
import { getProfile } from '../profile/repository';
import { getPost } from '../posts/repository';
import { getBySlug } from '../articles/repository';
import { profileMeta, profileHtml, postMeta, postHtml, articleMeta, articleHtml } from '../../shared/render';
import { NotFoundError } from '../../shared/errors/http-errors';

const CACHE = 'public, max-age=300';

// Resolve (type, slug) → { meta, html }, or throw NotFound. Posts/articles must be published to be exposed.
async function resolve(type: string, slug: string): Promise<{ meta: object; html: string }> {
  if (type === 'profile') {
    const profile = await getProfile();
    if (!profile) throw new NotFoundError('profile not found');
    return { meta: profileMeta(profile), html: profileHtml(profile) };
  }
  if (type === 'posts') {
    const post = await getPost(slug);
    if (!post || !post.published) throw new NotFoundError('post not found');
    return { meta: postMeta(post), html: postHtml(post) };
  }
  if (type === 'articles') {
    const article = await getBySlug(slug);
    if (!article || !article.published) throw new NotFoundError('article not found');
    return { meta: articleMeta(article), html: articleHtml(article) };
  }
  throw new NotFoundError(`no bot rendering for type ${type}`);
}

export function registerPrerender(app: BffApp): void {
  app.get('/og-meta/:type/:slug', async (c) => {
    const { type, slug } = c.req.param();
    const { meta } = await resolve(type, slug);
    c.header('cache-control', CACHE);
    return c.json(meta);
  });

  app.get('/prerender/:type/:slug', async (c) => {
    const { type, slug } = c.req.param();
    const { html } = await resolve(type, slug);
    c.header('cache-control', CACHE);
    return c.html(html);
  });
}
