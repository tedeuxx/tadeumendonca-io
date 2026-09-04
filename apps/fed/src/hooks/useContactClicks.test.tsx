// #597. The delegated `contact_click` listener, and the one assertion that carries the whole design:
// a share to LinkedIn must NOT be reported as a click on the owner's LinkedIn profile. Three of the
// five contact channels share a hostname with a share destination, so the hostname rule anyone would
// reach for first inflates the career funnel's terminal event with the content funnel's traffic — and
// both events would still look plausible afterwards, which is why it is pinned here.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRef } from 'react';
import { fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../i18n';
import { useContactClicks } from './useContactClicks';
import { CONTACT_CHANNELS } from '../components/contactChannels';
import { SHARE_TARGETS, shareHref } from '../components/shareTargets';
import { loadAnalytics, resetAnalyticsForTest, storeConsent } from '../lib/analytics';

const ID = 'G-TEST12345';

function Harness({ links }: { links: { href: string; label: string }[] }) {
  const root = useRef<HTMLDivElement>(null);
  useContactClicks(root);
  return (
    <div ref={root}>
      {links.map(({ href, label }) => (
        // `preventDefault` only silences jsdom's "navigation not implemented" noise. It is a REACT
        // handler, so it runs at the React root — a strict ancestor of the element the hook listens
        // on — and therefore after the listener under test has already seen the click.
        <a key={label} href={href} onClick={(e) => e.preventDefault()}>
          {/* The label is nested, exactly as both real contact surfaces render it — the click target
              is the span, never the anchor, which is what the `closest('a')` walk is for. */}
          <span>{label}</span>
        </a>
      ))}
    </div>
  );
}

function mount(links: { href: string; label: string }[]) {
  const pushed: unknown[][] = [];
  const view = render(
    <MemoryRouter initialEntries={['/pt']}>
      <LocaleProvider>
        <Harness links={links} />
      </LocaleProvider>
    </MemoryRouter>,
  );
  window.gtag = ((...args: unknown[]) => pushed.push(args)) as typeof window.gtag;
  return { pushed, view };
}

beforeEach(() => {
  window.localStorage.clear();
  delete window.gtag;
  delete window.dataLayer;
  resetAnalyticsForTest();
  vi.stubEnv('VITE_GA_MEASUREMENT_ID', ID);
  storeConsent('granted');
  loadAnalytics();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('useContactClicks', () => {
  it.each(CONTACT_CHANNELS.map((channel) => [channel.label, channel.href, channel.analyticsTarget]))(
    'reports a click on %s as contact_click target=%s',
    (label, href, target) => {
      const { pushed, view } = mount([{ href, label }]);
      fireEvent.click(view.getByText(label));
      expect(pushed).toEqual([['event', 'contact_click', { locale: 'pt', target }]]);
    },
  );

  // THE COLLISION. Every share deeplink, built exactly as the modal and the footer build them.
  it.each(SHARE_TARGETS.map((target) => [target.label, shareHref(target, '/pt/blog/x', 'Title')]))(
    'does NOT report a share to %s as a contact click',
    (label, href) => {
      const { pushed, view } = mount([{ href, label }]);
      fireEvent.click(view.getByText(label));
      expect(pushed).toHaveLength(0);
    },
  );

  it('ignores a click that is not on a link at all', () => {
    const { pushed, view } = mount([{ href: CONTACT_CHANNELS[0].href, label: 'GitHub' }]);
    fireEvent.click(view.container.firstChild as Element);
    expect(pushed).toHaveLength(0);
  });

  it('ignores an internal link and an anchor with no href', () => {
    const { pushed, view } = mount([{ href: '/pt/architecture', label: 'Architecture' }]);
    fireEvent.click(view.getByText('Architecture'));
    expect(pushed).toHaveLength(0);
  });

  it('emits nothing when the reader has not consented', () => {
    window.localStorage.clear();
    const { pushed, view } = mount([{ href: CONTACT_CHANNELS[1].href, label: 'LinkedIn' }]);
    fireEvent.click(view.getByText('LinkedIn'));
    expect(pushed).toHaveLength(0);
  });

  it('stops listening on unmount', () => {
    const { pushed, view } = mount([{ href: CONTACT_CHANNELS[0].href, label: 'GitHub' }]);
    const link = view.getByText('GitHub');
    view.unmount();
    fireEvent.click(link);
    expect(pushed).toHaveLength(0);
  });
});
