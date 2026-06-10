// Public feed (/frontend/ux-states, /frontend/pagination) — the home column. Published posts
// newest-first with cursor "load more". Sticky column header (X-style). Explicit loading/error/empty.
import { Loader2 } from 'lucide-react';
import { useFeed } from '../hooks/useFeed';
import { PostCard } from '../components/PostCard';
import { SubscribeButton } from '../components/SubscribeButton';

export function FeedPage() {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed();
  const posts = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div>
      <div className="z-10 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur lg:sticky lg:top-0">
        <h1 className="text-xl font-bold">Feed</h1>
        <SubscribeButton />
      </div>

      {isLoading && (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin" size={28} />
        </div>
      )}

      {isError && (
        <div className="m-4 rounded-xl border border-border bg-card p-4 text-sm text-foreground">
          Couldn&apos;t load the feed. Please try again later.
        </div>
      )}

      {!isLoading && !isError && posts.length === 0 && (
        <div className="px-4 py-16 text-center text-muted-foreground">No posts yet.</div>
      )}

      {posts.map((post) => (
        <PostCard key={post.post_id} post={post} />
      ))}

      {hasNextPage && (
        <div className="flex justify-center p-4">
          <button
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            {isFetchingNextPage && <Loader2 className="animate-spin" size={16} />}
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
