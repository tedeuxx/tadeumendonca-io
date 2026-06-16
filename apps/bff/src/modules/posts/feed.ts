// Unified public feed (/backend/lambda-handler) — merges published posts and published articles into
// one reverse-chronological stream. Posts come from the sparse by-created GSI (range-queried by a
// created_at cursor); articles are low-volume so we load all published and merge in memory.
//
// Cursor is the created_at of the last item returned (base64). Pagination assumes created_at is unique
// across the merged stream — true in practice (ISO ms timestamps; a post and an article never share one).
import { listFeedPostsBefore } from './repository';
import { listAllPublished } from '../articles/repository';
import type { Post, Article } from '../../shared/types/entities';

export type FeedItem =
  | ({ kind: 'post' } & Omit<Post, 'gsi_pk'>)
  | { kind: 'article'; article_id: string; slug: string; tag: string; title: string; excerpt?: string; short_code?: string; link_previews?: Article['link_previews']; created_at: string };

export interface FeedPage {
  items: FeedItem[];
  next_cursor?: string;
}

const encodeCursor = (before: string): string => Buffer.from(JSON.stringify({ before }), 'utf8').toString('base64url');
const decodeCursor = (cursor?: string): string | undefined => {
  if (!cursor) return undefined;
  try {
    return (JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as { before?: string }).before;
  } catch {
    return undefined;
  }
};

const toPostItem = (p: Post): FeedItem => {
  const copy = { ...p };
  delete copy.gsi_pk; // index detail, not API surface
  return { kind: 'post', ...copy };
};

const toArticleItem = (a: Article): FeedItem => ({
  kind: 'article',
  article_id: a.article_id,
  slug: a.slug,
  tag: a.tag,
  title: a.title,
  excerpt: a.excerpt,
  short_code: a.short_code,
  link_previews: a.link_previews,
  created_at: a.created_at,
});

export async function listFeed(limit: number, cursor?: string): Promise<FeedPage> {
  const before = decodeCursor(cursor);
  const [posts, allArticles] = await Promise.all([listFeedPostsBefore(limit, before), listAllPublished()]);
  const articles = before ? allArticles.filter((a) => a.created_at < before) : allArticles;

  const candidates: FeedItem[] = [...posts.map(toPostItem), ...articles.map(toArticleItem)].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
  const items = candidates.slice(0, limit);

  // More pages remain if the merge was capped, or the posts query itself filled its page (older posts exist).
  const hasMore = candidates.length > limit || posts.length === limit;
  const next_cursor = hasMore && items.length > 0 ? encodeCursor(items[items.length - 1].created_at) : undefined;
  return { items, next_cursor };
}
