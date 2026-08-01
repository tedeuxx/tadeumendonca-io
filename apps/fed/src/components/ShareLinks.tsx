// Share deeplinks for an article (#183) — the FOOTER entry point.
//
// PLACEMENT AND FRAMING ARE UNCHANGED and deliberate: the reader who just finished is the one with
// something to say about it, so offering the share before the text asks them to recommend what they
// have not read. The header's compact button stays because that is the phone affordance and a phone
// reader shares mid-scroll. Two placements, two reasons.
//
// WHAT CHANGED (#314) IS THE SET, NOT THE LOOK. These render `SHARE_TARGETS` — the same list the header's
// modal renders — plus the copy-link the header always had and this block did not. Before, the two
// entry points offered different destinations and the reader met whichever they happened to reach.
//
// STILL INLINE ANCHORS RATHER THAN A SECOND MODAL. The unification #314 asked for is of the DESTINATIONS;
// forcing this block into a dialog would replace three visible desktop links with a button that hides
// them, which is a regression sold as consistency. The header needed a modal because its affordance is
// one compact control; this one has room.
//
// No third-party script: every platform documents a share URL that needs nothing loaded, so nothing runs
// until the reader clicks — the same rule the video facades and the consent bar hold (ADR-0002).
import { useState } from 'react';
import { useLocale, useT } from '../i18n';
import { SHARE_TARGETS, shareHref, copyLinkUrl } from './shareTargets';

/**
 * `path` is the LOCALE-PREFIXED article path (`/pt/blog/meu-compromisso`). The slug is per-locale
 * (ADR-0037), so a share link built from the wrong edition's slug sends a pt reader an English article —
 * the caller resolves it, this component never guesses.
 */
export function ShareLinks({ title, path }: { title: string; path: string }) {
  const t = useT();
  const { locale } = useLocale();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(copyLinkUrl(path));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  return (
    <nav aria-label={t('share.linksLabel')} className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <span className="font-mono text-[0.68rem] uppercase tracking-[0.1em] text-muted-foreground">
        {t('share.linksHeading')}
      </span>
      {SHARE_TARGETS.map((target) => (
        <a
          key={target.key}
          href={shareHref(target, path, title)}
          target="_blank"
          rel="noreferrer"
          // The accessible name says WHAT is being shared and WHERE. "LinkedIn" alone, repeated on every
          // article, is three identical links to a screen reader moving by link list.
          aria-label={`${t(target.nameKey)}: ${title}`}
          className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-primary hover:underline"
          data-locale={locale}
        >
          {target.label}
        </a>
      ))}
      <button
        type="button"
        onClick={() => void copy()}
        className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-primary hover:underline"
      >
        {copied ? t('share.copied') : t('share.copyLink')}
      </button>
    </nav>
  );
}
