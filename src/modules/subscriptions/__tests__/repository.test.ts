import { describe, it, expect, vi, afterEach } from 'vitest';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('../../../shared/db/client', () => ({ ddb: { send } }));

import { listActiveEmails } from '../repository';

afterEach(() => vi.clearAllMocks());

describe('listActiveEmails', () => {
  it('follows LastEvaluatedKey across pages and flattens emails', async () => {
    send
      .mockResolvedValueOnce({ Items: [{ email: 'a@b.io' }], LastEvaluatedKey: { email: 'a@b.io' } })
      .mockResolvedValueOnce({ Items: [{ email: 'c@d.io' }] }); // no cursor → stop
    const emails = await listActiveEmails();
    expect(emails).toEqual(['a@b.io', 'c@d.io']);
    expect(send).toHaveBeenCalledTimes(2);
    // queries the by-status GSI for active subscribers
    expect(send.mock.calls[0][0].input.IndexName).toBe('by-status');
    expect(send.mock.calls[0][0].input.ExpressionAttributeValues[':a']).toBe('active');
  });

  it('returns [] when there are no active subscribers', async () => {
    send.mockResolvedValueOnce({ Items: [] });
    expect(await listActiveEmails()).toEqual([]);
  });
});
