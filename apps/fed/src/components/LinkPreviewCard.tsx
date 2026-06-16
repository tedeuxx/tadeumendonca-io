// Link preview card (/frontend/design-system) — a WhatsApp/LinkedIn-style "unfurl" card for a curated
// external link. Two layouts: with an image, a prominent thumbnail on top + a content block (source
// eyebrow, 2-line title, 2-line description); without one, a compact horizontal card with a provider
// icon tile. The whole card opens the original in a new tab. Used in feed/detail (posts + articles +
// comments) and in compose (live preview, with a remove button).
import { Youtube, Music2, Twitter, Instagram, Link2, X } from 'lucide-react';
import type { LinkPreview } from '../types/post';

const PROVIDER_ICON: Record<string, typeof Link2> = {
  YouTube: Youtube,
  Spotify: Music2,
  X: Twitter,
  Instagram: Instagram,
};

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

export function LinkPreviewCard({ preview, onRemove }: { preview: LinkPreview; onRemove?: () => void }) {
  const Icon = PROVIDER_ICON[preview.provider] ?? Link2;
  const source = preview.site_name ?? hostOf(preview.url);

  // Source · Title · Description block, shared by both layouts.
  const Body = (
    <div className="min-w-0 flex-1 p-3">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon size={13} className="shrink-0 text-primary" /> <span className="truncate">{source}</span>
      </div>
      {preview.title && <div className="mt-1 line-clamp-2 font-semibold leading-snug text-foreground">{preview.title}</div>}
      {preview.description && <div className="mt-1 line-clamp-2 text-sm leading-snug text-muted-foreground">{preview.description}</div>}
    </div>
  );

  return (
    <div className="relative">
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove preview"
          className="absolute right-2 top-2 z-10 rounded-full bg-background/90 p-1 text-muted-foreground shadow-sm transition-colors hover:text-foreground"
        >
          <X size={16} />
        </button>
      )}
      <a
        href={preview.url}
        target="_blank"
        rel="noreferrer noopener"
        className="block overflow-hidden rounded-2xl border border-border transition-colors hover:bg-muted/40"
      >
        {preview.image ? (
          // Rich layout: prominent image on top, content below.
          <div>
            <img src={preview.image} alt="" loading="lazy" className="aspect-[1.91/1] w-full bg-muted object-cover" />
            {Body}
          </div>
        ) : (
          // Compact layout: a provider-icon tile on the left, content on the right.
          <div className="flex items-stretch">
            <div className="flex w-14 shrink-0 items-center justify-center bg-muted text-primary">
              <Icon size={22} />
            </div>
            {Body}
          </div>
        )}
      </a>
    </div>
  );
}
