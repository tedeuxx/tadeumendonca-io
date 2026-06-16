// Poll / "enquete" routes (/backend/lambda-handler). Public reads (list published, single published
// poll) + a public anonymous vote (the SPA dedupes one-per-browser via localStorage); admin writes
// (gateway authorizer + `admin` group). Polls are addressed by the opaque poll_id — no slug/short link
// (a poll lives in the aside, it isn't shared individually). snake_case; option ids are
// server-generated and stable so vote_counts stays meaningful across edits; gsi_pk (the sparse feed
// index) is derived from `published`, never accepted from the client.
import { createRoute, z } from '@hono/zod-openapi';
import { nanoid } from 'nanoid';
import type { BffApp } from '../../shared/types/app';
import { POLL_FEED_PK, type Poll, type PollOption } from '../../shared/types/entities';
import { listPublished, getById, createPoll, savePoll, deletePoll, recordVote } from './repository';
import { requireGroup } from '../../shared/auth/authorize';
import { NotFoundError, BadRequestError } from '../../shared/errors/http-errors';

const ADMIN = 'admin';
const SECURED = [{ CognitoAuth: [] }];

const PollOptionSchema = z.object({ id: z.string(), label: z.string() }).openapi('PollOption');

const PollSchema = z
  .object({
    poll_id: z.string(),
    question: z.string(),
    options: z.array(PollOptionSchema),
    vote_counts: z.record(z.string(), z.number()).optional(),
    published: z.boolean(),
    author_sub: z.string().optional(),
    created_at: z.string(),
    updated_at: z.string().optional(),
  })
  .openapi('Poll');

// On input an option may carry its id (an existing option being edited — keeps its votes) or omit it
// (a new option — gets a fresh server id). 2..10 options.
const PollInput = z
  .object({
    question: z.string().min(1).max(200),
    options: z.array(z.object({ id: z.string().optional(), label: z.string().min(1).max(120) })).min(2).max(10),
    published: z.boolean().default(false),
  })
  .openapi('PollInput');

const ListSchema = z.object({ items: z.array(PollSchema), next_cursor: z.string().optional() }).openapi('PollList');
const VoteCounts = z.object({ vote_counts: z.record(z.string(), z.number()) }).openapi('PollVoteCounts');
const VoteInput = z.object({ option_id: z.string() }).openapi('PollVoteInput');

// Strip the sparse index key when echoing the entity back (gsi_pk is an index detail, not API surface).
const toApi = (p: Poll): Omit<Poll, 'gsi_pk'> => {
  const copy = { ...p };
  delete copy.gsi_pk;
  return copy;
};

