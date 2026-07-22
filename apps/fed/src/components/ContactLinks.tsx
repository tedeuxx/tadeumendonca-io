// Contact links (/frontend/design-system). The owner's public handles + a WhatsApp click-to-message
// link, all opening in a new tab. Deep-links use the universal https:// URLs: on mobile these open
// the native app when installed, with a reliable web fallback.
//
// Medium is deliberately absent — articles are hosted here, this site holds the canonical.
// WhatsApp keeps its own brand green: the one contained exception to the single-accent rule.
import { GithubMark, LinkedinMark, WhatsappMark } from './BrandIcons';

export const WHATSAPP_NUMBER = '5521986619954';
const WHATSAPP_MESSAGE = 'Olá Tadeu, vim pelo tadeumendonca.io';
export const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

const LINKS = [
  { label: 'GitHub', href: 'https://github.com/tedeuxx', Icon: GithubMark, className: 'text-primary' },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/luiz-tadeu-mendonca-83a16530/',
    Icon: LinkedinMark,
    className: 'text-primary',
  },
  { label: 'WhatsApp', href: whatsappHref, Icon: WhatsappMark, className: 'text-[#25D366]' },
];

export function ContactLinks({ title = 'Onde me encontrar' }: { title?: string }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="h-4 w-1.5 shrink-0 bg-primary" />
        <h3 className="label-mono text-foreground">{title}</h3>
      </div>
      <ul>
        {LINKS.map(({ label, href, Icon, className }) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 border-t border-border py-2.5 font-mono text-sm uppercase tracking-wider transition-[padding] duration-150 hover:pl-2"
            >
              <Icon className={`shrink-0 ${className}`} />
              <span>{label}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
