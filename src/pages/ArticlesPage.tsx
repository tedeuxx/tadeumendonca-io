// Articles list (/frontend/ux-states, /frontend/pagination). Lists published articles newest-first with
// an optional tag filter (?tag= in the URL) + cursor "load more". Explicit loading/empty/error states.
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useArticles } from '../hooks/useArticles';
import { ColumnHeader, CenterLoader, Notice, Empty } from '../components/Column';

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

export function ArticlesPage() {
  const [params, setParams] = useSearchParams();
  const tag = params.get('tag') ?? undefined;
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useArticles(tag);
  const articles = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div>
      <ColumnHeader
        title="Articles"
        description={tag ? `Tag: ${tag}` : undefined}
        actions={
          tag ? (
            <button onClick={() => setParams({})} className="rounded-md border border-border px-3.5 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
              Clear filter
            </button>
          ) : undefined
        }
      />

      {isLoading && <CenterLoader />}
      {isError && <Notice>Couldn&apos;t load articles. Please try again later.</Notice>}
      {!isLoading && !isError && articles.length === 0 && <Empty>No articles yet.</Empty>}

      {articles.map((a) => (
        <article key={a.article_id} className="border-b border-border px-4 py-4 transition-colors hover:bg-muted/40">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <time dateTime={a.created_at}>{fmtDate(a.created_at)}</time>
            <span>·</span>
            <button onClick={() => setParams({ tag: a.tag })} className="font-medium text-primary hover:underline">
              #{a.tag}
            </button>
          </div>
          <RouterLink to={`/articles/${a.slug}`} className="mt-0.5 block font-display text-lg font-bold leading-snug text-foreground hover:text-primary">
            {a.title}
          </RouterLink>
          {a.excerpt && <p className="mt-1 text-[15px] leading-relaxed text-foreground/80">{a.excerpt}</p>}
        </article>
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
