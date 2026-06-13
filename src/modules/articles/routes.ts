// Articles routes (/backend/lambda-handler). Public reads (list + tag filter, by-slug detail —
// published only); admin writes (gateway authorizer + `admin` group). Public URL is the slug; admin
// mutates by article_id. snake_case; slugs are derived from the title and must be unique.
import { createRoute, z } from '@hono/zod-openapi';
import { nanoid } from 'nanoid';
import type { BffApp } from '../../shared/types/app';
import { ARTICLE_FEED_PK, type Article } from '../../shared/types/entities';
import { listPublished, getBySlug, createArticle, saveArticle, deleteArticle } from './repository';
import { createShortLink, repointShortLink } from '../shortlinks/repository';
import { requireGroup } from '../../shared/auth/authorize';
import { NotFoundError, ConflictError } from '../../shared/errors/http-errors';

const ADMIN = 'admin';
const SECURED = [{ CognitoAuth: [] }];

// Regex-free slug: lowercase + NFKD, map any non-[a-z0-9] to '-', then collapse/trim dashes via
// split/filter/join (avoids regex-DoS hotspots and is strictly linear). Capped at 80 chars.
function slugify(s: string): string {
  const lowered = s.toLowerCase().normalize('NFKD');
  let out = '';
  for (const ch of lowered) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 0x300 && code <= 0x36f) continue; // drop NFKD combining accents (é → e, not a dash)
    out += (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') ? ch : '-';
  }
  return out.split('-').filter(Boolean).join('-').slice(0, 80);
}

const ArticleSchema = z
  .object({
    article_id: z.string(),
    slug: z.string(),
    tag: z.string(),
    title: z.string(),
    body: z.string(),
    excerpt: z.string().optional(),
    published: z.boolean(),
    author_sub: z.string().optional(),
    short_code: z.string().optional(),
    created_at: z.string(),
    updated_at: z.string().optional(),
  })
  .openapi('Article');

const ArticleInput = z
  .object({
    title: z.string().min(1).max(200),
    body: z.string().min(1),
    tag: z.string().min(1).max(40),
    excerpt: z.string().max(300).optional(),
    slug: z.string().max(80).optional(),
    published: z.boolean().default(false),
  })
  .openapi('ArticleInput');

const ListSchema = z.object({ items: z.array(ArticleSchema), next_cursor: z.string().optional() }).openapi('ArticleList');

// Strip the sparse index key when echoing the entity back (gsi_pk is an index detail, not API surface).
const toApi = (a: Article): Omit<Article, 'gsi_pk'> => {
  const copy = { ...a };
  delete copy.gsi_pk;
  return copy;
};

