// Comment routes (/backend/lambda-handler). Reading is public; writing requires ANY authenticated user
// (requireAuth — not a specific group). Post-moderated: a comment is public on submit; the author or an
// admin can delete it. author_sub comes from the verified token; author_name is client-supplied
// (cosmetic) because the access token carries no name claim.
import { createRoute, z } from '@hono/zod-openapi';
import { nanoid } from 'nanoid';
import type { BffApp } from '../../shared/types/app';
import type { Comment } from '../../shared/types/entities';
import { requireAuth } from '../../shared/auth/authorize';
import { listByPost, addComment, getComment, deleteComment } from './repository';
import { resolveBodyPreviews } from '../unfurl/resolve';
import { LinkPreviewSchema } from '../unfurl/routes';
import { NotFoundError, UnauthorizedError } from '../../shared/errors/http-errors';

const SECURED = [{ CognitoAuth: [] }];

const CommentSchema = z
  .object({
    comment_id: z.string(),
    post_id: z.string(),
    author_sub: z.string(),
    author_name: z.string(),
    body: z.string(),
    link_previews: z.array(LinkPreviewSchema).optional(),
    created_at: z.string(),
  })
  .openapi('Comment');

const CommentInput = z.object({ body: z.string().min(1).max(2000), author_name: z.string().min(1).max(80) }).openapi('CommentInput');
const CommentPageSchema = z.object({ items: z.array(CommentSchema), next_cursor: z.string().optional() }).openapi('CommentPage');

export function registerComments(app: BffApp): void {
  // GET /posts/{post_id}/comments — public, oldest-first, cursor-paginated.
  app.openapi(
    createRoute({
      method: 'get',
      path: '/posts/{post_id}/comments',
      tags: ['comments'],
      summary: 'List a post’s comments (public)',
      request: {
        params: z.object({ post_id: z.string() }),
        query: z.object({ limit: z.coerce.number().int().min(1).max(50).default(20), cursor: z.string().optional() }),
      },
      responses: { 200: { description: 'Comments', content: { 'application/json': { schema: CommentPageSchema } } } },
    }),
    async (c) => {
      const { post_id } = c.req.valid('param');
      const { limit, cursor } = c.req.valid('query');
      return c.json(await listByPost(post_id, limit, cursor), 200);
    },
  );

  // POST /posts/{post_id}/comments — any authenticated user.
  app.openapi(
    createRoute({
      method: 'post',
      path: '/posts/{post_id}/comments',
      tags: ['comments'],
      summary: 'Add a comment (authenticated)',
      security: SECURED,
      request: { params: z.object({ post_id: z.string() }), body: { content: { 'application/json': { schema: CommentInput } } } },
      responses: {
        201: { description: 'Created', content: { 'application/json': { schema: CommentSchema } } },
        403: { description: 'Forbidden' },
      },
    }),
    async (c) => {
      const claims = requireAuth(c);
      const { post_id } = c.req.valid('param');
      const input = c.req.valid('json');
      const link_previews = await resolveBodyPreviews(input.body); // server-authoritative unfurl
      const comment: Comment = {
        comment_id: nanoid(),
        post_id,
        author_sub: claims.sub!,
        author_name: input.author_name,
        body: input.body,
        created_at: new Date().toISOString(),
        ...(link_previews.length ? { link_previews } : {}),
      };
      await addComment(comment);
      return c.json(comment, 201);
    },
  );

  // DELETE /comments/{comment_id} — the author or an admin.
  app.openapi(
    createRoute({
      method: 'delete',
      path: '/comments/{comment_id}',
      tags: ['comments'],
      summary: 'Delete a comment (author or admin)',
      security: SECURED,
      request: { params: z.object({ comment_id: z.string() }) },
      responses: { 204: { description: 'Deleted' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
    }),
    async (c) => {
      const claims = requireAuth(c);
      const { comment_id } = c.req.valid('param');
      const comment = await getComment(comment_id);
      if (!comment) throw new NotFoundError('comment not found');
      const isAdmin = claims.groups.includes('admin');
      if (comment.author_sub !== claims.sub && !isAdmin) throw new UnauthorizedError('not your comment');
      await deleteComment(comment_id, comment.post_id);
      return c.body(null, 204);
    },
  );
}
