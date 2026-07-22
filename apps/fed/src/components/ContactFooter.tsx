// Contact footer (#contato) — closes the landing. The CTA is reader-first: it asks whether the
// content helped, not for work. Links are the direct channels (WhatsApp click-to-message, e-mail on
// the site's own domain, GitHub, LinkedIn); the colophon states how the site is built.
//
// WhatsApp keeps its brand green — the single contained exception to the one-accent rule.
import { GithubMark, LinkedinMark, MailMark, WhatsappMark } from './BrandIcons';
import { whatsappHref } from './ContactLinks';

export const CONTACT_EMAIL = 'me@tadeumendonca.io';

const LINKS = [
  { label: 'WhatsApp', href: whatsappHref, Icon: WhatsappMark, className: 'text-[#25D366]', external: true },
  { label: 'E-mail', href: `mailto:${CONTACT_EMAIL}`, Icon: MailMark, className: 'text-primary', external: false },
  { label: 'GitHub', href: 'https://github.com/tedeuxx', Icon: GithubMark, className: 'text-primary', external: true },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/luiz-tadeu-mendonca-83a16530/',
    Icon: LinkedinMark,
    className: 'text-primary',
    external: true,
  },
];

export function ContactFooter() {
  return (
    <footer id="contato" className="scroll-mt-[--header-h] border-t-2 border-border-strong px-[--gutter] pb-[clamp(2rem,4vw,3rem)] pt-[clamp(3rem,7vw,6rem)]">
      <h2 className="mb-[clamp(1.5rem,4vw,2.5rem)] text-balance text-[clamp(2.1rem,8vw,7rem)] font-bold uppercase leading-[0.92] tracking-[-0.045em]">
        Algo aqui te ajudou? Me conta<span className="text-primary">.</span>
      </h2>

      <div className="mb-[clamp(2.5rem,5vw,4rem)] flex flex-wrap">
        {LINKS.map(({ label, href, Icon, className, external }) => (
          <a
            key={label}
            href={href}
            {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
            className="-mb-px -mr-px inline-flex items-center gap-2 border border-border-strong px-5 py-3.5 font-mono text-sm uppercase tracking-wider invert-hover"
          >
            <Icon className={`shrink-0 ${className}`} />
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
