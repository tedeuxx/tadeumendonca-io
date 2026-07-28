// Cookie/analytics consent notice. Opt-in and shown to everyone (no geo-detection): the strictest
// model, applied globally, so the same surface is valid in every geography. Accept and Decline carry
// equal weight — no pre-ticked box, no buried Decline, no "Accept" styled as the only way out.
//
// Rendered nothing when analytics is unconfigured (preview/prerender/E2E without an id) — there is then
// nothing to consent to. GA loads only on Accept (lib/consent → lib/analytics); Decline loads nothing.
import { useConsent } from '../lib/consent';
import { analyticsConfigured } from '../lib/analytics';
import { useT } from '../i18n';

// Google's own disclosure of how it processes data from sites that embed its tags.
const GOOGLE_PRIVACY_URL = 'https://policies.google.com/technologies/partner-sites';

const buttonBase = 'px-4 py-2 font-mono text-xs uppercase tracking-[0.12em]';

export function ConsentBanner() {
  const { status, accept, reject } = useConsent();
  const t = useT();

  if (!analyticsConfigured() || status !== 'undecided') return null;

  // Positioning lives in AppShell's shared bottom stack (#172): the locale offer can sit above this bar,
  // and hard-coding `fixed bottom-0` on both would have overlapped them or needed a magic height. As a
  // normal block inside the stack, stacking and reflow-on-dismiss come for free.
  return (
    <div
      role="region"
      data-print="hide"
      aria-label={t('consent.notice')}
      className="border-t-2 border-border-strong bg-background px-[--gutter] py-4"
    >
      <div className="mx-auto flex w-full max-w-screen flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t('consent.message')}{' '}
          <a
            href={GOOGLE_PRIVACY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap underline invert-hover"
          >
            {t('consent.learnMore')}
          </a>
        </p>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={reject} className={`${buttonBase} border border-border text-foreground invert-hover`}>
            {t('consent.reject')}
          </button>
          <button type="button" onClick={accept} className={`${buttonBase} bg-primary text-primary-foreground hover:opacity-90`}>
            {t('consent.accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
