// A single feed post (/frontend/design-system) — article-style entry: date, title, markdown body,
// tags, interaction row. The title links to the detail page; reused by the feed list and detail header.
import { Link as RouterLink } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Markdown } from './Markdown';
import { LinkPreviewCard } from './LinkPreviewCard';
import { ReactionBar } from './ReactionBar';
import { ShareButton } from './ShareButton';
import { cn } from '../lib/cn';
import type { Post } from '../types/post';

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

export function PostCard({ post, linkTitle = true }: { post: Post; linkTitle?: boolean }) {
  return (
    <article className={cn('px-4 py-5 transition-colors', linkTitle && 'border-b border-border hover:bg-muted/40')}>
      <time className="text-xs uppercase tracking-wide text-muted-foreground" dateTime={post.created_at}>
        {fmtDate(post.created_at)}
      </time>

      {linkTitle ? (
        <RouterLink to={`/posts/${post.post_id}`} className="mt-1 block font-display text-xl font-bold leading-snug text-foreground hover:text-primary">
          {post.title}
        </RouterLink>
      ) : (
        <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight text-foreground">{post.title}</h1>
      )}

      <div className="mt-2 text-[15px] leading-relaxed text-foreground/90">
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
            <span key={t} className="rounded-md bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* interaction row — reactions (public), comment count → detail, share */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ReactionBar postId={post.post_id} initialCounts={post.reaction_counts} size="sm" />
        <RouterLink
          to={`/posts/${post.post_id}`}
          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <MessageCircle size={14} /> {post.comment_count ?? 0}
        </RouterLink>
        <ShareButton post={post} size="sm" />
      </div>
    </article>
  );
}
