// Single source of truth for the owner's public contact channels. Both contact surfaces render from
// this one list — the "Where to find me" directory (ContactLinks) and the reader-first "did this help?"
// CTA (ContactFooter) — so the two can never drift apart again. They used to: X lived only in the
// directory, e-mail only in the CTA. Each surface styles the list its own way; the channels are shared.
//
// Medium is deliberately absent — articles are hosted here, this site holds the canonical.
// Every mark inherits the theme accent (see BrandIcons); mailto opens in place, the rest in a new tab.
import type { ComponentType } from 'react';
import { GithubMark, LinkedinMark, MailMark, WhatsappMark, XMark } from './BrandIcons';
import type { ContactTarget } from '../lib/analytics';

export const WHATSAPP_NUMBER = '5521986619954';
const WHATSAPP_MESSAGE = 'Olá Tadeu, vim pelo tadeumendonca.io';
export const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
export const CONTACT_EMAIL = 'me@tadeumendonca.io';

export interface ContactChannel {
  label: string;
  href: string;
  Icon: ComponentType<{ className?: string }>;
  // Outbound links open in a new tab; the mailto stays in place (external: false).
  external: boolean;
  /**
   * The `contact_click` dimension value for this channel (#597), stated per channel rather than derived
   * from `label`. A display string is a copy decision — "E-mail" could become "Email" tomorrow without
   * anyone thinking about analytics — and a GA4 dimension value cannot be renamed after it ships, so
   * deriving one from the other couples an immutable series to a mutable word.
   */
  analyticsTarget: ContactTarget;
}

export const CONTACT_CHANNELS: ContactChannel[] = [
  { label: 'GitHub', href: 'https://github.com/tedeuxx', Icon: GithubMark, external: true, analyticsTarget: 'github' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/luiz-tadeu-mendonca-83a16530/', Icon: LinkedinMark, external: true, analyticsTarget: 'linkedin' },
  { label: 'X', href: 'https://x.com/tedeuxx', Icon: XMark, external: true, analyticsTarget: 'x' },
  { label: 'WhatsApp', href: whatsappHref, Icon: WhatsappMark, external: true, analyticsTarget: 'whatsapp' },
  { label: 'E-mail', href: `mailto:${CONTACT_EMAIL}`, Icon: MailMark, external: false, analyticsTarget: 'email' },
];

/**
 * `href` → dimension value, for the delegated `contact_click` listener (#597).
 *
 * CLASSIFICATION IS BY EXACT HREF, NOT BY HOSTNAME, and that is the whole correctness argument rather
 * than an implementation preference. Three of these five channels share a hostname with a SHARE
 * destination — `linkedin.com`, `x.com` and `wa.me` are each reachable from the share modal — so a
 * hostname rule would report every share to LinkedIn as a click on the owner's LinkedIn profile, and
 * the career funnel's terminal event would be inflated by the content funnel's. The two events would
 * still both look plausible, which is what makes it worth stating.
 *
 * The consequence, said plainly: a contact link written anywhere with a differently-spelled href — a
 * trailing slash, `linkedin.com/in/...` without `www` — is invisible to this listener. That is the
 * intended failure direction (silence, never a wrong attribution), and this list is already the single
 * source both contact surfaces render from, so a new channel arrives here or it does not exist.
 */
export const CONTACT_TARGET_BY_HREF: ReadonlyMap<string, ContactTarget> = new Map(
  CONTACT_CHANNELS.map((channel) => [channel.href, channel.analyticsTarget]),
);
