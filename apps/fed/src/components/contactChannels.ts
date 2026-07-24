// Single source of truth for the owner's public contact channels. Both contact surfaces render from
// this one list — the "Where to find me" directory (ContactLinks) and the reader-first "did this help?"
// CTA (ContactFooter) — so the two can never drift apart again. They used to: X lived only in the
// directory, e-mail only in the CTA. Each surface styles the list its own way; the channels are shared.
//
// Medium is deliberately absent — articles are hosted here, this site holds the canonical.
// Every mark inherits the theme accent (see BrandIcons); mailto opens in place, the rest in a new tab.
import type { ComponentType } from 'react';
import { GithubMark, LinkedinMark, MailMark, WhatsappMark, XMark } from './BrandIcons';

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
}

export const CONTACT_CHANNELS: ContactChannel[] = [
  { label: 'GitHub', href: 'https://github.com/tedeuxx', Icon: GithubMark, external: true },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/luiz-tadeu-mendonca-83a16530/', Icon: LinkedinMark, external: true },
  { label: 'X', href: 'https://x.com/tedeuxx', Icon: XMark, external: true },
  { label: 'WhatsApp', href: whatsappHref, Icon: WhatsappMark, external: true },
  { label: 'E-mail', href: `mailto:${CONTACT_EMAIL}`, Icon: MailMark, external: false },
];
