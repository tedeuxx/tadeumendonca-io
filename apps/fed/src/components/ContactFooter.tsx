// Contact footer (#contato) — closes the landing. The CTA is reader-first: it asks whether the
// content helped, not for work. Links are the direct channels (WhatsApp click-to-message, e-mail on
// the site's own domain, GitHub, LinkedIn); the colophon states how the site is built.
//
// Every icon carries the theme accent, WhatsApp included: one palette, no brand colours borrowed.
import { GithubMark, LinkedinMark, MailMark, WhatsappMark } from './BrandIcons';
import { whatsappHref } from './ContactLinks';
import { useT } from '../i18n';

export const CONTACT_EMAIL = 'me@tadeumendonca.io';

const LINKS = [
  { label: 'WhatsApp', href: whatsappHref, Icon: WhatsappMark, external: true },
  { label: 'E-mail', href: `mailto:${CONTACT_EMAIL}`, Icon: MailMark, external: false },
  { label: 'GitHub', href: 'https://github.com/tedeuxx', Icon: GithubMark, external: true },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/luiz-tadeu-mendonca-83a16530/', Icon: LinkedinMark, external: true },
];

export function ContactFooter() {
  const t = useT();
  return (
    <footer id="contato" className="scroll-mt-[--header-h] border-t-2 border-border-strong px-[--gutter] pb-[clamp(2rem,4vw,3rem)] pt-[clamp(3rem,7vw,6rem)]">
      <h2 className="mb-[clamp(1.5rem,4vw,2.5rem)] text-balance text-[clamp(2.1rem,8vw,7rem)] font-bold uppercase leading-[0.92] tracking-[-0.045em]">
        {t('contact.heading')}
        <span className="text-primary">.</span>
      </h2>

      <div className="mb-[clamp(2.5rem,5vw,4rem)] flex flex-wrap">
        {LINKS.map(({ label, href, Icon, external }) => (
          <a
            key={label}
            href={href}
            {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
            className="-mb-px -mr-px inline-flex items-center gap-2 border border-border-strong px-5 py-3.5 font-mono text-sm uppercase tracking-wider invert-hover"
          >
            <Icon className="shrink-0 text-primary" />
            {label}
          </a>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-1 border-t border-border pt-4">
        <span className="label-mono">tadeumendonca.io</span>
        <span className="label-mono">Built agent-first · Claude Code</span>
        <span className="label-mono">São Paulo — BR</span>
      </div>
    </footer>
  );
}
