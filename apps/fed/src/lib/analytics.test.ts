import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  analyticsConfigured,
  CONSENT_KEY,
  clearConsent,
  loadAnalytics,
  readConsent,
  resetAnalyticsForTest,
  storeConsent,
  trackPageview,
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
  it('sends the ARRIVAL url as page_location, not whatever the url is when consent lands', () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', ID);
    loadAnalytics();

    const config = (window.dataLayer ?? [])
      .map((entry) => entry as IArguments)
      .find((entry) => entry[0] === 'config');
    expect(config, 'a config command must be queued').toBeDefined();
    expect(config![2]).toEqual({ page_location: window.location.href });
  });

  it('is idempotent — a second call does not inject twice', () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', ID);
    loadAnalytics();
    loadAnalytics();
    expect(gaScripts()).toHaveLength(1);
  });
});

describe('trackPageview', () => {
  it('is a no-op before analytics has loaded', () => {
    const events: unknown[][] = [];
    window.gtag = ((...args: unknown[]) => events.push(args)) as typeof window.gtag;
    // injected flag is false (reset in beforeEach), so trackPageview should not call gtag.
    trackPageview('/somewhere');
    expect(events).toHaveLength(0);
  });

  it('sends a page_view event after load', () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', ID);
    loadAnalytics();
    const pushed: unknown[][] = [];
    window.gtag = ((...args: unknown[]) => pushed.push(args)) as typeof window.gtag;
    trackPageview('/blog/x');
    expect(pushed).toContainEqual(['event', 'page_view', { page_path: '/blog/x' }]);
  });
});
