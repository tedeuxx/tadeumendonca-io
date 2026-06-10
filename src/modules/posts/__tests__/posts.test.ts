import { describe, it, expect, vi, afterEach } from 'vitest';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('../../../shared/db/client', () => ({ ddb: { send } }));
// Isolate posts from the notification fan-out (its own suite covers it).
vi.mock('../../notifications/notify', () => ({ notifyPostPublished: vi.fn() }));

import { app } from '../../../index';

// c.env for app.request — the aws-lambda adapter exposes the proxy event at c.env.event, and the REST
// Cognito authorizer injects claims at event.requestContext.authorizer.claims.
const claims = (groups?: string) => ({
  event: { requestContext: { authorizer: { claims: { sub: 'u-1', email: 'a@b.io', ...(groups ? { 'cognito:groups': groups } : {}) } } } },
});

const post = {
  post_id: 'p1',
  gsi_pk: 'POST',
  title: 'Hello',
  body: 'world',
  published: true,
  created_at: '2026-06-01T00:00:00.000Z',
};

afterEach(() => vi.clearAllMocks());

describe('GET /posts (public feed)', () => {
  it('returns published posts (no gsi_pk leaked) + next_cursor', async () => {
    send.mockResolvedValueOnce({ Items: [post], LastEvaluatedKey: { post_id: 'p1' } });
    const res = await app.request('/posts?limit=10');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: Array<Record<string, unknown>>; next_cursor?: string };
    expect(body.items[0].post_id).toBe('p1');
    expect(body.items[0]).not.toHaveProperty('gsi_pk');
    expect(typeof body.next_cursor).toBe('string');
  });

  it('rejects an out-of-range limit (400 from zod validation)', async () => {
    const res = await app.request('/posts?limit=999');
    expect(res.status).toBe(400);
  });
});

describe('GET /posts/{id} (public)', () => {
  it('returns a published post', async () => {
    send.mockResolvedValueOnce({ Item: post });
    const res = await app.request('/posts/p1');
    expect(res.status).toBe(200);
  });
  it('404s a draft (unpublished) to the public', async () => {
    send.mockResolvedValueOnce({ Item: { ...post, published: false, gsi_pk: undefined } });
    const res = await app.request('/posts/p1');
    expect(res.status).toBe(404);
  });
  it('404s a missing post', async () => {
    send.mockResolvedValueOnce({});
    const res = await app.request('/posts/nope');
    expect(res.status).toBe(404);
  });
});

describe('POST /posts (admin write)', () => {
  const body = JSON.stringify({ title: 'New', body: 'content', published: true });
  const headers = { 'content-type': 'application/json' };

  it('403s without authentication claims', async () => {
    const res = await app.request('/posts', { method: 'POST', headers, body });
    expect(res.status).toBe(403);
    expect(send).not.toHaveBeenCalled();
  });

  it('403s an authenticated non-admin', async () => {
    const res = await app.request('/posts', { method: 'POST', headers, body }, claims('registered'));
    expect(res.status).toBe(403);
  });

  it('creates with a generated id + sparse gsi_pk when admin + published', async () => {
    send.mockResolvedValueOnce({}).mockResolvedValueOnce({}); // shortlink Put + post Put
    const res = await app.request('/posts', { method: 'POST', headers, body }, claims('admin'));
    expect(res.status).toBe(201);
    const created = (await res.json()) as { post_id: string; published: boolean; short_code: string };
    expect(created.post_id).toBeTruthy();
    expect(created.published).toBe(true);
    expect(created.short_code).toBeTruthy(); // share code generated
    // calls[0] = shortlink Put, calls[1] = post Put (createShortLink runs before createPost).
    const put = send.mock.calls[1][0].input;
    expect(put.Item.gsi_pk).toBe('POST'); // published → indexed
    expect(put.Item.author_sub).toBe('u-1');
    expect(put.Item.reaction_counts).toEqual({}); // initialized so reaction ADDs never fail
  });

  it('omits gsi_pk for a draft (published:false)', async () => {
    send.mockResolvedValueOnce({}).mockResolvedValueOnce({});
    const res = await app.request(
      '/posts',
      { method: 'POST', headers, body: JSON.stringify({ title: 'D', body: 'b', published: false }) },
      claims('admin'),
    );
    expect(res.status).toBe(201);
    expect(send.mock.calls[1][0].input.Item.gsi_pk).toBeUndefined();
  });
});

describe('PUT/DELETE /posts/{id} (admin)', () => {
  it('updates an existing post (admin)', async () => {
    send.mockResolvedValueOnce({ Item: post }); // getPost
    send.mockResolvedValueOnce({}); // savePost
    const res = await app.request(
      '/posts/p1',
      { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Edited', body: 'b', published: false }) },
      claims('admin'),
    );
    expect(res.status).toBe(200);
    expect(send.mock.calls[1][0].input.Item.gsi_pk).toBeUndefined(); // unpublished → removed from feed
  });

  it('404s updating a missing post', async () => {
    send.mockResolvedValueOnce({}); // getPost → none
    const res = await app.request(
      '/posts/x',
      { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 't', body: 'b', published: true }) },
      claims('admin'),
    );
    expect(res.status).toBe(404);
  });

  it('deletes (admin) → 204', async () => {
    send.mockResolvedValueOnce({});
    const res = await app.request('/posts/p1', { method: 'DELETE' }, claims('admin'));
    expect(res.status).toBe(204);
  });

  it('403s delete without admin', async () => {
    const res = await app.request('/posts/p1', { method: 'DELETE' }, claims('registered'));
    expect(res.status).toBe(403);
  });
});
