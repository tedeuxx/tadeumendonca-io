// Contact footer (#contato) — closes the landing. The CTA is reader-first: it asks whether the
// content helped, not for work. It renders the shared contact channels (see contactChannels) as button
// chips, so it stays in sync with the "Where to find me" directory; the colophon states how the site is
// built. The mailto stays in the same tab; the outbound links open in a new one.
import { CONTACT_CHANNELS } from './contactChannels';
import { useT } from '../i18n';

// Re-exported for callers/tests that reference the site's own contact address.
export { CONTACT_EMAIL } from './contactChannels';

export function ContactFooter() {
  const t = useT();
  return (
    <footer id="contato" className="scroll-mt-[--header-h] border-t-2 border-border-strong px-[--gutter] pb-[clamp(2rem,4vw,3rem)] pt-[clamp(3rem,7vw,6rem)]">
      <h2 className="mb-[clamp(1.5rem,4vw,2.5rem)] text-balance text-[clamp(2.1rem,8vw,7rem)] font-bold uppercase leading-[0.92] tracking-[-0.045em]">
        {t('contact.heading')}
        <span className="text-primary">.</span>
      </h2>

      <div className="mb-[clamp(2.5rem,5vw,4rem)] flex flex-wrap">
        {CONTACT_CHANNELS.map(({ label, href, Icon, external }) => (
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