export function registerPolls(app: BffApp): void {
  // GET /polls?limit=&cursor= — public list (published), newest-first (the aside reads items[0]).
  app.openapi(
    createRoute({
      method: 'get',
      path: '/polls',
      tags: ['polls'],
      summary: 'List published polls (newest-first)',
      request: { query: z.object({ limit: z.coerce.number().int().min(1).max(50).default(20), cursor: z.string().optional() }) },
      responses: { 200: { description: 'Poll list', content: { 'application/json': { schema: ListSchema } } } },
    }),
    async (c) => {
      const { limit, cursor } = c.req.valid('query');
      const page = await listPublished(limit, cursor);
      return c.json({ items: page.items.map(toApi), next_cursor: page.next_cursor }, 200);
    },
  );

  // GET /polls/{poll_id} — public, published only.
  app.openapi(
    createRoute({
      method: 'get',
      path: '/polls/{poll_id}',
      tags: ['polls'],
      summary: 'Get a published poll',
      request: { params: z.object({ poll_id: z.string() }) },
      responses: {
        200: { description: 'The poll', content: { 'application/json': { schema: PollSchema } } },
        404: { description: 'Not found' },
      },
    }),
    async (c) => {
      const { poll_id } = c.req.valid('param');
      const poll = await getById(poll_id);
      if (!poll || !poll.published) throw new NotFoundError('poll not found');
      return c.json(toApi(poll), 200);
    },
  );

  // POST /polls/{poll_id}/votes — public anonymous vote. The option_id must belong to the (published)
  // poll, so a vote can't create arbitrary keys in the counts map.
  app.openapi(
    createRoute({
      method: 'post',
      path: '/polls/{poll_id}/votes',
      tags: ['polls'],
      summary: 'Cast a vote (public)',
      request: { params: z.object({ poll_id: z.string() }), body: { content: { 'application/json': { schema: VoteInput } } } },
      responses: {
        200: { description: 'Updated vote counts', content: { 'application/json': { schema: VoteCounts } } },
        400: { description: 'Unknown option' },
        404: { description: 'Poll not found' },
      },
    }),
    async (c) => {
      const { poll_id } = c.req.valid('param');
      const { option_id } = c.req.valid('json');
      const poll = await getById(poll_id);
      if (!poll || !poll.published) throw new NotFoundError('poll not found');
      if (!poll.options.some((o) => o.id === option_id)) throw new BadRequestError(`unknown option: ${option_id}`);
      return c.json({ vote_counts: await recordVote(poll_id, option_id) }, 200);
    },
  );

  // POST /polls — admin: create. Option ids are server-generated (stable across later edits).
  app.openapi(
    createRoute({
      method: 'post',
      path: '/polls',
      tags: ['polls'],
      summary: 'Create a poll (admin)',
      security: SECURED,
      request: { body: { content: { 'application/json': { schema: PollInput } } } },
      responses: {
        201: { description: 'Created', content: { 'application/json': { schema: PollSchema } } },
        403: { description: 'Forbidden' },
      },
    }),
    async (c) => {
      const claims = requireGroup(c, ADMIN);
      const input = c.req.valid('json');
      const options: PollOption[] = input.options.map((o) => ({ id: nanoid(8), label: o.label }));
      const poll: Poll = {
        poll_id: nanoid(),
        question: input.question,
        options,
        published: input.published,
        author_sub: claims.sub,
        created_at: new Date().toISOString(),
        ...(input.published ? { gsi_pk: POLL_FEED_PK } : {}), // sparse by-created index
      };
      await createPoll(poll);
      return c.json(toApi(poll), 201);
    },
  );

  // PUT /polls/{poll_id} — admin: update. An option that carries its id keeps its votes; one without
  // gets a fresh id; vote_counts is pruned to the surviving option ids.
  app.openapi(
    createRoute({
      method: 'put',
      path: '/polls/{poll_id}',
      tags: ['polls'],
      summary: 'Update a poll (admin)',
      security: SECURED,
      request: { params: z.object({ poll_id: z.string() }), body: { content: { 'application/json': { schema: PollInput } } } },
      responses: {
        200: { description: 'Updated', content: { 'application/json': { schema: PollSchema } } },
        403: { description: 'Forbidden' },
        404: { description: 'Not found' },
      },
    }),
    async (c) => {
      requireGroup(c, ADMIN);
      const { poll_id } = c.req.valid('param');
      const input = c.req.valid('json');
      const existing = await getById(poll_id);
      if (!existing) throw new NotFoundError('poll not found');
      const options: PollOption[] = input.options.map((o) => ({ id: o.id ?? nanoid(8), label: o.label }));
      const surviving = new Set(options.map((o) => o.id));
      const kept = Object.fromEntries(Object.entries(existing.vote_counts ?? {}).filter(([id]) => surviving.has(id)));
      const updated: Poll = {
        ...existing,
        question: input.question,
        options,
        published: input.published,
        vote_counts: Object.keys(kept).length ? kept : undefined, // removeUndefinedValues drops it when empty
        updated_at: new Date().toISOString(),
        gsi_pk: input.published ? POLL_FEED_PK : undefined, // removeUndefinedValues drops it → sparse index
      };
      await savePoll(updated);
      return c.json(toApi(updated), 200);
    },
  );

  // DELETE /polls/{poll_id} — admin.
  app.openapi(
    createRoute({
      method: 'delete',
      path: '/polls/{poll_id}',
      tags: ['polls'],
      summary: 'Delete a poll (admin)',
      security: SECURED,
      request: { params: z.object({ poll_id: z.string() }) },
      responses: { 204: { description: 'Deleted' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
    }),
    async (c) => {
      requireGroup(c, ADMIN);
      const { poll_id } = c.req.valid('param');
      const existing = await getById(poll_id);
      if (!existing) throw new NotFoundError('poll not found');
      await deletePoll(poll_id);
      return c.body(null, 204);
    },
  );
}
