// Share button (/frontend/design-system) — public. Shares a URL (a relative path like
// /pt/blog/<slug>; the origin is prepended) via the native share sheet (Web Share API) when
// available, falling back to copying to the clipboard. Generic over the path it is handed.
import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { cn } from '../lib/cn';
import { useT } from '../i18n';
import { withShareUtm } from '../lib/utm';

export function ShareButton({ title, url, size = 'md' }: { title: string; url: string; size?: 'sm' | 'md' }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  // Tagged rather than left clean (#272) — untagged, this affordance would be a hole in the count
  // exactly where it hurts: it is the PHONE path, and phone is where the pt-BR audience shares.
  //
  // Tagged INSIDE each branch, not once above them, and that is the whole point. This component decides
  // between the OS share sheet and a clipboard copy at call time. A single tag applied before the branch
  // stamps `share-sheet` on a desktop copy-paste — a value naming a mechanism the code has just
  // established did not happen. That is the same fabricated dimension ADR-0039 refuses when it declines
  // to guess which platform the sheet sent to, and it would have been permanent: by that ADR's own
  // argument the value is immutable once shared, so the copy-paste population would have been mixed
  // into the sheet population forever, unseparable after the fact.
  const shareUrl = (source: 'share-sheet' | 'copy-link') =>
    withShareUtm(`${window.location.origin}${url}`, source);

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl('share-sheet') });
        return;
      } catch {
        return; // user dismissed the sheet
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl('copy-link'));
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
