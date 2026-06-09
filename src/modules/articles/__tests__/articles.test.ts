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
  it('lists all published articles (Scan) sorted newest-first', async () => {
    send.mockResolvedValueOnce({
      Items: [
        { ...article, article_id: 'a1', slug: 's1', created_at: '2026-01-01T00:00:00Z' },
        { ...article, article_id: 'a2', slug: 's2', created_at: '2026-05-01T00:00:00Z' },
      ],
    });
    const res = await app.request('/articles');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: Array<{ slug: string }> };
    expect(body.items[0].slug).toBe('s2'); // newer first
    expect(send.mock.calls[0][0].constructor.name).toBe('ScanCommand');
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
  it('creates with a slug derived from the title', async () => {
    send.mockResolvedValueOnce({ Items: [] }); // getBySlug → free
    send.mockResolvedValueOnce({}); // createArticle
    const res = await app.request('/articles', { method: 'POST', headers, body }, claims('admin'));
    expect(res.status).toBe(201);
    const created = (await res.json()) as { slug: string; article_id: string };
    expect(created.slug).toBe('my-new-article');
    expect(send.mock.calls[1][0].input.Item.author_sub).toBe('u-1');
  });
  it('409s when the slug already exists', async () => {
    send.mockResolvedValueOnce({ Items: [article] }); // getBySlug → taken
    const res = await app.request('/articles', { method: 'POST', headers, body }, claims('admin'));
    expect(res.status).toBe(409);
  });
});

describe('PUT/DELETE /articles/{slug} (admin)', () => {
  const headers = { 'content-type': 'application/json' };
  it('updates an existing article (addressed by slug)', async () => {
    send.mockResolvedValueOnce({ Items: [article] }); // getBySlug current
    send.mockResolvedValueOnce({}); // saveArticle (slug unchanged → no uniqueness query)
    const res = await app.request('/articles/hello-world', { method: 'PUT', headers, body: JSON.stringify({ title: 'Hello World', body: 'edited', tag: 'aws', published: true }) }, claims('admin'));
    expect(res.status).toBe(200);
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