export function registerArticles(app: BffApp): void {
  // GET /articles?tag=&limit=&cursor= — public list (published), newest-first.
  app.openapi(
    createRoute({
      method: 'get',
      path: '/articles',
      tags: ['articles'],
      summary: 'List published articles (optionally by tag)',
      request: {
        query: z.object({
          tag: z.string().optional(),
          limit: z.coerce.number().int().min(1).max(50).default(20),
          cursor: z.string().optional(),
        }),
      },
      responses: { 200: { description: 'Article list', content: { 'application/json': { schema: ListSchema } } } },
    }),
    async (c) => {
      const { tag, limit, cursor } = c.req.valid('query');
      const page = await listPublished(limit, cursor, tag);
      return c.json({ items: page.items.map(toApi), next_cursor: page.next_cursor }, 200);
    },
  );

  // GET /articles/{slug} — public, published only.
  app.openapi(
    createRoute({
      method: 'get',
      path: '/articles/{slug}',
      tags: ['articles'],
      summary: 'Get a published article by slug',
      request: { params: z.object({ slug: z.string() }) },
      responses: {
        200: { description: 'The article', content: { 'application/json': { schema: ArticleSchema } } },
        404: { description: 'Not found' },
      },
    }),
    async (c) => {
      const { slug } = c.req.valid('param');
      const article = await getBySlug(slug);
      if (!article || !article.published) throw new NotFoundError('article not found');
      return c.json(toApi(article), 200);
    },
  );

  // POST /articles — admin: create (slug from title unless provided; must be unique).
  app.openapi(
    createRoute({
      method: 'post',
      path: '/articles',
      tags: ['articles'],
      summary: 'Create an article (admin)',
      security: SECURED,
      request: { body: { content: { 'application/json': { schema: ArticleInput } } } },
      responses: {
        201: { description: 'Created', content: { 'application/json': { schema: ArticleSchema } } },
        403: { description: 'Forbidden' },
        409: { description: 'Slug already exists' },
      },
    }),
    async (c) => {
      const claims = requireGroup(c, ADMIN);
      const input = c.req.valid('json');
      const slug = slugify(input.slug || input.title);
      if (await getBySlug(slug)) throw new ConflictError(`slug already exists: ${slug}`);
      const article: Article = {
        article_id: nanoid(),
        slug,
        tag: input.tag,
        title: input.title,
        body: input.body,
        excerpt: input.excerpt,
        published: input.published,
        author_sub: claims.sub,
        short_code: await createShortLink(slug, 'article'), // share URL: /p/<short_code> → /blog/<slug>
        created_at: new Date().toISOString(),
        ...(input.published ? { gsi_pk: ARTICLE_FEED_PK } : {}), // sparse by-created index
      };
      await createArticle(article);
      return c.json(toApi(article), 201);
    },
  );

  // PUT /articles/{slug} — admin: update the article at this slug (a new slug in the body re-checks
  // uniqueness). Addressed by slug — API Gateway allows only one path-variable name per resource, so
  // every /articles/{slug} method shares the `slug` param; mutations resolve the article_id internally.
  app.openapi(
    createRoute({
      method: 'put',
      path: '/articles/{slug}',
      tags: ['articles'],
      summary: 'Update an article (admin)',
      security: SECURED,
      request: { params: z.object({ slug: z.string() }), body: { content: { 'application/json': { schema: ArticleInput } } } },
      responses: {
        200: { description: 'Updated', content: { 'application/json': { schema: ArticleSchema } } },
        403: { description: 'Forbidden' },
        404: { description: 'Not found' },
        409: { description: 'Slug already exists' },
      },
    }),
    async (c) => {
      requireGroup(c, ADMIN);
      const { slug: currentSlug } = c.req.valid('param');
      const input = c.req.valid('json');
      const existing = await getBySlug(currentSlug);
      if (!existing) throw new NotFoundError('article not found');
      const slug = slugify(input.slug || input.title);
      if (slug !== existing.slug && (await getBySlug(slug))) throw new ConflictError(`slug already exists: ${slug}`);
      const updated: Article = {
        ...existing,
        slug,
        tag: input.tag,
        title: input.title,
        body: input.body,
        excerpt: input.excerpt,
        published: input.published,
        updated_at: new Date().toISOString(),
        gsi_pk: input.published ? ARTICLE_FEED_PK : undefined, // removeUndefinedValues drops it → sparse
      };
      // Slug changed → repoint the existing short link so shared /p/<code> URLs keep resolving.
      if (slug !== existing.slug && existing.short_code) await repointShortLink(existing.short_code, slug);
      await saveArticle(updated);
      return c.json(toApi(updated), 200);
    },
  );

  // DELETE /articles/{slug} — admin.
  app.openapi(
    createRoute({
      method: 'delete',
      path: '/articles/{slug}',
      tags: ['articles'],
      summary: 'Delete an article (admin)',
      security: SECURED,
      request: { params: z.object({ slug: z.string() }) },
      responses: { 204: { description: 'Deleted' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
    }),
    async (c) => {
      requireGroup(c, ADMIN);
      const { slug } = c.req.valid('param');
      const existing = await getBySlug(slug);
      if (!existing) throw new NotFoundError('article not found');
      await deleteArticle(existing.article_id);
      return c.body(null, 204);
    },
  );
}
