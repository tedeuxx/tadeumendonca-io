// Share deeplinks for an article (#183) — WhatsApp, X, LinkedIn.
//
// Distinct from `ShareButton`, which offers the OS share sheet (or a clipboard copy). That one is the
// right affordance on a phone and useless on a desktop where the sheet does not exist; these are the
// right one on a desktop and redundant on a phone. Both ship, because the reader is on one or the other
// and neither knows which.
//
// PLAIN ANCHORS, no third-party script. Every platform documents a share URL that needs nothing loaded,
// so nothing runs until the reader clicks — the same rule the video facades and the consent bar hold
// (ADR-0002: nothing third-party loads until asked). A share widget would be the one place on this site
// that quietly phones home.
//
// The URL is built from SITE_URL, not `window.location.origin`. These hrefs are PRERENDERED, so at build
// time the origin is `vite preview`'s — a shared link would carry localhost. `ShareButton` can read the
// live origin because it only runs on click; an anchor cannot.
import { useLocale, useT } from '../i18n';
import { SITE_URL } from '../lib/site';

/** One platform's share endpoint. `u` is the absolute article URL, `t` its title. */
const TARGETS = [
  // WhatsApp takes ONE `text` parameter — no separate title field — so the title and the URL are joined
  // with a newline. Without it the two run together in the message box.
  { key: 'whatsapp', label: 'WhatsApp', href: (u: string, t: string) => `https://wa.me/?text=${encodeURIComponent(`${t}\n${u}`)}` },
  { key: 'x', label: 'X', href: (u: string, t: string) => `https://x.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}` },
  // LinkedIn ignores any title parameter and reads the OG card from the URL itself — which is why the
  // per-locale OG tags are what actually decides how a shared article looks there.
  { key: 'linkedin', label: 'LinkedIn', href: (u: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}` },
] as const;

/**
 * `path` is the LOCALE-PREFIXED article path (`/pt/blog/meu-compromisso`). The slug is per-locale
 * (ADR-0037), so a share link built from the wrong edition's slug sends a pt reader an English article —
 * the caller resolves it, this component never guesses.
 */
export function ShareLinks({ title, path }: { title: string; path: string }) {
  const t = useT();
  const { locale } = useLocale();
  const url = `${SITE_URL}${path}`;

  return (
    <nav aria-label={t('share.linksLabel')} className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <span className="font-mono text-[0.68rem] uppercase tracking-[0.1em] text-muted-foreground">
        {t('share.shareOn')}
      </span>
      {TARGETS.map(({ key, label, href }) => (
        <a
          key={key}
          href={href(url, title)}
          target="_blank"
          rel="noreferrer"
          // The accessible name says WHAT is being shared and WHERE. "LinkedIn" alone, repeated on every
          // article, is three identical links to a screen reader moving by link list.
          aria-label={`${t('share.shareOn')} ${label}: ${title}`}
          lang={key === 'whatsapp' ? undefined : 'en'}
          className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-primary hover:underline"
          data-locale={locale}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
