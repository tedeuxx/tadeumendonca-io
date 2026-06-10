import { describe, it, expect, vi, afterEach } from 'vitest';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('../../../shared/db/client', () => ({ ddb: { send } }));

import { app } from '../../../index';

const headers = { 'content-type': 'application/json' };
afterEach(() => vi.clearAllMocks());

describe('POST /posts/{id}/reactions (public)', () => {
  it('adds a reaction and returns updated counts — no auth required', async () => {
    send
      .mockResolvedValueOnce({}) // ensure-map update
      .mockResolvedValueOnce({ Attributes: { reaction_counts: { '👍': 1 } } }); // ADD update
    const res = await app.request('/posts/p1/reactions', { method: 'POST', headers, body: JSON.stringify({ emoji: '👍' }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ reaction_counts: { '👍': 1 } });
  });

  it('rejects an unsupported emoji with 400', async () => {
    const res = await app.request('/posts/p1/reactions', { method: 'POST', headers, body: JSON.stringify({ emoji: '💩' }) });
    expect(res.status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it('404s when the post does not exist', async () => {
    send.mockRejectedValueOnce(Object.assign(new Error('x'), { name: 'ConditionalCheckFailedException' }));
    const res = await app.request('/posts/nope/reactions', { method: 'POST', headers, body: JSON.stringify({ emoji: '❤️' }) });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /posts/{id}/reactions (public)', () => {
  it('decrements and returns updated counts', async () => {
    send.mockResolvedValueOnce({}).mockResolvedValueOnce({ Attributes: { reaction_counts: { '👍': 0 } } });
    const res = await app.request('/posts/p1/reactions', { method: 'DELETE', headers, body: JSON.stringify({ emoji: '👍' }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ reaction_counts: { '👍': 0 } });
    expect(send.mock.calls[1][0].input.ExpressionAttributeValues[':d']).toBe(-1);
  });
});
