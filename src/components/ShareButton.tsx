// Share button (/frontend/design-system) — public. Shares a URL (a relative path like /p/<code> or
// /blog/<slug>; the origin is prepended) via the native share sheet (Web Share API) when available,
// falling back to copying to the clipboard. Generic over what's shared — posts and articles both use it.
import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { cn } from '../lib/cn';

export function ShareButton({ title, url, size = 'md' }: { title: string; url: string; size?: 'sm' | 'md' }) {
  const [copied, setCopied] = useState(false);
  const fullUrl = `${window.location.origin}${url}`;

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: fullUrl });
        return;
      } catch {
        return; // user dismissed the sheet
      }
    }
    try {
      await navigator.clipboard.writeText(fullUrl);
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
        'inline-flex items-center gap-1.5 rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
      )}
    >
      {copied ? <Check size={size === 'sm' ? 14 : 16} /> : <Share2 size={size === 'sm' ? 14 : 16} />}
      {copied ? 'Copiado' : 'Compartilhar'}
    </button>
  );
}

// Build the share path for a post / article: the short code when present (/p/<code>), else the
// canonical URL (/posts/<id> or /blog/<slug>).
export const postShareUrl = (p: { post_id: string; short_code?: string }) =>
  p.short_code ? `/p/${p.short_code}` : `/posts/${p.post_id}`;
export const articleShareUrl = (a: { slug: string; short_code?: string }) =>
  a.short_code ? `/p/${a.short_code}` : `/blog/${a.slug}`;
