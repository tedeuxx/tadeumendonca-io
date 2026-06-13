// Social links widget for the right-hand "components" zone (xl+). The owner's handles across
// networks + a WhatsApp click-to-message link. All links open in a new tab.
// Deeplinks use the universal https:// URLs: on mobile these open the native app when installed,
// with a reliable web fallback (custom schemes like instagram:// are flaky on the web).
import { Github, Linkedin, BookOpen, MessageCircle, type LucideIcon } from 'lucide-react';

interface SocialLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

// WhatsApp click-to-message (public wa.me API): opens the chat with a pre-filled message.
const WHATSAPP_NUMBER = '5521986619954';
const WHATSAPP_MESSAGE = 'Olá Tadeu, vim pelo tadeumendonca.io';
const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

const LINKS: SocialLink[] = [
  { label: 'GitHub', href: 'https://github.com/tedeuxx', icon: Github },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/luiz-tadeu-mendonca-83a16530/', icon: Linkedin },
  { label: 'Medium', href: 'https://tadeumendonca.medium.com', icon: BookOpen },
  { label: 'WhatsApp', href: whatsappHref, icon: MessageCircle },
];

export function SocialLinksWidget() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-4 w-1.5 rounded-sm bg-primary" />
        <h2 className="font-display font-bold">Onde me encontrar</h2>
      </div>
      <ul className="flex flex-col gap-1">
        {LINKS.map(({ label, href, icon: Icon }) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Icon size={18} className="shrink-0 text-primary" />
              <span className="font-medium">{label}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
