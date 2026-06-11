// Public feed (/frontend/ux-states, /frontend/pagination) — the home column. Published posts
// newest-first with cursor "load more". Sticky column header (X-style). Explicit loading/error/empty.
import { Loader2 } from 'lucide-react';
import { useFeed } from '../hooks/useFeed';
import { PostCard } from '../components/PostCard';
import { SubscribeButton } from '../components/SubscribeButton';
import { NewPostButton } from '../components/NewPostButton';
import { ColumnHeader, CenterLoader, Notice, Empty } from '../components/Column';

export function FeedPage() {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed();
  const posts = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div>
      <ColumnHeader
        title="Feed"
        actions={
          <div className="flex items-center gap-2">
            <NewPostButton />
            <SubscribeButton />
          </div>
        }
      />

      {isLoading && <CenterLoader />}
      {isError && <Notice>Couldn&apos;t load the feed. Please try again later.</Notice>}
      {!isLoading && !isError && posts.length === 0 && <Empty>No posts yet.</Empty>}

      {posts.map((post) => (
        <PostCard key={post.post_id} post={post} />
      ))}

      {hasNextPage && (
        <div className="flex justify-center p-4">
          <button
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
            className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            {isFetchingNextPage && <Loader2 className="animate-spin" size={16} />}
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
