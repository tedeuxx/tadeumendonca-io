// Google Analytics 4, loaded ONLY after explicit consent — the same "nothing third-party until the
// reader asks" property the VideoEmbed facade preserves (ADR-0002). This is deliberately NOT Google
// Consent Mode v2: that loads gtag.js immediately and pings Google with a denied signal before the
// reader has chosen. Here nothing reaches Google until Accept. On Reject (or before a choice) the
// script is never injected, no cookie is ever set, and no request is ever made.
//
// Inert when VITE_GA_MEASUREMENT_ID is unset: loadAnalytics() no-ops, so `vite preview`, the build-time
// prerender and the E2E run never emit a hit. Production sets the id in the deploy workflow.

export type ConsentChoice = 'granted' | 'denied';

/** localStorage key holding the reader's consent choice ('granted' | 'denied'), or absent if undecided. */
export const CONSENT_KEY = 'analytics-consent';

// Read per-call (not a load-time const) so it stays inlined by Vite in production yet remains stubbable
// in tests. Empty string → analytics is fully inert.
function measurementId(): string {
  return import.meta.env.VITE_GA_MEASUREMENT_ID ?? '';
}

/** True when a measurement id is configured — analytics is otherwise fully inert. */
export function analyticsConfigured(): boolean {
  return measurementId().length > 0;
}

/** The reader's stored choice, or null when they have not decided yet. Never throws (private-mode safe). */
export function readConsent(): ConsentChoice | null {
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

/** Persist the reader's choice so the banner does not reappear on the next visit. */
export function storeConsent(choice: ConsentChoice): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    /* private mode / storage disabled — the choice simply won't persist across loads. */
  }
}

/** Forget the stored choice — used by the footer "manage" control so consent can be withdrawn/redecided. */
export function clearConsent(): void {
  try {
    window.localStorage.removeItem(CONSENT_KEY);
  } catch {
    /* nothing to clear if storage is unavailable. */
  }
}

let injected = false;

/**
 * Inject gtag.js and start GA4. Idempotent, and a no-op when analytics is unconfigured or there is no
 * document (SSR/prerender). Call ONLY after consent is granted. `config` sends the initial page_view for
 * the page present at load; SPA route changes are sent by trackPageview via usePageviews.
 */
export function loadAnalytics(): void {
  if (injected || !analyticsConfigured() || typeof document === 'undefined') return;
  injected = true;

  const id = measurementId();
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer ?? [];
  const gtag: GtagFn = (...args) => {
    window.dataLayer!.push(args);
  };
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', id);
}

/** Send a page_view for an SPA route change. No-op until gtag is loaded (i.e. before consent). */
export function trackPageview(path: string): void {
  if (!injected || typeof window.gtag !== 'function') return;
  window.gtag('event', 'page_view', { page_path: path });
}

/** Test seam: reset the module's injected flag so a fresh test starts from a clean state. */
export function resetAnalyticsForTest(): void {
  injected = false;
}
