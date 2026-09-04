// #597 slice B. `nav_click`, and the ONE property that is the reason the event exists at all:
// IT IS EMITTED AT THE CLICK, while the origin page is still known.
//
// WHY THIS FILE'S ASSERTIONS ARE SHAPED THE WAY THEY ARE. `/#contato` is a plain anchor, so reaching
// contact from `/architecture` is a full document load: the origin is gone and `window.dataLayer` is
// discarded before anything on the landing runs. An implementation that emitted from an effect after
// navigation would report `from: 'home'` for exactly those journeys and would look perfectly healthy
// doing it. So every assertion below pins `from` to the ORIGIN — a value a post-navigation emitter
// cannot produce, because by then the origin no longer exists anywhere. An assertion that only checked
// `to`, or only checked that some `nav_click` was emitted, would survive that mutation and would be
// testing nothing.
//
// The browser-level half — that the event is in `dataLayer` BEFORE the document load discards it — is in
// `e2e/analytics-events.spec.ts`, which is the only place a real full-page navigation happens.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { AppShell } from './AppShell';
import { renderWithLocale } from '../test-utils';
import { loadAnalytics, resetAnalyticsForTest, storeConsent } from '../lib/analytics';

const ID = 'G-TEST12345';

let pushed: unknown[][];
const navEvents = () => pushed.filter((entry) => entry[1] === 'nav_click');

function shellAt(initialPath: string) {
  const view = renderWithLocale(
    <AppShell>
      <div>child content</div>
    </AppShell>,
    { locale: 'pt', initialPath },
  );
  // Installed AFTER render so the mount-time `page_view` from `usePageviews` is not in the capture —
  // this file is about clicks, and `usePageviews.test.tsx` already owns that one.
  pushed = [];
  window.gtag = ((...args: unknown[]) => pushed.push(args)) as typeof window.gtag;
  return view;
}

/** jsdom cannot navigate and the anchor branch is a real `<a href>`. Swallowing the default at the
 *  DOCUMENT — the outermost node, so it runs after every handler under test — keeps the run quiet
 *  without touching `AppShell`. */
const swallow = (event: Event) => event.preventDefault();

beforeEach(() => {
  document.addEventListener('click', swallow);
  pushed = [];
  window.localStorage.clear();
  delete window.gtag;
  delete window.dataLayer;
  resetAnalyticsForTest();
  vi.stubEnv('VITE_GA_MEASUREMENT_ID', ID);
  storeConsent('granted');
  loadAnalytics();
});

afterEach(() => {
  document.removeEventListener('click', swallow);
  vi.unstubAllEnvs();
});

describe('nav_click — the origin is the page being LEFT', () => {
  // THE JOURNEY THE OWNER RULED ON. `/architecture` → the landing's contact anchor, which in a browser
  // is a full document load. `from: 'architecture'` is unobtainable after that load.
  it('reports from=architecture to=contact for the anchor that triggers a full document load', () => {
    shellAt('/pt/architecture');
    fireEvent.click(screen.getByRole('link', { name: 'Contato' }));
    expect(navEvents()).toEqual([['event', 'nav_click', { locale: 'pt', from: 'architecture', to: 'contact' }]]);
  });

  // The route branch. Client-side navigation, so a post-navigation emitter WOULD still find a location —
  // it would just be the wrong one (`library`), which is why the assertion is on `from` and not merely
  // on the event's presence.
  it('reports from=me to=library for a route link', () => {
    shellAt('/pt/me');
    fireEvent.click(screen.getByRole('link', { name: 'Biblioteca' }));
    expect(navEvents()).toEqual([['event', 'nav_click', { locale: 'pt', from: 'me', to: 'library' }]]);
  });

  it('reports from=article when the reader leaves an article', () => {
    shellAt('/pt/blog/meu-compromisso');
    fireEvent.click(screen.getByRole('link', { name: 'Contato' }));
    expect(navEvents()).toEqual([['event', 'nav_click', { locale: 'pt', from: 'article', to: 'contact' }]]);
  });

  it('reports from=home when the reader is already on the landing', () => {
    shellAt('/pt');
    fireEvent.click(screen.getByRole('link', { name: 'Artigos' }));
    expect(navEvents()).toEqual([['event', 'nav_click', { locale: 'pt', from: 'home', to: 'articles' }]]);
  });

  // The brand is the only route to `home` in the header. Without it that member of the vocabulary would
  // be registered and never emitted.
  it('reports to=home for the brand', () => {
    shellAt('/pt/architecture');
    fireEvent.click(screen.getByText('tadeumendonca'));
    expect(navEvents()).toEqual([['event', 'nav_click', { locale: 'pt', from: 'architecture', to: 'home' }]]);
  });
});

describe('nav_click — what is NOT a nav click', () => {
  // A negative with its positive twin in the same test: the toggle emits nothing, the nav item beside it
  // does. Without the second half this would pass on an implementation that emitted nothing anywhere.
  it('emits nothing for the PT/EN toggle, which changes edition rather than page type', () => {
    shellAt('/pt/architecture');
    fireEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(navEvents()).toEqual([]);
    fireEvent.click(screen.getByRole('link', { name: /Contato|Contact/ }));
    expect(navEvents()).toHaveLength(1);
  });

  it('emits nothing for the skip link', () => {
    shellAt('/pt/architecture');
    fireEvent.click(screen.getByRole('link', { name: 'Pular para o conteúdo' }));
    expect(navEvents()).toEqual([]);
  });
});

describe('nav_click — the consent gate', () => {
  it('emits nothing when the reader has not consented', () => {
    window.localStorage.clear();
    shellAt('/pt/architecture');
    fireEvent.click(screen.getByRole('link', { name: 'Contato' }));
    expect(navEvents()).toEqual([]);
  });

  // WITHDRAWN AFTER GRANTED. gtag stays loaded and the handler stays attached; only `trackEvent`
  // re-reading the stored choice per call stops the emission.
  it('goes silent after consent is withdrawn mid-session', () => {
    shellAt('/pt/architecture');
    fireEvent.click(screen.getByRole('link', { name: 'Contato' }));
    expect(navEvents()).toHaveLength(1);
    window.localStorage.clear();
    fireEvent.click(screen.getByRole('link', { name: 'Contato' }));
    expect(navEvents()).toHaveLength(1);
  });
});
