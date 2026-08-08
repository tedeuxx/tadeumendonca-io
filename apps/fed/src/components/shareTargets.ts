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

export const SHARE_TARGETS: readonly ShareTarget[] = [
  // WhatsApp takes ONE `text` parameter — no separate title field — so title and URL are joined with a
  // newline. Without it the two run together in the message box.
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    nameKey: 'share.onWhatsapp',
    Icon: WhatsappMark,
    href: (u, t) => `https://wa.me/?text=${encodeURIComponent(`${t}\n${u}`)}`,
  },
  {
    key: 'x',
    label: 'X',
    nameKey: 'share.onX',
    Icon: XMark,
    href: (u, t) => `https://x.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}`,
  },
  // LinkedIn ignores any title parameter and reads the OG card from the URL itself — which is why the
  // per-locale OG tags are what actually decides how a shared article looks there.
  {
    key: 'linkedin',
    label: 'LinkedIn',
    nameKey: 'share.onLinkedin',
    Icon: LinkedinMark,
    href: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}`,
  },
];

/**
 * THE MODAL'S ORDER, owner-specified (#387): LinkedIn, then X, then WhatsApp — beneath the two clipboard
 * rows, which the modal renders first.
 *
 * A SEPARATE ORDERING RATHER THAN A REORDER OF `SHARE_TARGETS`, and that is the load-bearing choice here.
 * `SHARE_TARGETS` is rendered by BOTH entry points; reordering it in place would silently reorder the
 * article footer's `ShareLinks` too, and the owner named an order for the MODAL. Whether it binds the
 * footer is his call, so this leaves the footer exactly as it shipped and makes the difference visible
 * instead of inferring an answer. **The two entry points now render the same three destinations in
 * different orders** — deliberate, and reported rather than smoothed over.
 *
 * DERIVED, NOT RETYPED. A second literal list of targets is a second place to add a destination to, and
 * #314 exists because two such lists drifted. This resolves keys against the canonical set and throws on
 * an unknown one; the reverse gap — a target in `SHARE_TARGETS` that nobody ordered — cannot throw here
 * (it would simply be absent), so `ShareButton.test.tsx` asserts the two sets are equal.
 */
const MODAL_TARGET_ORDER: readonly ShareSource[] = ['linkedin', 'x', 'whatsapp'];

export const MODAL_TARGETS: readonly ShareTarget[] = MODAL_TARGET_ORDER.map((key) => {
  const target = SHARE_TARGETS.find((t) => t.key === key);
  if (!target) throw new Error(`MODAL_TARGET_ORDER names "${key}", which is not in SHARE_TARGETS.`);
  return target;
});

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

/** The copy-link destination — in the modal it is the FIRST option, and the only one that never leaves
 *  the page. (In the footer it is still last; that block is unchanged.) */
export const copyLinkUrl = (path: string): string => withShareUtm(`${SITE_URL}${path}`, 'copy-link');
