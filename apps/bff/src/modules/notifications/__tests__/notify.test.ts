import { describe, it, expect, vi, afterEach } from 'vitest';

const { listActiveEmails } = vi.hoisted(() => ({ listActiveEmails: vi.fn() }));
const { sendEmail } = vi.hoisted(() => ({ sendEmail: vi.fn() }));
vi.mock('../../subscriptions/repository', () => ({ listActiveEmails }));
vi.mock('../../../shared/ses/client', () => ({ sendEmail }));

import { notifyPostPublished } from '../notify';
import type { Post } from '../../../shared/types/entities';

const post: Post = { post_id: 'p1', title: 'Hello & <world>', body: 'b', published: true, created_at: '2026-06-09T00:00:00.000Z' };

afterEach(() => vi.clearAllMocks());

describe('notifyPostPublished', () => {
  it('sends one email per active subscriber', async () => {
    listActiveEmails.mockResolvedValueOnce(['a@b.io', 'c@d.io']);
    sendEmail.mockResolvedValue(undefined);
    await notifyPostPublished(post);
    expect(sendEmail).toHaveBeenCalledTimes(2);
    const first = sendEmail.mock.calls[0][0];
    expect(first.subject).toContain('Hello');
    expect(first.html).toContain('Hello &amp; &lt;world&gt;'); // escaped
    expect(first.text).toContain('/posts/p1');
  });

  it('no subscribers → no sends', async () => {
    listActiveEmails.mockResolvedValueOnce([]);
    await notifyPostPublished(post);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('is fail-open: a send rejection does not throw', async () => {
    listActiveEmails.mockResolvedValueOnce(['a@b.io']);
    sendEmail.mockRejectedValueOnce(new Error('SES sandbox: recipient not verified'));
    await expect(notifyPostPublished(post)).resolves.toBeUndefined();
  });

  it('is fail-open: a repository error does not throw', async () => {
    listActiveEmails.mockRejectedValueOnce(new Error('ddb down'));
    await expect(notifyPostPublished(post)).resolves.toBeUndefined();
  });
});
