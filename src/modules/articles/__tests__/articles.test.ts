import { describe, it, expect, vi, afterEach } from 'vitest';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('../../../shared/db/client', () => ({ ddb: { send } }));

import { app } from '../../../index';

const claims = (groups?: string) => ({
  event: { requestContext: { authorizer: { claims: { sub: 'u-1', ...(groups ? { 'cognito:groups': groups } : {}) } } } },
});

const article = {
  article_id: 'a1',
  slug: 'hello-world',
  tag: 'aws',
  title: 'Hello World',
  body: '# Hi\n\nlong form',
  published: true,
  created_at: '2026-06-01T00:00:00.000Z',
};

afterEach(() => vi.clearAllMocks());

describe('GET /articles (public list)', () => {
  it('lists published articles via the sparse by-created GSI (Query, no Scan), newest-first', async () => {
    send.mockResolvedValueOnce({
      Items: [
        { ...article, article_id: 'a2', slug: 's2', gsi_pk: 'ARTICLE', created_at: '2026-05-01T00:00:00Z' },
        { ...article, article_id: 'a1', slug: 's1', gsi_pk: 'ARTICLE', created_at: '2026-01-01T00:00:00Z' },
      ],
    });
    const res = await app.request('/articles');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: Array<{ slug: string; gsi_pk?: string }> };
    expect(body.items[0].slug).toBe('s2'); // the GSI returns newest-first (no in-memory sort)
    expect(body.items[0].gsi_pk).toBeUndefined(); // index key stripped from the API surface
    const cmd = send.mock.calls[0][0];
    expect(cmd.constructor.name).toBe('QueryCommand');
    expect(cmd.input.IndexName).toBe('by-created');
    expect(cmd.input.ExpressionAttributeValues[':pk']).toBe('ARTICLE');
  });

  it('filters by tag via the by-tag GSI (Query)', async () => {
    send.mockResolvedValueOnce({ Items: [article] });
    const res = await app.request('/articles?tag=aws');
    expect(res.status).toBe(200);
    expect(send.mock.calls[0][0].input.IndexName).toBe('by-tag');
    expect(send.mock.calls[0][0].input.ExpressionAttributeValues[':t']).toBe('aws');
  });
});

describe('GET /articles/{slug}', () => {
  it('returns a published article by slug', async () => {
    send.mockResolvedValueOnce({ Items: [article] });
    const res = await app.request('/articles/hello-world');
    expect(res.status).toBe(200);
    expect(send.mock.calls[0][0].input.IndexName).toBe('by-slug');
  });
  it('404s a draft', async () => {
    send.mockResolvedValueOnce({ Items: [{ ...article, published: false }] });
    expect((await app.request('/articles/hello-world')).status).toBe(404);
  });
  it('404s a missing slug', async () => {
    send.mockResolvedValueOnce({ Items: [] });
    expect((await app.request('/articles/nope')).status).toBe(404);
  });
});

describe('POST /articles (admin)', () => {
  const headers = { 'content-type': 'application/json' };
  const body = JSON.stringify({ title: 'My New Article', body: 'content', tag: 'aws', published: true });

  it('403s without auth', async () => {
    expect((await app.request('/articles', { method: 'POST', headers, body })).status).toBe(403);
  });
  it('403s a non-admin', async () => {
    expect((await app.request('/articles', { method: 'POST', headers, body }, claims('registered'))).status).toBe(403);
  });
  it('creates with a slug derived from the title; published → sparse gsi_pk, stripped from the response', async () => {
    send.mockResolvedValueOnce({ Items: [] }); // getBySlug → free
    send.mockResolvedValueOnce({}); // createShortLink Put
    send.mockResolvedValueOnce({}); // createArticle
    const res = await app.request('/articles', { method: 'POST', headers, body }, claims('admin'));
    expect(res.status).toBe(201);
    const created = (await res.json()) as Record<string, unknown>;
    expect(created.slug).toBe('my-new-article');
    expect(created.gsi_pk).toBeUndefined(); // index key not exposed
    expect(created.short_code).toBeTruthy(); // share code generated
    // calls: [0] getBySlug, [1] shortlink Put (type article, target = slug), [2] article Put
    expect(send.mock.calls[1][0].input.Item.type).toBe('article');
    expect(send.mock.calls[1][0].input.Item.target_id).toBe('my-new-article');
    expect(send.mock.calls[2][0].input.Item.author_sub).toBe('u-1');
    expect(send.mock.calls[2][0].input.Item.gsi_pk).toBe('ARTICLE'); // published → indexed
  });

  it('creates a draft without a gsi_pk (stays out of the by-created index)', async () => {
    send.mockResolvedValueOnce({ Items: [] }); // getBySlug → free
    send.mockResolvedValueOnce({}); // createShortLink Put
    send.mockResolvedValueOnce({}); // createArticle
    const draft = JSON.stringify({ title: 'A Draft', body: 'wip', tag: 'aws', published: false });
    const res = await app.request('/articles', { method: 'POST', headers, body: draft }, claims('admin'));
    expect(res.status).toBe(201);
    expect(send.mock.calls[2][0].input.Item.gsi_pk).toBeUndefined();
  });
  it('409s when the slug already exists', async () => {
    send.mockResolvedValueOnce({ Items: [article] }); // getBySlug → taken
    const res = await app.request('/articles', { method: 'POST', headers, body }, claims('admin'));
    expect(res.status).toBe(409);
  });
});

