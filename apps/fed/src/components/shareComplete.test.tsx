// #597. `share_complete` from BOTH entry points, in one file, because the property under test spans
// them: #314 made the modal and the footer block offer the same destinations, so instrumenting one and
// not the other would turn the content funnel's terminal event into a measurement of which affordance
// the reader happened to be nearer. A per-component test would pass on either half alone.
//
// The five destinations are driven off `SHARE_TARGETS` rather than typed out, so a target added to the
// shared list without an emitter reddens here instead of going quietly uncounted.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { ShareButton } from './ShareButton';
import { ShareLinks } from './ShareLinks';
import { SHARE_TARGETS } from './shareTargets';
import { renderWithLocale } from '../test-utils';
import { loadAnalytics, resetAnalyticsForTest, storeConsent } from '../lib/analytics';

const ID = 'G-TEST12345';
const PT_PATH = '/pt/blog/meu-compromisso';

let pushed: unknown[][];

/** jsdom cannot navigate, and every deeplink here is a real anchor. Swallowing the default at the
 *  DOCUMENT — the outermost node, so it runs after every handler under test — keeps the run quiet
 *  without touching a single component. */
const swallow = (event: Event) => event.preventDefault();

function consenting() {
  vi.stubEnv('VITE_GA_MEASUREMENT_ID', ID);
  storeConsent('granted');
  loadAnalytics();
  pushed = [];
  window.gtag = ((...args: unknown[]) => pushed.push(args)) as typeof window.gtag;
}

const shareEvents = () => pushed.filter((entry) => entry[1] === 'share_complete');

beforeEach(() => {
  window.localStorage.clear();
  delete window.gtag;
  delete window.dataLayer;
  resetAnalyticsForTest();
  document.addEventListener('click', swallow);
  vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  consenting();
});

afterEach(() => {
  document.removeEventListener('click', swallow);
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('share_complete — the modal', () => {
  const open = () => {
    renderWithLocale(<ShareButton title="Hello" url={PT_PATH} slug="probe-slug" body="Corpo." />, { locale: 'pt' });
    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));
    return screen.getByRole('dialog');
  };

  it.each(SHARE_TARGETS.map((target) => [target.label, target.key]))(
    'emits target=%s when the reader picks %s',
    (label, key) => {
      const dialog = open();
      fireEvent.click(within(dialog).getByText(label));
      expect(shareEvents()).toEqual([['event', 'share_complete', { locale: 'pt', target: key }]]);
    },
  );

  // The two clipboard rows are awaited rather than asserted synchronously: the copy is a promise, and
  // its resolution moves the row into its "copied" state after the click returns. Nothing about the
  // event depends on that — it is emitted at the choice, ahead of the write, which is exactly why the
  // assertion holds even though the outcome is still pending.
  it('emits target=copy-link for the clipboard row', async () => {
    const dialog = open();
    fireEvent.click(within(dialog).getByText('Copiar link para a área de transferência'));
    await waitFor(() =>
      expect(shareEvents()).toEqual([['event', 'share_complete', { locale: 'pt', target: 'copy-link' }]]),
    );
  });

  it('emits target=copy-markdown for the markdown row', async () => {
    const dialog = open();
    fireEvent.click(within(dialog).getByText('Copiar markdown para a área de transferência'));
    await waitFor(() =>
      expect(shareEvents()).toEqual([['event', 'share_complete', { locale: 'pt', target: 'copy-markdown' }]]),
    );
  });
});

describe('share_complete — the footer block', () => {
  it.each(SHARE_TARGETS.map((target) => [target.label, target.key]))(
    'emits target=%s when the reader picks %s',
    (label, key) => {
      renderWithLocale(<ShareLinks title="Hello" path={PT_PATH} />, { locale: 'pt' });
      fireEvent.click(screen.getByText(label));
      expect(shareEvents()).toEqual([['event', 'share_complete', { locale: 'pt', target: key }]]);
    },
  );

  it('emits target=copy-link for the clipboard control', async () => {
    renderWithLocale(<ShareLinks title="Hello" path={PT_PATH} />, { locale: 'pt' });
    fireEvent.click(screen.getByRole('button', { name: 'Copiar link' }));
    await waitFor(() =>
      expect(shareEvents()).toEqual([['event', 'share_complete', { locale: 'pt', target: 'copy-link' }]]),
    );
  });
});

describe('share_complete — the dimensions', () => {
  it('carries the ACTIVE locale, which is what makes the per-edition cut possible at all', () => {
    renderWithLocale(<ShareLinks title="Hello" path="/en/blog/my-commitment" />, { locale: 'en' });
    fireEvent.click(screen.getByText('LinkedIn'));
    expect(shareEvents()).toEqual([['event', 'share_complete', { locale: 'en', target: 'linkedin' }]]);
  });

  it('emits nothing at all when the reader has not consented', () => {
    window.localStorage.clear();
    renderWithLocale(<ShareLinks title="Hello" path={PT_PATH} />, { locale: 'pt' });
    fireEvent.click(screen.getByText('LinkedIn'));
    expect(pushed).toHaveLength(0);
  });
});
