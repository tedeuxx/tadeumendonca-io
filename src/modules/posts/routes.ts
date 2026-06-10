// Posts routes (/backend/lambda-handler). Public reads (feed + by-id, published only); admin writes
// (create/update/delete) gated by the Cognito authorizer (security: CognitoAuth) AND a server-side
// `admin` group check. snake_case payloads; opaque nanoid ids. The sparse gsi_pk is derived from
// `published` here, never accepted from the client.
import { createRoute, z } from '@hono/zod-openapi';
import { nanoid } from 'nanoid';
import type { BffApp } from '../../shared/types/app';
import { FEED_PK, type Post } from '../../shared/types/entities';
import { listPublished, getPost, createPost, savePost, deletePost } from './repository';
import { requireGroup } from '../../shared/auth/authorize';
import { notifyPostPublished } from '../notifications/notify';
import { NotFoundError } from '../../shared/errors/http-errors';
import { resolveBodyPreviews } from '../unfurl/resolve';
import { LinkPreviewSchema } from '../unfurl/routes';

const ADMIN = 'admin';
const SECURED = [{ CognitoAuth: [] }]; // the AWS overlay turns this into the Cognito authorizer

const PostSchema = z
  .object({
    post_id: z.string(),
    title: z.string(),
    body: z.string(),
    tags: z.array(z.string()).optional(),
    link_previews: z.array(LinkPreviewSchema).optional(),
    published: z.boolean(),
    author_sub: z.string().optional(),
    created_at: z.string(),
    updated_at: z.string().optional(),
  })
  .openapi('Post');

const PostInputSchema = z
  .object({
    title: z.string().min(1).max(200),
    body: z.string().min(1),
    tags: z.array(z.string()).max(10).optional(),
    published: z.boolean().default(false),
  })
  .openapi('PostInput');

const FeedSchema = z
  .object({ items: z.array(PostSchema), next_cursor: z.string().optional() })
  .openapi('Feed');

const idParam = z.object({ post_id: z.string() });

// Strip server-owned fields when echoing the entity back (gsi_pk is an index detail, not API surface).
const toApi = (p: Post): Omit<Post, 'gsi_pk'> => {
  const copy = { ...p };
  delete copy.gsi_pk;
  return copy;
};

export function registerPosts(app: BffApp): void {
  // GET /posts — public feed (published only, newest first), cursor-paginated.
  app.openapi(
    createRoute({
      method: 'get',
      path: '/posts',
      tags: ['posts'],
      summary: 'List published posts (public feed)',
      request: {
        query: z.object({
          limit: z.coerce.number().int().min(1).max(50).default(20),
          cursor: z.string().optional(),
        }),
      },
      responses: { 200: { description: 'Feed page', content: { 'application/json': { schema: FeedSchema } } } },
    }),
    async (c) => {
      const { limit, cursor } = c.req.valid('query');
      const page = await listPublished(limit, cursor);
      return c.json({ items: page.items.map(toApi), next_cursor: page.next_cursor }, 200);
    },
  );

  // GET /posts/{post_id} — public, published only.
  app.openapi(
    createRoute({
      method: 'get',
      path: '/posts/{post_id}',
      tags: ['posts'],
      summary: 'Get a published post',
      request: { params: idParam },
      responses: {
        200: { description: 'The post', content: { 'application/json': { schema: PostSchema } } },
        404: { description: 'Not found' },
      },
    }),
    async (c) => {
      const { post_id } = c.req.valid('param');
      const post = await getPost(post_id);
      if (!post || !post.published) throw new NotFoundError('post not found');
      return c.json(toApi(post), 200);
    },
  );

  // POST /posts — admin: create.
  app.openapi(
    createRoute({
      method: 'post',
      path: '/posts',
      tags: ['posts'],
      summary: 'Create a post (admin)',
      security: SECURED,
      request: { body: { content: { 'application/json': { schema: PostInputSchema } } } },
      responses: {
        201: { description: 'Created', content: { 'application/json': { schema: PostSchema } } },
        403: { description: 'Forbidden' },
      },
    }),
    async (c) => {
      const claims = requireGroup(c, ADMIN);
      const input = c.req.valid('json');
      const now = new Date().toISOString();
      const link_previews = await resolveBodyPreviews(input.body); // server-authoritative unfurl
      const post: Post = {
        post_id: nanoid(),
        title: input.title,
        body: input.body,
        tags: input.tags,
        ...(link_previews.length ? { link_previews } : {}),
        published: input.published,
        author_sub: claims.sub,
        created_at: now,
        ...(input.published ? { gsi_pk: FEED_PK } : {}), // sparse feed index
      };
      await createPost(post);
      if (post.published) await notifyPostPublished(post); // fan-out is fail-open
      return c.json(toApi(post), 201);
    },
  );

  // PUT /posts/{post_id} — admin: update (merge + recompute the sparse index).
  app.openapi(
    createRoute({
      method: 'put',
      path: '/posts/{post_id}',
      tags: ['posts'],
      summary: 'Update a post (admin)',
      security: SECURED,
      request: { params: idParam, body: { content: { 'application/json': { schema: PostInputSchema } } } },
      responses: {
        200: { description: 'Updated', content: { 'application/json': { schema: PostSchema } } },
        403: { description: 'Forbidden' },
        404: { description: 'Not found' },
      },
    }),
    async (c) => {
      requireGroup(c, ADMIN);
      const { post_id } = c.req.valid('param');
      const input = c.req.valid('json');
      const existing = await getPost(post_id);
      if (!existing) throw new NotFoundError('post not found');
      const link_previews = await resolveBodyPreviews(input.body); // re-resolve on edit
      const updated: Post = {
        ...existing,
        title: input.title,
        body: input.body,
        tags: input.tags,
        link_previews: link_previews.length ? link_previews : undefined, // removeUndefinedValues drops it
        published: input.published,
        updated_at: new Date().toISOString(),
        gsi_pk: input.published ? FEED_PK : undefined, // removeUndefinedValues drops it → sparse
      };
      await savePost(updated);
      if (!existing.published && updated.published) await notifyPostPublished(updated); // notify on draft→published
      return c.json(toApi(updated), 200);
    },
  );

  // DELETE /posts/{post_id} — admin.
  app.openapi(
    createRoute({
      method: 'delete',
      path: '/posts/{post_id}',
      tags: ['posts'],
      summary: 'Delete a post (admin)',
      security: SECURED,
      request: { params: idParam },
      responses: { 204: { description: 'Deleted' }, 403: { description: 'Forbidden' } },
    }),
    async (c) => {
      requireGroup(c, ADMIN);
      const { post_id } = c.req.valid('param');
      await deletePost(post_id);
      return c.body(null, 204);
    },
  );
}
