// #597 slice B. `share_open` — the denominator `share_complete` never had.
//
// THE LIMIT IS ASSERTED, NOT ONLY DOCUMENTED. `share_open` is emitted where a share affordance is
// OPENED, and on this site that is the `ShareButton` trigger and nothing else: the article footer's
// `ShareLinks` block is always visible, so a reader can reach `share_complete` from it having opened
// nothing. Slice A shipped `share_complete` with no parameter naming its entry point and that name is
// immutable, so the ratio is exact for the modal and over-counted at the site level. The test below
// pins that shape rather than letting a later reader assume a clean funnel — if `share_open` ever
// starts coming out of the footer block, this reddens and the discussion happens before it collects.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { ShareButton } from './ShareButton';
import { ShareLinks } from './ShareLinks';
import { renderWithLocale } from '../test-utils';
import { loadAnalytics, resetAnalyticsForTest, storeConsent } from '../lib/analytics';

const ID = 'G-TEST12345';
const PT_PATH = '/pt/blog/meu-compromisso';
const SLUG = 'meu-compromisso';

let pushed: unknown[][];
const openEvents = () => pushed.filter((entry) => entry[1] === 'share_open');

/** jsdom cannot navigate and the deeplinks are real anchors — swallow the default at the DOCUMENT, the
 *  outermost node, so it runs after every handler under test. */
const swallow = (event: Event) => event.preventDefault();

/** Replace the loaded shim with a capture. In a function, not inline in `beforeEach`: after
 *  `delete window.gtag` TypeScript narrows the property to `undefined`, so the cast is rejected at the
 *  assignment site and accepted here. The same shape `shareComplete.test.tsx` uses. */
function capture() {
  window.gtag = ((...args: unknown[]) => pushed.push(args)) as typeof window.gtag;
}

beforeEach(() => {
  pushed = [];
  window.localStorage.clear();
  delete window.gtag;
  delete window.dataLayer;
  resetAnalyticsForTest();
  document.addEventListener('click', swallow);
  vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  vi.stubEnv('VITE_GA_MEASUREMENT_ID', ID);
  storeConsent('granted');
  loadAnalytics();
  capture();
});

afterEach(() => {
  document.removeEventListener('click', swallow);
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('share_open', () => {
  it('emits with the slug when the reader opens the modal', () => {
    renderWithLocale(<ShareButton title="Hello" url={PT_PATH} slug={SLUG} body="Corpo." />, { locale: 'pt' });
    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));
    expect(openEvents()).toEqual([['event', 'share_open', { locale: 'pt', slug: SLUG }]]);
  });

  // The slug is the CALLER's value, not a slice of `url`. `ArticlePage` passes the edition's own slug
  // (ADR-0037 makes it per-locale) and `MarkdownPage` passes its canonical path; asserting a slug that
  // does not appear in `url` at all is what pins that.
  it('reports the slug the caller passed, never one derived from the url', () => {
    renderWithLocale(<ShareButton title="Hello" url={PT_PATH} slug="architecture" body="Corpo." />, {
      locale: 'pt',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));
    expect(openEvents()).toEqual([['event', 'share_open', { locale: 'pt', slug: 'architecture' }]]);
  });

  it('emits once per open, so a reader who opens twice is two opens', () => {
    renderWithLocale(<ShareButton title="Hello" url={PT_PATH} slug={SLUG} body="Corpo." />, { locale: 'pt' });
    const trigger = screen.getByRole('button', { name: 'Compartilhar' });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));
    expect(openEvents()).toHaveLength(2);
  });

  // THE LIMIT. The footer block offers the same destinations and opens nothing — so it emits
  // `share_complete` with no `share_open` ahead of it. The positive twin sits in the same test: the
  // modal trigger rendered beside it DOES emit, so this is not a pair of assertions that would both
  // pass on an implementation emitting nothing anywhere.
  it('does NOT come from the always-visible footer block, whose shares therefore have no denominator', () => {
    renderWithLocale(
      <>
        <ShareLinks title="Hello" path={PT_PATH} />
        <ShareButton title="Hello" url={PT_PATH} slug={SLUG} body="Corpo." />
      </>,
      { locale: 'pt' },
    );
    fireEvent.click(screen.getByRole('link', { name: 'Compartilhar no LinkedIn: Hello' }));
    expect(openEvents()).toEqual([]);
    // …and `share_complete` DID come out of it, which is what makes the ratio uneven rather than the
    // footer simply being uninstrumented.
    expect(pushed.filter((entry) => entry[1] === 'share_complete')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));
    expect(openEvents()).toHaveLength(1);
  });
});

describe('share_open — the consent gate', () => {
  it('emits nothing when the reader has not consented', () => {
    window.localStorage.clear();
    renderWithLocale(<ShareButton title="Hello" url={PT_PATH} slug={SLUG} body="Corpo." />, { locale: 'pt' });
    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));
    expect(openEvents()).toEqual([]);
  });

  it('goes silent after consent is withdrawn mid-session', () => {
    renderWithLocale(<ShareButton title="Hello" url={PT_PATH} slug={SLUG} body="Corpo." />, { locale: 'pt' });
    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));
    expect(openEvents()).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    window.localStorage.clear();
    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));
    expect(openEvents()).toHaveLength(1);
  });
});
