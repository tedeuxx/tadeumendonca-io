import { describe, it, expect, vi, afterEach } from 'vitest';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('../../../shared/db/client', () => ({ ddb: { send } }));

import { app } from '../../../index';

const headers = { 'content-type': 'application/json' };

// Inject the gateway authorizer claims (the caller's Cognito sub) exactly as the real authorizer would.
const as = (sub = 'u-1') => ({ event: { requestContext: { authorizer: { claims: { sub } } } } });

afterEach(() => vi.clearAllMocks());

describe('GET /me', () => {
  it('403s without a token', async () => {
    expect((await app.request('/me')).status).toBe(403);
    expect(send).not.toHaveBeenCalled();
  });

  it('returns an opted-out default when the user has no item yet', async () => {
    send.mockResolvedValueOnce({}); // getUser → no Item
    const res = await app.request('/me', {}, as('u-9'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { cognito_sub: string; newsletter_opt_in: boolean };
    expect(body.cognito_sub).toBe('u-9');
    expect(body.newsletter_opt_in).toBe(false);
  });

  it('returns the stored profile and strips the sparse digest_schedule key', async () => {
    send.mockResolvedValueOnce({
      Item: { cognito_sub: 'u-1', nickname: 'Tadeu', newsletter_opt_in: true, newsletter_schedule: 'weekly', digest_schedule: 'weekly', created_at: '2026-06-01T00:00:00Z' },
    });
    const res = await app.request('/me', {}, as('u-1'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.nickname).toBe('Tadeu');
    expect(body.newsletter_schedule).toBe('weekly');
    expect(body.digest_schedule).toBeUndefined(); // index key stripped from the API surface
    expect(send.mock.calls[0][0].constructor.name).toBe('GetCommand');
  });
});

describe('PUT /me', () => {
  it('403s without a token', async () => {
    const body = JSON.stringify({ newsletter_opt_in: false });
    expect((await app.request('/me', { method: 'PUT', headers, body })).status).toBe(403);
  });

  it('creates the item and, when opted in, sets the sparse digest_schedule (defaulting to weekly)', async () => {
    send.mockResolvedValueOnce({}); // getUser → none
    send.mockResolvedValueOnce({}); // saveUser Put
    const body = JSON.stringify({ nickname: 'Tadeu', newsletter_opt_in: true });
    const res = await app.request('/me', { method: 'PUT', headers, body }, as('u-1'));
    expect(res.status).toBe(200);
    const item = send.mock.calls[1][0].input.Item;
    expect(item.cognito_sub).toBe('u-1');
    expect(item.newsletter_opt_in).toBe(true);
    expect(item.newsletter_schedule).toBe('weekly'); // defaulted
    expect(item.digest_schedule).toBe('weekly'); // sparse GSI key set while opted in
    expect((await res.json() as Record<string, unknown>).digest_schedule).toBeUndefined(); // stripped from response
  });

  it('drops digest_schedule when opted out but remembers the chosen cadence', async () => {
    send.mockResolvedValueOnce({}); // getUser → none
    send.mockResolvedValueOnce({}); // saveUser
    const body = JSON.stringify({ newsletter_opt_in: false, newsletter_schedule: 'daily' });
    await app.request('/me', { method: 'PUT', headers, body }, as('u-1'));
    const item = send.mock.calls[1][0].input.Item;
    expect(item.newsletter_schedule).toBe('daily'); // remembered
    expect(item.digest_schedule).toBeUndefined(); // not in the index while opted out
  });

  it('preserves created_at and the avatar across updates', async () => {
    send.mockResolvedValueOnce({ Item: { cognito_sub: 'u-1', avatar_key: 'avatars/u-1.png', newsletter_opt_in: false, created_at: '2026-01-01T00:00:00Z' } });
    send.mockResolvedValueOnce({}); // saveUser
    const body = JSON.stringify({ nickname: 'New', newsletter_opt_in: true, newsletter_schedule: 'daily' });
    await app.request('/me', { method: 'PUT', headers, body }, as('u-1'));
    const item = send.mock.calls[1][0].input.Item;
    expect(item.created_at).toBe('2026-01-01T00:00:00Z'); // preserved
    expect(item.avatar_key).toBe('avatars/u-1.png'); // preserved (managed elsewhere)
    expect(item.digest_schedule).toBe('daily');
    expect(item.updated_at).toBeTruthy();
  });
});
