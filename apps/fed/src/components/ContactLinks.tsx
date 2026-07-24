// The "Where to find me" directory. Renders the shared contact channels (see contactChannels), so it
// stays in sync with the ContactFooter CTA — both list the same channels in the same order.
// Deep-links use the universal https:// URLs: on mobile these open the native app when installed, with
// a reliable web fallback. The mailto stays in the same tab; the outbound links open in a new one.
import { CONTACT_CHANNELS } from './contactChannels';
import { useT } from '../i18n';

// `title` is optional: when the caller omits it (the landing aside), it falls back to the localized
// default; the contact region passes its own heading.
export function ContactLinks({ title }: { title?: string }) {
  const t = useT();
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="h-4 w-1.5 shrink-0 bg-primary" />
        <h3 className="label-mono text-foreground">{title ?? t('contactLinks.defaultTitle')}</h3>
      </div>
      <ul>
        {CONTACT_CHANNELS.map(({ label, href, Icon, external }) => (
          <li key={label}>
            <a
              href={href}
              {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
              className="flex items-center gap-3 border-t border-border py-2.5 font-mono text-sm uppercase tracking-wider transition-[padding] duration-150 hover:pl-2"
            >
              <Icon className="shrink-0 text-primary" />
              <span>{label}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
