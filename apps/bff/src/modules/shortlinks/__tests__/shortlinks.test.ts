import { describe, it, expect, vi, afterEach } from 'vitest';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('../../../shared/db/client', () => ({ ddb: { send } }));

import { app } from '../../../index';
import { createShortLink, resolveCode, repointShortLink } from '../repository';

afterEach(() => vi.clearAllMocks());

describe('GET /shortlinks/{code} (public)', () => {
  it('resolves a code to its target', async () => {
    send.mockResolvedValueOnce({ Item: { code: 'abc1234', type: 'post', target_id: 'p1', created_at: 't' } });
    const res = await app.request('/shortlinks/abc1234');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ type: 'post', target_id: 'p1' });
  });

  it('404s an unknown code', async () => {
    send.mockResolvedValueOnce({});
    const res = await app.request('/shortlinks/nope');
    expect(res.status).toBe(404);
  });

  it('resolves an article code to its slug target', async () => {
    send.mockResolvedValueOnce({ Item: { code: 'art1234', type: 'article', target_id: 'building-x', created_at: 't' } });
    const res = await app.request('/shortlinks/art1234');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ type: 'article', target_id: 'building-x' });
  });
});

describe('createShortLink', () => {
  it('returns a 7-char code on first try', async () => {
    send.mockResolvedValueOnce({});
    const code = await createShortLink('p1');
    expect(code).toMatch(/^[0-9a-zA-Z]{7}$/);
    expect(send.mock.calls[0][0].input.ConditionExpression).toBe('attribute_not_exists(code)');
  });

  it('retries on a code collision then succeeds', async () => {
    send
      .mockRejectedValueOnce(Object.assign(new Error('x'), { name: 'ConditionalCheckFailedException' }))
      .mockResolvedValueOnce({});
    const code = await createShortLink('p1');
    expect(code).toMatch(/^[0-9a-zA-Z]{7}$/);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('tags the link with the given type (article)', async () => {
    send.mockResolvedValueOnce({});
    await createShortLink('building-x', 'article');
    expect(send.mock.calls[0][0].input.Item.type).toBe('article');
    expect(send.mock.calls[0][0].input.Item.target_id).toBe('building-x');
  });
});

describe('repointShortLink', () => {
  it('updates the target of an existing code', async () => {
    send.mockResolvedValueOnce({});
    await repointShortLink('art1234', 'new-slug');
    const cmd = send.mock.calls[0][0].input;
    expect(cmd.Key).toEqual({ code: 'art1234' });
    expect(cmd.ExpressionAttributeValues[':t']).toBe('new-slug');
    expect(cmd.ConditionExpression).toBe('attribute_exists(code)');
  });

  it('swallows a missing-code condition failure (deleted link)', async () => {
    send.mockRejectedValueOnce(Object.assign(new Error('x'), { name: 'ConditionalCheckFailedException' }));
    await expect(repointShortLink('gone', 'whatever')).resolves.toBeUndefined();
  });

  it('rethrows other errors', async () => {
    send.mockRejectedValueOnce(Object.assign(new Error('boom'), { name: 'ProvisionedThroughputExceededException' }));
    await expect(repointShortLink('x', 'y')).rejects.toThrow('boom');
  });
});

describe('resolveCode', () => {
  it('returns null when the code is absent', async () => {
    send.mockResolvedValueOnce({});
    expect(await resolveCode('zzz')).toBeNull();
  });
});
