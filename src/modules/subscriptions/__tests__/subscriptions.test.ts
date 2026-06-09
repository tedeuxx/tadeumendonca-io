import { describe, it, expect, vi, afterEach } from 'vitest';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('../../../shared/db/client', () => ({ ddb: { send } }));

import { app } from '../../../index';

const authed = {
  event: { requestContext: { authorizer: { claims: { sub: 'u-1' } } } },
};

afterEach(() => vi.clearAllMocks());

describe('POST /subscriptions', () => {
  const headers = { 'content-type': 'application/json' };

  it('403s without authentication', async () => {
    const res = await app.request('/subscriptions', { method: 'POST', headers, body: JSON.stringify({ email: 'a@b.io' }) });
    expect(res.status).toBe(403);
  });

  it('422/400s an invalid email', async () => {
    const res = await app.request('/subscriptions', { method: 'POST', headers, body: JSON.stringify({ email: 'nope' }) }, authed);
    expect(res.status).toBe(400);
  });

  it('subscribes (active) for an authenticated user', async () => {
    send.mockResolvedValueOnce({}); // PutCommand
    const res = await app.request('/subscriptions', { method: 'POST', headers, body: JSON.stringify({ email: 'a@b.io' }) }, authed);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { email: string; status: string };
    expect(body).toEqual({ email: 'a@b.io', status: 'active' });
    const item = send.mock.calls[0][0].input.Item;
    expect(item.status).toBe('active');
    expect(item.cognito_sub).toBe('u-1');
  });
});

describe('DELETE /subscriptions', () => {
  it('soft-unsubscribes (204) when authenticated', async () => {
    send.mockResolvedValueOnce({}); // UpdateCommand
    const res = await app.request(
      '/subscriptions',
      { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'a@b.io' }) },
      authed,
    );
    expect(res.status).toBe(204);
    expect(send.mock.calls[0][0].input.ExpressionAttributeValues[':u']).toBe('unsubscribed');
  });

  it('403s without authentication', async () => {
    const res = await app.request('/subscriptions', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.io' }),
    });
    expect(res.status).toBe(403);
  });
});
