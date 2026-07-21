// Blog list (/frontend/ux-states). Lists posts newest-first from markdown-in-repo (../lib/content),
// with an optional tag filter (?tag= in the URL). Fully static — no backend, no pagination.
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import { getAllPosts } from '../lib/content';
import { ColumnHeader, Empty } from '../components/Column';

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' });

export function ArticlesPage() {
  const [params, setParams] = useSearchParams();
  const tag = params.get('tag') ?? undefined;
  const posts = getAllPosts(tag);

  return (
    <div>
      <ColumnHeader
        title="Blog"
        description={tag ? `Tag: ${tag}` : undefined}
        actions={
          tag ? (
            <button onClick={() => setParams({})} className="rounded-md border border-border px-3.5 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
              Limpar filtro
            </button>
          ) : undefined
        }
      />

      {posts.length === 0 && <Empty>Ainda não há artigos.</Empty>}

      {posts.map((p) => (
        <article key={p.slug} className="border-b border-border px-4 py-4 transition-colors hover:bg-muted/40">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <time dateTime={p.date}>{fmtDate(p.date)}</time>
            <span>·</span>
            <button onClick={() => setParams({ tag: p.tag })} className="font-medium text-primary hover:underline">
              #{p.tag}
            </button>
          </div>
          <RouterLink to={`/blog/${p.slug}`} className="mt-0.5 block font-display text-lg font-bold leading-snug text-foreground hover:text-primary">
            {p.title}
          </RouterLink>
          {p.excerpt && <p className="mt-1 text-[15px] leading-relaxed text-foreground/80">{p.excerpt}</p>}
        </article>
      ))}
    </div>
  );
}
