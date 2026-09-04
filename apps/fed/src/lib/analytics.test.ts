import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  analyticsConfigured,
  CONSENT_KEY,
  clearConsent,
  loadAnalytics,
  readConsent,
  resetAnalyticsForTest,
  storeConsent,
  trackArticleEndReached,
  trackArticleProgress,
  trackContactClick,
  trackEvent,
  trackPageview,
  trackShareComplete,
} from './analytics';

const ID = 'G-TEST12345';

function gaScripts() {
  return Array.from(document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]'));
}

beforeEach(() => {
  window.localStorage.clear();
  document.head.querySelectorAll('script').forEach((s) => s.remove());
  delete window.gtag;
  delete window.dataLayer;
  resetAnalyticsForTest();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('configuration', () => {
  it('is inert when no measurement id is set', () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', '');
    expect(analyticsConfigured()).toBe(false);
  });

  it('is configured when a measurement id is set', () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', ID);
    expect(analyticsConfigured()).toBe(true);
  });
});

describe('consent storage', () => {
  it('reads null before any choice', () => {
    expect(readConsent()).toBeNull();
  });

  it('round-trips a granted choice', () => {
    storeConsent('granted');
    expect(readConsent()).toBe('granted');
  });

  it('round-trips a denied choice', () => {
    storeConsent('denied');
    expect(readConsent()).toBe('denied');
  });

  it('treats a garbage stored value as undecided', () => {
    window.localStorage.setItem(CONSENT_KEY, 'maybe');
    expect(readConsent()).toBeNull();
  });

  it('clears a stored choice', () => {
    storeConsent('granted');
    clearConsent();
    expect(readConsent()).toBeNull();
  });

  it('never throws when storage is unavailable', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(readConsent()).toBeNull();
    spy.mockRestore();
  });
});

describe('loadAnalytics', () => {
  it('injects nothing when unconfigured', () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', '');
    loadAnalytics();
    expect(gaScripts()).toHaveLength(0);
    expect(window.gtag).toBeUndefined();
  });

  it('injects gtag.js with the configured id when configured', () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', ID);
    loadAnalytics();
    const scripts = gaScripts();
    expect(scripts).toHaveLength(1);
    expect(scripts[0].getAttribute('src')).toContain(`id=${ID}`);
    expect(typeof window.gtag).toBe('function');
    // js + config pushed to the dataLayer.
    expect((window.dataLayer ?? []).length).toBeGreaterThanOrEqual(2);
  });

  // The #190 regression guard. A count assertion (the line above) CANNOT catch that bug: the broken
  // shim was callable and did grow the queue — it just queued Arrays, and gtag.js only honours a
  // dataLayer entry as a command when it is an `arguments` object. The queue was green while GA4
  // received nothing, so the SHAPE is what has to be asserted, not the length.
  it('queues gtag commands as `arguments` objects, not Arrays — gtag.js ignores Arrays', () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', ID);
    loadAnalytics();

    const shapes = (window.dataLayer ?? []).map((entry) => Object.prototype.toString.call(entry));
    expect(shapes.length).toBeGreaterThanOrEqual(2);
    expect(shapes).not.toContain('[object Array]');
    for (const shape of shapes) expect(shape).toBe('[object Arguments]');

    // And the queued commands are the two that actually start GA4.
    const commands = (window.dataLayer ?? []).map((entry) => (entry as IArguments)[0]);
    expect(commands).toContain('js');
    expect(commands).toContain('config');
  });

  // #272. GA4 reads utm_* from `page_location` on the FIRST hit of a session, and here that hit is this
  // `config` call — which by ADR-0033 fires only after the reader accepts. Without an explicit
  // page_location, gtag.js reads document.location AT CONSENT TIME, and a new reader who arrived from a
  // shared link, read, navigated within the SPA and only then accepted is attributed `(direct)`. That
  // reader is precisely the population the campaign tagging exists to count, so the under-count would
  // be both invisible and concentrated exactly where it matters. The assertion is on the third argument
  // because dropping it produces no error, no warning, and a plausible-looking smaller number.
  it('sends the ARRIVAL url as page_location, not whatever the url is when consent lands', async () => {
    // The URL is CHANGED between module load and loadAnalytics(), and that is the entire test. Reading
    // window.location.href at assertion time instead would leave the mutation this is named for —
    // inlining `page_location: window.location.href` at the config call — green, because in a test that
    // never navigates the two are the same string. That is the round-1 mistake repeated in a unit test.
    history.pushState({}, '', '/pt/blog/meu-compromisso?utm_source=whatsapp&utm_campaign=reader-share');
    const arrival = window.location.href;

    // Re-evaluate the module so the capture happens while the tagged URL is current — this is a
    // module-load constant by design, so a plain import would have captured the suite's own URL.
    vi.resetModules();
    const analytics = await import('./analytics');

    // Now the reader reads, navigates within the SPA, and only THEN accepts. The tagged URL is gone.
    history.pushState({}, '', '/pt/ramp-up');
    expect(window.location.href).not.toBe(arrival);

    vi.stubEnv('VITE_GA_MEASUREMENT_ID', ID);
    analytics.loadAnalytics();

    const config = (window.dataLayer ?? [])
      .map((entry) => entry as IArguments)
      .find((entry) => entry[0] === 'config');
    expect(config, 'a config command must be queued').toBeDefined();
    expect(config![2]).toEqual({ page_location: arrival });
  });

  it('is idempotent — a second call does not inject twice', () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', ID);
    loadAnalytics();
    loadAnalytics();
    expect(gaScripts()).toHaveLength(1);
  });
});

