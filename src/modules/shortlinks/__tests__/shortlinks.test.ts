import { describe, it, expect, vi, afterEach } from 'vitest';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('../../../shared/db/client', () => ({ ddb: { send } }));

import { app } from '../../../index';
import { createShortLink, resolveCode } from '../repository';

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
});

describe('resolveCode', () => {
  it('returns null when the code is absent', async () => {
    send.mockResolvedValueOnce({});
    expect(await resolveCode('zzz')).toBeNull();
  });
});
