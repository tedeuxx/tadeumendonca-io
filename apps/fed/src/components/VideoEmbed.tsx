// YouTube facade (/frontend/markdown). Videos live INSIDE articles, never as a section of their own.
// The facade renders YouTube's thumbnail and only swaps in the iframe on click, so a page with a
// video still ships zero third-party frames, cookies or requests until the reader asks for one.
import { useState } from 'react';
import { useT } from '../i18n';

/** Accepts the watch, short and embed forms; returns the 11-char id, or null when it isn't YouTube. */
export function youtubeId(url: string): string | null {
  const m = /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})(?:[?&#].*)?$/.exec(url);
  return m ? m[1] : null;
}

export function VideoEmbed({ id, title }: { id: string; title?: string }) {
  const t = useT();
  const label = title ?? t('video.defaultTitle');
  const [playing, setPlaying] = useState(false);

  return (
    <div className="my-6 aspect-video w-full border border-border">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
          title={label}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`${t('video.play')}: ${label}`}
          className="group relative flex h-full w-full items-center justify-center bg-muted"
        >
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-70 transition-opacity group-hover:opacity-90"
          />
          <span className="relative z-10 border-2 border-border-strong bg-background px-5 py-2.5 font-mono text-sm uppercase tracking-wider group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
            {t('video.watch')}
          </span>
        </button>
      )}
    </div>
  );
}
