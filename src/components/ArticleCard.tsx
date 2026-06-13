// An article entry in the unified feed (/frontend/design-system). Distinct from PostCard: no markdown
// body — just date, tag, headline and excerpt, linking out to the full article at /blog/:slug. A small
// "Blog" badge sets it apart from posts in the mixed stream. The tag links into the Blog tag filter.
import { Link as RouterLink } from 'react-router-dom';
import { ShareButton, articleShareUrl } from './ShareButton';
import { LinkPreviewCard } from './LinkPreviewCard';
import type { ArticleFeedItem } from '../types/post';

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' });

export function ArticleCard({ article }: { article: ArticleFeedItem }) {
  return (
    <article className="border-b border-border px-4 py-5 transition-colors hover:bg-muted/40">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        <span className="rounded-sm bg-primary/15 px-1.5 py-0.5 font-semibold text-primary">Blog</span>
        <time className="normal-case" dateTime={article.created_at}>
          {fmtDate(article.created_at)}
        </time>
        <span>·</span>
        <RouterLink to={`/blog?tag=${encodeURIComponent(article.tag)}`} className="font-medium normal-case text-primary hover:underline">
          #{article.tag}
        </RouterLink>
      </div>

      <RouterLink
        to={`/blog/${article.slug}`}
        className="mt-1 block font-display text-xl font-bold leading-snug text-foreground hover:text-primary"
      >
        {article.title}
      </RouterLink>

      {article.excerpt && <p className="mt-2 text-[15px] leading-relaxed text-foreground/80">{article.excerpt}</p>}

      {article.link_previews && article.link_previews.length > 0 && (
        <div className="mt-3 space-y-3">
          {article.link_previews.map((p) => (
            <LinkPreviewCard key={p.url} preview={p} />
          ))}
        </div>
      )}

      {/* interaction row — share the article (short URL /p/<code> when present) */}
      <div className="mt-3 flex items-center">
        <ShareButton title={article.title} url={articleShareUrl(article)} size="sm" />
      </div>
    </article>
  );
}
