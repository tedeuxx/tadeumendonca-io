import { describe, it, expect, vi, afterEach } from 'vitest';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('../../../shared/db/client', () => ({ ddb: { send } }));

// The avatar pipeline (jimp) + S3 are exercised in avatar.test.ts; here we mock them so the route's own
// logic (auth, lazy item creation, key update, old-object cleanup) is what's under test.
const { processAvatar, putAsset, deleteAsset } = vi.hoisted(() => ({
  processAvatar: vi.fn(),
  putAsset: vi.fn(),
  deleteAsset: vi.fn(),
}));
vi.mock('../avatar', () => ({ processAvatar }));
vi.mock('../../../shared/s3/client', () => ({ putAsset, deleteAsset }));

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

describe('POST /me/avatar', () => {
  const post = (body: unknown, ctx?: ReturnType<typeof as>) =>
    app.request('/me/avatar', { method: 'POST', headers, body: JSON.stringify(body) }, ctx);

  it('403s without a token', async () => {
    const res = await post({ image_base64: 'abc' });
    expect(res.status).toBe(403);
    expect(processAvatar).not.toHaveBeenCalled();
  });

  it('uploads, sets avatar_key, and lazily creates the item when none exists', async () => {
    processAvatar.mockResolvedValueOnce({ key: 'avatars/u-1-abc.png', body: new Uint8Array([1]), contentType: 'image/png' });
    send.mockResolvedValueOnce({}); // getUser → none
    send.mockResolvedValueOnce({}); // saveUser
    const res = await post({ image_base64: 'aGk=' }, as('u-1'));
    expect(res.status).toBe(200);
    expect(putAsset).toHaveBeenCalledWith('avatars/u-1-abc.png', expect.any(Uint8Array), 'image/png');
    const item = send.mock.calls[1][0].input.Item;
    expect(item.cognito_sub).toBe('u-1');
    expect(item.avatar_key).toBe('avatars/u-1-abc.png');
    expect(item.newsletter_opt_in).toBe(false); // sensible default for a brand-new item
    expect(deleteAsset).not.toHaveBeenCalled(); // nothing to clean up
    expect((await res.json() as Record<string, unknown>).avatar_key).toBe('avatars/u-1-abc.png');
  });

  it('preserves prefs/created_at and deletes the previous avatar object', async () => {
    processAvatar.mockResolvedValueOnce({ key: 'avatars/u-1-new.png', body: new Uint8Array([2]), contentType: 'image/png' });
    send.mockResolvedValueOnce({ Item: { cognito_sub: 'u-1', nickname: 'Tadeu', avatar_key: 'avatars/u-1-old.png', newsletter_opt_in: true, newsletter_schedule: 'weekly', digest_schedule: 'weekly', created_at: '2026-01-01T00:00:00Z' } });
    send.mockResolvedValueOnce({}); // saveUser
    const res = await post({ image_base64: 'aGk=' }, as('u-1'));
    expect(res.status).toBe(200);
    const item = send.mock.calls[1][0].input.Item;
    expect(item.avatar_key).toBe('avatars/u-1-new.png');
    expect(item.nickname).toBe('Tadeu'); // preserved
    expect(item.created_at).toBe('2026-01-01T00:00:00Z'); // preserved
    expect(item.digest_schedule).toBe('weekly'); // sparse GSI key preserved
    expect(deleteAsset).toHaveBeenCalledWith('avatars/u-1-old.png');
  });

  it('does not delete when the new key equals the old (idempotent re-upload)', async () => {
    processAvatar.mockResolvedValueOnce({ key: 'avatars/u-1-same.png', body: new Uint8Array([3]), contentType: 'image/png' });
    send.mockResolvedValueOnce({ Item: { cognito_sub: 'u-1', avatar_key: 'avatars/u-1-same.png', newsletter_opt_in: false, created_at: '2026-01-01T00:00:00Z' } });
    send.mockResolvedValueOnce({}); // saveUser
    await post({ image_base64: 'aGk=' }, as('u-1'));
    expect(deleteAsset).not.toHaveBeenCalled();
  });
});

describe('getAvatarKeysBySub', () => {
  it('returns an empty map without a DB call for no subs', async () => {
    const { getAvatarKeysBySub } = await import('../repository');
    const map = await getAvatarKeysBySub([]);
    expect(map.size).toBe(0);
    expect(send).not.toHaveBeenCalled();
  });

  it('BatchGets distinct subs and maps only those with an avatar', async () => {
    send.mockResolvedValueOnce({ Responses: { [process.env.USERS_TABLE_NAME ?? '']: [{ cognito_sub: 'u-1', avatar_key: 'avatars/u-1.png' }, { cognito_sub: 'u-2' }] } });
    const { getAvatarKeysBySub } = await import('../repository');
    const map = await getAvatarKeysBySub(['u-1', 'u-2', 'u-1']); // dup collapses
    expect(map.get('u-1')).toBe('avatars/u-1.png');
    expect(map.has('u-2')).toBe(false); // no avatar_key → not mapped
    expect(send.mock.calls[0][0].constructor.name).toBe('BatchGetCommand');
  });
});

describe('listByDigestSchedule', () => {
  it('Queries the by-digest GSI for a cadence and follows pagination', async () => {
    send
      .mockResolvedValueOnce({ Items: [{ cognito_sub: 'u-1' }], LastEvaluatedKey: { cognito_sub: 'u-1' } })
      .mockResolvedValueOnce({ Items: [{ cognito_sub: 'u-2' }] });
    const { listByDigestSchedule } = await import('../repository');
    const users = await listByDigestSchedule('weekly');
    expect(users.map((u) => u.cognito_sub)).toEqual(['u-1', 'u-2']);
    const cmd = send.mock.calls[0][0];
    expect(cmd.constructor.name).toBe('QueryCommand');
    expect(cmd.input.IndexName).toBe('by-digest');
    expect(cmd.input.ExpressionAttributeValues).toEqual({ ':s': 'weekly' });
  });
});
