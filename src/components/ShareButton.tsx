// Share button (/frontend/design-system) — public. Shares the short URL (tadeumendonca.io/p/<code>)
// via the native share sheet (Web Share API) when available, falling back to copying to the clipboard.
import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import type { Post } from '../types/post';
import { cn } from '../lib/cn';

export function ShareButton({ post, size = 'md' }: { post: Pick<Post, 'post_id' | 'short_code' | 'title'>; size?: 'sm' | 'md' }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/${post.short_code ? `p/${post.short_code}` : `posts/${post.post_id}`}`;

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, url });
        return;
      } catch {
        return; // user dismissed the sheet
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  return (
    <button
      type="button"
      onClick={() => void share()}
      aria-label="Share"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
      )}
    >
      {copied ? <Check size={size === 'sm' ? 14 : 16} /> : <Share2 size={size === 'sm' ? 14 : 16} />}
      {copied ? 'Copiado' : 'Compartilhar'}
    </button>
  );
}
