import { describe, it, expect, vi, beforeEach } from 'vitest';

const { listFeedPostsBefore } = vi.hoisted(() => ({ listFeedPostsBefore: vi.fn() }));
const { listAllPublished } = vi.hoisted(() => ({ listAllPublished: vi.fn() }));
vi.mock('../repository', () => ({ listFeedPostsBefore }));
vi.mock('../../articles/repository', () => ({ listAllPublished }));

import { listFeed } from '../feed';

const post = (id: string, ts: string) => ({ post_id: id, gsi_pk: 'POST', title: id, body: 'b', published: true, created_at: ts });
const art = (id: string, ts: string) => ({ article_id: id, slug: id, tag: 't', title: id, body: 'b', excerpt: 'e', published: true, created_at: ts });

beforeEach(() => vi.clearAllMocks());

describe('listFeed', () => {
  it('merges posts + articles newest-first, strips gsi_pk and the article body', async () => {
    listFeedPostsBefore.mockResolvedValue([post('p1', '2026-06-01T00:00:00.000Z')]);
    listAllPublished.mockResolvedValue([art('a1', '2026-06-02T00:00:00.000Z')]);
    const page = await listFeed(10);
    expect(page.items.map((i) => i.kind)).toEqual(['article', 'post']); // a1 is newer
    expect(page.items[1]).not.toHaveProperty('gsi_pk');
    expect(page.items[0]).toMatchObject({ kind: 'article', slug: 'a1' });
    expect(page.items[0]).not.toHaveProperty('body');
    expect(page.next_cursor).toBeUndefined(); // fewer than `limit`, posts page not full
  });

  it('emits a created_at cursor when the page is full and the next page filters older items', async () => {
    listFeedPostsBefore.mockResolvedValueOnce([post('p0', '2026-06-10T00:00:00.000Z'), post('p1', '2026-06-11T00:00:00.000Z')]);
    listAllPublished.mockResolvedValueOnce([]);
    const p1 = await listFeed(2);
    expect(p1.items).toHaveLength(2);
    expect(p1.next_cursor).toBeTruthy();

    // Next page: cursor decodes to `before` = the last item's created_at (2026-06-10). Articles newer
    // than that must be excluded; older ones kept.
    listFeedPostsBefore.mockResolvedValueOnce([]);
    listAllPublished.mockResolvedValueOnce([art('a-old', '2026-05-01T00:00:00.000Z'), art('a-new', '2026-12-01T00:00:00.000Z')]);
    const p2 = await listFeed(2, p1.next_cursor);
    expect(p2.items.map((i) => i.title)).toEqual(['a-old']);
    expect(listFeedPostsBefore).toHaveBeenLastCalledWith(2, '2026-06-10T00:00:00.000Z');
  });

  it('treats a malformed cursor as no cursor', async () => {
    listFeedPostsBefore.mockResolvedValue([]);
    listAllPublished.mockResolvedValue([]);
    const page = await listFeed(10, 'not-valid-cursor!!!');
    expect(page.items).toEqual([]);
    expect(page.next_cursor).toBeUndefined();
    expect(listFeedPostsBefore).toHaveBeenCalledWith(10, undefined);
  });
});
