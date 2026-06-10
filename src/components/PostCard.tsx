// A single feed post (/frontend/design-system) — X-style row: avatar, author line, title, markdown
// body, tags. The whole card links to the detail page; reused by the feed list and the detail header.
import { Link as RouterLink } from 'react-router-dom';
import { Markdown } from './Markdown';
import { LinkPreviewCard } from './LinkPreviewCard';
import { cn } from '../lib/cn';
import type { Post } from '../types/post';

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

export function PostCard({ post, linkTitle = true }: { post: Post; linkTitle?: boolean }) {
  return (
    <article
      className={cn(
        'flex gap-3 px-4 py-4 transition-colors',
        linkTitle && 'border-b border-border hover:bg-muted/40',
      )}
    >
      {/* author avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
        T
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-1.5 text-sm">
          <span className="font-bold text-foreground">Tadeu Mendonça</span>
          <span className="text-muted-foreground">@tadeumendonca</span>
          <span className="text-muted-foreground">·</span>
          <time className="text-muted-foreground" dateTime={post.created_at}>
            {fmtDate(post.created_at)}
          </time>
        </div>

        {linkTitle ? (
          <RouterLink to={`/posts/${post.post_id}`} className="mt-0.5 block text-lg font-bold leading-snug text-foreground hover:text-primary">
            {post.title}
          </RouterLink>
        ) : (
          <h1 className="mt-0.5 text-2xl font-bold leading-snug text-foreground">{post.title}</h1>
        )}

        <div className="mt-1 text-[15px] leading-relaxed text-foreground/90">
          <Markdown>{post.body}</Markdown>
        </div>

        {post.link_previews && post.link_previews.length > 0 && (
          <div className="mt-3 space-y-3">
            {post.link_previews.map((p) => (
              <LinkPreviewCard key={p.url} preview={p} />
            ))}
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <span key={t} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
