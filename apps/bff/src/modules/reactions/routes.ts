// Reaction routes (/backend/lambda-handler) — PUBLIC (no auth; reactions are anonymous vanity metrics;
// the SPA dedupes one-per-browser via localStorage). The emoji is validated against a fixed allow-list
// so the counts map can't be polluted with arbitrary keys. Returns the updated counts.
import { createRoute, z } from '@hono/zod-openapi';
import type { BffApp } from '../../shared/types/app';
import { applyReaction } from './repository';

export const REACTION_EMOJIS = ['👍', '❤️', '😂', '🎉', '💡'] as const;

const ReactionInput = z.object({ emoji: z.enum(REACTION_EMOJIS) }).openapi('ReactionInput');
const ReactionCounts = z.object({ reaction_counts: z.record(z.string(), z.number()) }).openapi('ReactionCounts');
const postIdParam = z.object({ post_id: z.string() });

export function registerReactions(app: BffApp): void {
  app.openapi(
    createRoute({
      method: 'post',
      path: '/posts/{post_id}/reactions',
      tags: ['reactions'],
      summary: 'Add a reaction (public)',
      request: { params: postIdParam, body: { content: { 'application/json': { schema: ReactionInput } } } },
      responses: {
        200: { description: 'Updated counts', content: { 'application/json': { schema: ReactionCounts } } },
        400: { description: 'Unsupported emoji' },
        404: { description: 'Post not found' },
      },
    }),
    async (c) => {
      const { post_id } = c.req.valid('param');
      const { emoji } = c.req.valid('json');
      return c.json({ reaction_counts: await applyReaction(post_id, emoji, 1) }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: 'delete',
      path: '/posts/{post_id}/reactions',
      tags: ['reactions'],
      summary: 'Remove a reaction (public)',
      request: { params: postIdParam, body: { content: { 'application/json': { schema: ReactionInput } } } },
      responses: {
        200: { description: 'Updated counts', content: { 'application/json': { schema: ReactionCounts } } },
        400: { description: 'Unsupported emoji' },
        404: { description: 'Post not found' },
      },
    }),
    async (c) => {
      const { post_id } = c.req.valid('param');
      const { emoji } = c.req.valid('json');
      return c.json({ reaction_counts: await applyReaction(post_id, emoji, -1) }, 200);
    },
  );
}