/**
 * Put the module in the state a consenting reader is in — loaded AND granted — and return the array
 * every subsequent emission lands in.
 *
 * The gtag stub is installed AFTER `loadAnalytics`, deliberately: the loader's own `js`/`config`
 * commands go to the real queue, so what this array holds is exactly the events under test.
 */
function consentingReader(): unknown[][] {
  vi.stubEnv('VITE_GA_MEASUREMENT_ID', ID);
  storeConsent('granted');
  loadAnalytics();
  const pushed: unknown[][] = [];
  window.gtag = ((...args: unknown[]) => pushed.push(args)) as typeof window.gtag;
  return pushed;
}

describe('trackPageview', () => {
  it('is a no-op before analytics has loaded', () => {
    const events: unknown[][] = [];
    window.gtag = ((...args: unknown[]) => events.push(args)) as typeof window.gtag;
    // injected flag is false (reset in beforeEach), so trackPageview should not call gtag.
    trackPageview('/somewhere');
    expect(events).toHaveLength(0);
  });

  it('sends a page_view event after load', () => {
    const pushed = consentingReader();
    trackPageview('/blog/x');
    expect(pushed).toContainEqual(['event', 'page_view', { page_path: '/blog/x' }]);
  });

  // #597. THE DEFECT THIS SLICE REPAIRS, at the page_view it was already costing. `reopen()` clears the
  // stored choice and cannot un-inject gtag, so a guard keyed on `injected` alone kept reporting a
  // reader who had just withdrawn. MUTATION-CHECKED against the source, not read: dropping
  // `readConsent() === 'granted'` back out of `mayEmit` reddens exactly four assertions across the
  // whole suite — this one, the two below it, and the withdrawal journey in `usePageviews.test.tsx` —
  // and leaves the other 1,212 green. Before this slice, all four passed with no consent recorded.
  it('is SILENT after the reader withdraws consent, with gtag still injected', () => {
    const pushed = consentingReader();
    clearConsent();
    trackPageview('/blog/x');
    expect(typeof window.gtag).toBe('function');
    expect(pushed).toHaveLength(0);
  });

  it('is SILENT when the reader declined but analytics was loaded earlier in the session', () => {
    const pushed = consentingReader();
    storeConsent('denied');
    trackPageview('/blog/x');
    expect(pushed).toHaveLength(0);
  });
});

describe('trackEvent and the named emitters', () => {
  it('is a no-op before analytics has loaded', () => {
    const events: unknown[][] = [];
    window.gtag = ((...args: unknown[]) => events.push(args)) as typeof window.gtag;
    storeConsent('granted');
    trackEvent('share_complete', { locale: 'pt', target: 'linkedin' });
    expect(events).toHaveLength(0);
  });

  it('emits with the reader consenting', () => {
    const pushed = consentingReader();
    trackEvent('share_complete', { locale: 'pt', target: 'linkedin' });
    expect(pushed).toContainEqual(['event', 'share_complete', { locale: 'pt', target: 'linkedin' }]);
  });

  it('is SILENT after a withdrawal, in the same session', () => {
    const pushed = consentingReader();
    clearConsent();
    trackEvent('share_complete', { locale: 'pt', target: 'linkedin' });
    expect(pushed).toHaveLength(0);
  });

  // The schema, asserted as the shape it will be REGISTERED under in the GA4 property. A dimension is
  // not retroactive: anything emitted before its registration exists is unqueryable for that period,
  // permanently — so a parameter silently renamed here is not a reporting inconvenience, it is a hole
  // in the series with no way to backfill it.
  it('carries the declared parameter spine on each event, and no `path`', () => {
    const pushed = consentingReader();
    trackArticleProgress({ locale: 'en', slug: 'my-commitment', percent: 50 });
    trackArticleEndReached({ locale: 'en', slug: 'my-commitment' });
    trackShareComplete({ locale: 'pt', target: 'copy-markdown' });
    trackContactClick({ locale: 'pt', target: 'email' });

    expect(pushed).toEqual([
      ['event', 'article_progress', { locale: 'en', slug: 'my-commitment', percent: 50 }],
      ['event', 'article_end_reached', { locale: 'en', slug: 'my-commitment' }],
      ['event', 'share_complete', { locale: 'pt', target: 'copy-markdown' }],
      ['event', 'contact_click', { locale: 'pt', target: 'email' }],
    ]);

    // `page_path`/`page_location` are GA4's own, attached to every hit; a custom `path` would duplicate
    // a free dimension and spend a registration slot on the duplicate (ADR-0039's `utm_content` call).
    for (const [, , params] of pushed) {
      expect(params).not.toHaveProperty('path');
      expect(params).toHaveProperty('locale');
    }
  });
});
