// Link preview card (/frontend/design-system) — X-style "unfurl" card for a curated external link.
// Renders the cached thumbnail (our CDN), title, description and domain; the whole card opens the
// original in a new tab. Used in the feed (PostCard) and in compose (live preview, with a remove btn).
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
  const domain = preview.site_name ?? hostOf(preview.url);

  return (
    <div className="relative">
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove preview"
          className="absolute right-2 top-2 z-10 rounded-full bg-background p-1 text-muted-foreground transition-colors hover:text-foreground"
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
        {preview.image && (
          <img src={preview.image} alt="" loading="lazy" className="aspect-[1.91/1] w-full bg-muted object-cover" />
        )}
        <div className="p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon size={13} /> {domain}
          </div>
          {preview.title && <div className="mt-0.5 line-clamp-2 font-semibold leading-snug text-foreground">{preview.title}</div>}
          {preview.description && <div className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{preview.description}</div>}
        </div>
      </a>
    </div>
  );
}
