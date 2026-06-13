import { describe, it, expect, vi, afterEach } from 'vitest';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('../../../shared/db/client', () => ({ ddb: { send } }));
// Unfurl is exercised in its own module; stub it here (default: no previews). The preview test overrides.
const { resolveBodyPreviews } = vi.hoisted(() => ({ resolveBodyPreviews: vi.fn().mockResolvedValue([]) }));
vi.mock('../../unfurl/resolve', () => ({ resolveBodyPreviews }));

import { app } from '../../../index';

const headers = { 'content-type': 'application/json' };
const auth = (sub: string, groups?: string) => ({
  event: { requestContext: { authorizer: { claims: { sub, ...(groups ? { 'cognito:groups': groups } : {}) } } } },
});
afterEach(() => vi.clearAllMocks());

describe('GET /posts/{id}/comments (public)', () => {
  it('lists comments oldest-first', async () => {
    send.mockResolvedValueOnce({ Items: [{ comment_id: 'c1', post_id: 'p1', author_name: 'Ana', body: 'hi', created_at: 't' }] });
    const res = await app.request('/posts/p1/comments');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: unknown[] };
    expect(body.items).toHaveLength(1);
    expect(send.mock.calls[0][0].input.IndexName).toBe('by-post');
  });
});

describe('POST /posts/{id}/comments (authenticated)', () => {
  it('403s without authentication', async () => {
    const res = await app.request('/posts/p1/comments', { method: 'POST', headers, body: JSON.stringify({ body: 'hi', author_name: 'Ana' }) });
    expect(res.status).toBe(403);
  });

  it('creates a comment for any logged-in user (author_sub from token, author_name from body)', async () => {
    send.mockResolvedValueOnce({}).mockResolvedValueOnce({}); // Put + comment_count bump
    const res = await app.request('/posts/p1/comments', { method: 'POST', headers, body: JSON.stringify({ body: 'nice post', author_name: 'Ana' }) }, auth('u-1'));
    expect(res.status).toBe(201);
    const created = (await res.json()) as { author_sub: string; author_name: string; body: string };
    expect(created.author_sub).toBe('u-1');
    expect(created.author_name).toBe('Ana');
    expect(send.mock.calls[0][0].input.Item.body).toBe('nice post');
  });

  it('resolves and stores link previews from the comment body (unfurl)', async () => {
    resolveBodyPreviews.mockResolvedValueOnce([{ url: 'https://youtu.be/abc', provider: 'YouTube', title: 'Vid' }]);
    send.mockResolvedValueOnce({}).mockResolvedValueOnce({}); // Put + comment_count bump
    const res = await app.request('/posts/p1/comments', { method: 'POST', headers, body: JSON.stringify({ body: 'look https://youtu.be/abc', author_name: 'Ana' }) }, auth('u-1'));
    expect(res.status).toBe(201);
    const created = (await res.json()) as { link_previews?: { provider: string }[] };
    expect(created.link_previews?.[0].provider).toBe('YouTube');
    expect(send.mock.calls[0][0].input.Item.link_previews[0].title).toBe('Vid'); // stored
  });

  it('400s an empty body', async () => {
    const res = await app.request('/posts/p1/comments', { method: 'POST', headers, body: JSON.stringify({ body: '', author_name: 'Ana' }) }, auth('u-1'));
    expect(res.status).toBe(400);
  });
});

describe('DELETE /comments/{id} (author or admin)', () => {
  const comment = { comment_id: 'c1', post_id: 'p1', author_sub: 'u-1', author_name: 'Ana', body: 'hi', created_at: 't' };

  it('lets the author delete their own comment', async () => {
    send.mockResolvedValueOnce({ Item: comment }).mockResolvedValueOnce({}).mockResolvedValueOnce({}); // get + delete + bump
    const res = await app.request('/comments/c1', { method: 'DELETE' }, auth('u-1'));
    expect(res.status).toBe(204);
  });

  it('lets an admin delete anyone’s comment', async () => {
    send.mockResolvedValueOnce({ Item: comment }).mockResolvedValueOnce({}).mockResolvedValueOnce({});
    const res = await app.request('/comments/c1', { method: 'DELETE' }, auth('u-2', 'admin'));
    expect(res.status).toBe(204);
  });

  it('403s a different non-admin user', async () => {
    send.mockResolvedValueOnce({ Item: comment });
    const res = await app.request('/comments/c1', { method: 'DELETE' }, auth('u-2'));
    expect(res.status).toBe(403);
  });

  it('404s a missing comment', async () => {
    send.mockResolvedValueOnce({});
    const res = await app.request('/comments/x', { method: 'DELETE' }, auth('u-1'));
    expect(res.status).toBe(404);
  });

  it('403s without authentication', async () => {
    const res = await app.request('/comments/c1', { method: 'DELETE' });
    expect(res.status).toBe(403);
  });
});
