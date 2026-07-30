// Share button (/frontend/design-system) — public. Shares a URL (a relative path like
// /pt/blog/<slug>; the origin is prepended) via the native share sheet (Web Share API) when
// available, falling back to copying to the clipboard. Generic over the path it is handed.
import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { cn } from '../lib/cn';
import { useT } from '../i18n';

export function ShareButton({ title, url, size = 'md' }: { title: string; url: string; size?: 'sm' | 'md' }) {
  const t = useT();
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
      aria-label={t('share.share')}
      className={cn(
        'inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
      )}
    >
      {copied ? <Check size={size === 'sm' ? 14 : 16} /> : <Share2 size={size === 'sm' ? 14 : 16} />}
      {copied ? t('share.copied') : t('share.share')}
    </button>
  );
}

// The article's share path. It is just the canonical route — there is no short-code form and no
// redirect service behind one (#268): `/p/<code>` was the retired Hono/Lambda BFF's shape, and on a
// static site nothing can mint or resolve one. Kept as a function rather than inlined at the call
// site so the ONE place that decides a share path stays one place.
export const articleShareUrl = (a: { slug: string }) => `/blog/${a.slug}`;
