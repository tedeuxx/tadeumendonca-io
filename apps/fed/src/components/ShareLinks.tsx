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
import type { MessageKey } from '../i18n/messages';
import { SITE_URL } from '../lib/site';
import { withShareUtm, type ShareSource } from '../lib/utm';

/**
 * One platform's share endpoint. `u` is the absolute article URL, `t` its title.
 *
 * Each target names its OWN accessible-name key rather than sharing a prefix: pt-BR contracts the
 * preposition with the platform's article ("no WhatsApp"), so the phrase cannot be assembled from parts.
 */
const TARGETS: ReadonlyArray<{
  key: ShareSource;
  label: string;
  nameKey: MessageKey;
  href: (u: string, t: string) => string;
}> = [
  // WhatsApp takes ONE `text` parameter — no separate title field — so the title and the URL are joined
  // with a newline. Without it the two run together in the message box.
  { key: 'whatsapp', label: 'WhatsApp', nameKey: 'share.onWhatsapp', href: (u, t) => `https://wa.me/?text=${encodeURIComponent(`${t}\n${u}`)}` },
  { key: 'x', label: 'X', nameKey: 'share.onX', href: (u, t) => `https://x.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}` },
  // LinkedIn ignores any title parameter and reads the OG card from the URL itself — which is why the
  // per-locale OG tags are what actually decides how a shared article looks there.
  { key: 'linkedin', label: 'LinkedIn', nameKey: 'share.onLinkedin', href: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}` },
];

/**
 * `path` is the LOCALE-PREFIXED article path (`/pt/blog/meu-compromisso`). The slug is per-locale
 * (ADR-0037), so a share link built from the wrong edition's slug sends a pt reader an English article —
 * the caller resolves it, this component never guesses.
 */
export function ShareLinks({ title, path }: { title: string; path: string }) {
  const t = useT();
  const { locale } = useLocale();
  const url = `${SITE_URL}${path}`;
  // Tagged PER TARGET, and the tagging happens BEFORE the href builder encodes it (#272). Encoding
  // first and appending after would put a raw `&` inside WhatsApp's single `text=` field, which
  // WhatsApp reads as its own parameter and truncates the message at — the link still opens and still
  // looks right to a substring assertion, so the tests below assert on the DECODED inner URL.

  return (
    <nav aria-label={t('share.linksLabel')} className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <span className="font-mono text-[0.68rem] uppercase tracking-[0.1em] text-muted-foreground">
        {t('share.linksHeading')}
      </span>
      {TARGETS.map(({ key, label, nameKey, href }) => (
        <a
          key={key}
          href={href(withShareUtm(url, key), title)}
          target="_blank"
          rel="noreferrer"
          // The accessible name says WHAT is being shared and WHERE. "LinkedIn" alone, repeated on every
          // article, is three identical links to a screen reader moving by link list.
          aria-label={`${t(nameKey)}: ${title}`}
          className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-primary hover:underline"
          data-locale={locale}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
