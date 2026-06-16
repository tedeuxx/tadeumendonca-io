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

const article = {
  article_id: 'a1',
  slug: 'a-slug',
  tag: 'aws',
  title: 'An article',
  body: 'long form body',
  excerpt: 'summary',
  published: true,
  created_at: '2026-06-02T00:00:00.000Z', // newer than the post
};

afterEach(() => vi.clearAllMocks());

describe('GET /posts (public feed)', () => {
  it('merges published posts + articles newest-first, tagged by kind, no gsi_pk/body leaked', async () => {
    send
      .mockResolvedValueOnce({ Items: [post] }) // listFeedPostsBefore (posts query)
      .mockResolvedValueOnce({ Items: [article] }); // listAllPublished (articles scan, single page)
    const res = await app.request('/posts?limit=10');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: Array<Record<string, unknown>>; next_cursor?: string };
    const postItem = body.items.find((i) => i.kind === 'post');
    const articleItem = body.items.find((i) => i.kind === 'article');
    expect(postItem?.post_id).toBe('p1');
    expect(postItem).not.toHaveProperty('gsi_pk');
    expect(articleItem?.slug).toBe('a-slug');
    expect(articleItem).not.toHaveProperty('body'); // feed article is a card, not the full body
    expect(body.items[0].kind).toBe('article'); // newer first
    expect(body.next_cursor).toBeUndefined(); // 2 items < limit, no full page
  });

  it('returns a next_cursor when the posts page is full', async () => {
    const posts = Array.from({ length: 10 }, (_, i) => ({ ...post, post_id: `p${i}`, created_at: `2026-06-${String(20 - i).padStart(2, '0')}T00:00:00.000Z` }));
    send.mockResolvedValueOnce({ Items: posts }).mockResolvedValueOnce({ Items: [] });
    const res = await app.request('/posts?limit=10');
    const body = (await res.json()) as { next_cursor?: string };
    expect(typeof body.next_cursor).toBe('string');
  });

  it('passes the decoded cursor through as a created_at range query on the next page', async () => {
    const posts = Array.from({ length: 2 }, (_, i) => ({ ...post, post_id: `p${i}`, created_at: `2026-06-1${i}T00:00:00.000Z` }));
    send.mockResolvedValueOnce({ Items: posts }).mockResolvedValueOnce({ Items: [] });
    const r1 = await app.request('/posts?limit=2');
    const b1 = (await r1.json()) as { next_cursor?: string };
    expect(b1.next_cursor).toBeTruthy();

    send.mockResolvedValueOnce({ Items: [] }).mockResolvedValueOnce({ Items: [] });
    const r2 = await app.request(`/posts?limit=2&cursor=${encodeURIComponent(b1.next_cursor!)}`);
    expect(r2.status).toBe(200);
    const rangeQuery = send.mock.calls.find((call) => call[0].input?.KeyConditionExpression?.includes(':before'));
    expect(rangeQuery).toBeTruthy(); // the by-created GSI was range-queried with created_at < :before
  });

  it('drains all article Scan pages into the feed (multi-page)', async () => {
    send
      .mockResolvedValueOnce({ Items: [] }) // posts query
      .mockResolvedValueOnce({ Items: [article], LastEvaluatedKey: { article_id: 'a1' } }) // articles page 1
      .mockResolvedValueOnce({ Items: [{ ...article, article_id: 'a2', slug: 'a-slug-2', created_at: '2026-06-03T00:00:00.000Z' }] }); // page 2 (no LEK)
    const res = await app.request('/posts?limit=10');
    const body = (await res.json()) as { items: Array<{ slug?: string }> };
    expect(body.items).toHaveLength(2);
    expect(body.items.map((i) => i.slug)).toEqual(['a-slug-2', 'a-slug']); // newest-first across both pages
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
