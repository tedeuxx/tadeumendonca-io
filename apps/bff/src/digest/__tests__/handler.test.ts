import { describe, it, expect, vi, beforeEach } from 'vitest';

const { listFeed, listByDigestSchedule, sendEmail, buildSubEmailMap } = vi.hoisted(() => ({
  listFeed: vi.fn(),
  listByDigestSchedule: vi.fn(),
  sendEmail: vi.fn(),
  buildSubEmailMap: vi.fn(),
}));
vi.mock('../../modules/posts/feed', () => ({ listFeed }));
vi.mock('../../modules/users/repository', () => ({ listByDigestSchedule }));
vi.mock('../../shared/ses/client', () => ({ sendEmail }));
vi.mock('../cognito', () => ({ buildSubEmailMap }));

import { handler } from '../handler';

const recent = () => new Date(Date.now() - 60 * 1000).toISOString(); // 1 min ago — inside any window
const old = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago — outside

const feedItem = (created_at: string) => ({ kind: 'post', post_id: 'p1', title: 'T', body: 'b', published: true, created_at });

beforeEach(() => {
  vi.clearAllMocks();
  sendEmail.mockResolvedValue(undefined);
});

describe('digest handler', () => {
  it('ignores an invalid periodicity and does nothing', async () => {
    await handler({ periodicity: 'monthly' as never });
    expect(listFeed).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('skips when nothing is new in the window', async () => {
    listFeed.mockResolvedValueOnce({ items: [feedItem(old())] });
    await handler({ periodicity: 'daily' });
    expect(listByDigestSchedule).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('skips when there are no opted-in users', async () => {
    listFeed.mockResolvedValueOnce({ items: [feedItem(recent())] });
    listByDigestSchedule.mockResolvedValueOnce([]);
    await handler({ periodicity: 'weekly' });
    expect(buildSubEmailMap).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('sends to opted-in users with a resolvable email and skips those without', async () => {
    listFeed.mockResolvedValueOnce({ items: [feedItem(recent())] });
    listByDigestSchedule.mockResolvedValueOnce([
      { cognito_sub: 'u-1', nickname: 'Tadeu' },
      { cognito_sub: 'u-2' }, // no email in the map → skipped
    ]);
    buildSubEmailMap.mockResolvedValueOnce(new Map([['u-1', 'a@b.io']]));
    await handler({ periodicity: 'daily' });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0][0]).toMatchObject({ to: 'a@b.io' });
  });

  it('is fail-open — one rejected send does not abort the run', async () => {
    listFeed.mockResolvedValueOnce({ items: [feedItem(recent())] });
    listByDigestSchedule.mockResolvedValueOnce([{ cognito_sub: 'u-1' }, { cognito_sub: 'u-2' }]);
    buildSubEmailMap.mockResolvedValueOnce(new Map([['u-1', 'a@b.io'], ['u-2', 'c@d.io']]));
    sendEmail.mockRejectedValueOnce(new Error('SES sandbox')).mockResolvedValueOnce(undefined);
    await expect(handler({ periodicity: 'daily' })).resolves.toBeUndefined();
    expect(sendEmail).toHaveBeenCalledTimes(2);
  });

  it('skips when no opted-in user has a resolvable email', async () => {
    listFeed.mockResolvedValueOnce({ items: [feedItem(recent())] });
    listByDigestSchedule.mockResolvedValueOnce([{ cognito_sub: 'u-1' }]);
    buildSubEmailMap.mockResolvedValueOnce(new Map());
    await handler({ periodicity: 'weekly' });
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
