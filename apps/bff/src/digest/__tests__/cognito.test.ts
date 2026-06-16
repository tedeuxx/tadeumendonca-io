import { describe, it, expect, vi, afterEach } from 'vitest';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityProviderClient: class {
    send = send;
  },
  ListUsersCommand: class {
    constructor(public input: unknown) {}
  },
}));

import { buildSubEmailMap } from '../cognito';

afterEach(() => vi.clearAllMocks());

describe('buildSubEmailMap', () => {
  it('maps sub -> email across pages and skips users missing either attribute', async () => {
    send
      .mockResolvedValueOnce({
        Users: [
          { Attributes: [{ Name: 'sub', Value: 'u-1' }, { Name: 'email', Value: 'a@b.io' }] },
          { Attributes: [{ Name: 'sub', Value: 'u-2' }] }, // no email → skipped
        ],
        PaginationToken: 'next',
      })
      .mockResolvedValueOnce({
        Users: [{ Attributes: [{ Name: 'sub', Value: 'u-3' }, { Name: 'email', Value: 'c@d.io' }] }],
      });

    const map = await buildSubEmailMap();
    expect(map.get('u-1')).toBe('a@b.io');
    expect(map.has('u-2')).toBe(false);
    expect(map.get('u-3')).toBe('c@d.io');
    expect(send).toHaveBeenCalledTimes(2); // followed the pagination token
  });

  it('returns an empty map when the pool has no users', async () => {
    send.mockResolvedValueOnce({ Users: [] });
    expect((await buildSubEmailMap()).size).toBe(0);
  });
});