describe('PUT/DELETE /articles/{slug} (admin)', () => {
  const headers = { 'content-type': 'application/json' };
  it('updates an existing article (addressed by slug); published → gsi_pk set', async () => {
    send.mockResolvedValueOnce({ Items: [article] }); // getBySlug current
    send.mockResolvedValueOnce({}); // saveArticle (slug unchanged → no uniqueness query)
    const res = await app.request('/articles/hello-world', { method: 'PUT', headers, body: JSON.stringify({ title: 'Hello World', body: 'edited', tag: 'aws', published: true }) }, claims('admin'));
    expect(res.status).toBe(200);
    expect(send.mock.calls[1][0].input.Item.gsi_pk).toBe('ARTICLE');
  });

  it('unpublishing clears gsi_pk (drops out of the by-created index)', async () => {
    send.mockResolvedValueOnce({ Items: [{ ...article, gsi_pk: 'ARTICLE' }] }); // getBySlug current (was published)
    send.mockResolvedValueOnce({}); // saveArticle
    const res = await app.request('/articles/hello-world', { method: 'PUT', headers, body: JSON.stringify({ title: 'Hello World', body: 'edited', tag: 'aws', published: false }) }, claims('admin'));
    expect(res.status).toBe(200);
    expect(send.mock.calls[1][0].input.Item.gsi_pk).toBeUndefined();
  });
  it('repoints the short link when the slug changes (shared /p/<code> keeps resolving)', async () => {
    send.mockResolvedValueOnce({ Items: [{ ...article, short_code: 'art1234' }] }); // getBySlug current
    send.mockResolvedValueOnce({ Items: [] }); // getBySlug(new slug) → free
    send.mockResolvedValueOnce({}); // repointShortLink Update
    send.mockResolvedValueOnce({}); // saveArticle
    const res = await app.request('/articles/hello-world', { method: 'PUT', headers, body: JSON.stringify({ title: 'Brand New Title', body: 'edited', tag: 'aws', published: true }) }, claims('admin'));
    expect(res.status).toBe(200);
    // calls: [0] getBySlug, [1] uniqueness query, [2] repoint Update, [3] saveArticle
    expect(send.mock.calls[2][0].input.Key).toEqual({ code: 'art1234' });
    expect(send.mock.calls[2][0].input.ExpressionAttributeValues[':t']).toBe('brand-new-title');
  });

  it('404s updating a missing article', async () => {
    send.mockResolvedValueOnce({ Items: [] });
    const res = await app.request('/articles/nope', { method: 'PUT', headers, body: JSON.stringify({ title: 'x', body: 'b', tag: 't', published: false }) }, claims('admin'));
    expect(res.status).toBe(404);
  });
  it('deletes by slug (admin) → 204', async () => {
    send.mockResolvedValueOnce({ Items: [article] }); // getBySlug
    send.mockResolvedValueOnce({}); // deleteArticle
    const res = await app.request('/articles/hello-world', { method: 'DELETE' }, claims('admin'));
    expect(res.status).toBe(204);
  });
  it('403s delete without admin', async () => {
    expect((await app.request('/articles/hello-world', { method: 'DELETE' }, claims('registered'))).status).toBe(403);
  });
});
