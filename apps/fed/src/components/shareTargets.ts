// The destinations an article can be shared to — ONE list, rendered by both entry points (#314).
//
// Before this, the two share affordances on an article offered DIFFERENT SETS. The header button did
// the OS share sheet or a clipboard copy; the footer block did WhatsApp, X and LinkedIn deeplinks. Two
// placements with two reasons to exist is right and stays; two placements with two feature sets was the
// accident, and the reader met whichever one they happened to reach.
//
// So the set lives here and neither component owns it. `ShareModal` renders it as icon buttons, the
// footer's `ShareLinks` as inline text links — same destinations, different treatment, and a target
// added here appears in both without anyone remembering to add it twice.
//
// URLs are built from SITE_URL, never `window.location.origin`: the footer's anchors are PRERENDERED,
// so at build time the origin is `vite preview`'s and a shared link would carry localhost. The modal
// could read the live origin (it only runs on click) — it does not, because two sources for one URL is
// how the two affordances drifted in the first place.
import type { ComponentType } from 'react';
import { LinkedinMark, WhatsappMark, XMark } from './BrandIcons';
import type { MessageKey } from '../i18n/messages';
import { SITE_URL } from '../lib/site';
import { withShareUtm, type ShareSource } from '../lib/utm';

export interface ShareTarget {
  key: ShareSource;
  label: string;
  /** Its OWN accessible-name key: pt-BR contracts the preposition with the platform's article. */
  nameKey: MessageKey;
  Icon: ComponentType<{ className?: string }>;
  href: (url: string, title: string) => string;
}

/**
 * The destinations, IN THE ORDER BOTH ENTRY POINTS RENDER THEM (#387): LinkedIn, X, WhatsApp.
 *
 * THE ORDER IS PART OF THE SHARED CONTRACT, not a per-component choice. It was briefly not: the modal was
 * reordered first and read a derived `MODAL_TARGETS` so the footer would not move silently before the
 * owner had ruled on it. He then ruled — *"ajusta o rodapé também"* — and the derived list was collapsed
 * back into this one. Keeping a second ordering whose only reason was a divergence that no longer exists
 * is how #314's original drift starts over.
 *
 * THE CLIPBOARD CONTROL IS NOT IN THIS LIST and cannot be: it has no `href` builder and never leaves the
 * page. Both entry points render it FIRST, ahead of this list. That is the one ordering fact this file
 * cannot enforce for them, so it is stated here and asserted in both components' tests.
 *
 * WHY COPY-LINK LEADS, since the opposite is defensible and was argued: the footer's job is distribution,
 * and putting the three deeplinks first suits a reader deciding *where to send it* rather than *how to
 * save it*. That was overruled. Copy-link is the only option that never leaves the page, it is the one
 * the owner ranked first, and in the footer it was last while styled identically to the three deeplinks —
 * so it did not even read as a different KIND of thing. A stated priority contradicted on the surface a
 * reader reaches after finishing the article is worse than a defensible alternative order.
 */
export const SHARE_TARGETS: readonly ShareTarget[] = [
  // LinkedIn ignores any title parameter and reads the OG card from the URL itself — which is why the
  // per-locale OG tags are what actually decides how a shared article looks there.
  {
    key: 'linkedin',
    label: 'LinkedIn',
    nameKey: 'share.onLinkedin',
    Icon: LinkedinMark,
    href: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}`,
  },
  {
    key: 'x',
    label: 'X',
    nameKey: 'share.onX',
    Icon: XMark,
    href: (u, t) => `https://x.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}`,
  },
  // WhatsApp takes ONE `text` parameter — no separate title field — so title and URL are joined with a
  // newline. Without it the two run together in the message box.
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    nameKey: 'share.onWhatsapp',
    Icon: WhatsappMark,
    href: (u, t) => `https://wa.me/?text=${encodeURIComponent(`${t}\n${u}`)}`,
  },
];

/**
 * The absolute, UTM-tagged article URL for one target.
 *
 * TAGGED BEFORE the href builder encodes it (#272). Appending after encoding puts a raw `&` inside
 * WhatsApp's single `text=` field, which WhatsApp reads as its own parameter and truncates the message
 * at — the link still opens and still looks right, so the test asserts on the DECODED inner URL.
 * Verified by mutation: the wrong order leaves every other assertion green.
 *
 * `path` is the LOCALE-PREFIXED article path (`/pt/blog/meu-compromisso`). The slug is per-locale
 * (ADR-0037), so a link built from the wrong edition's slug sends a pt reader an English article — the
 * caller resolves it, nothing here guesses.
 */
export const shareHref = (target: ShareTarget, path: string, title: string): string =>
  target.href(withShareUtm(`${SITE_URL}${path}`, target.key), title);

/** The copy-link destination — the FIRST option in both entry points now (#387), and the only one that
 *  never leaves the page. */
export const copyLinkUrl = (path: string): string => withShareUtm(`${SITE_URL}${path}`, 'copy-link');
