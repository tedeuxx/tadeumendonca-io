// #597 slice B. `outbound_click`, and the assertion that justifies the whole two-listener design:
// BOTH delegated listeners are mounted on ONE root here, exactly as `AppShell` mounts them, and a click
// on a contact anchor must produce EXACTLY ONE event.
//
// That is the measurement, not an argument. Both listeners see every click — they are on the same node —
// so the only thing preventing a double count is `outboundHref`'s refusal, and deleting it from
// `outboundLinks.ts` reddens the first block below rather than leaving a plausible-looking pair of
// numbers in GA4 that nothing would ever have contradicted.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRef } from 'react';
import { fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../i18n';
import { useContactClicks } from './useContactClicks';
import { useOutboundClicks } from './useOutboundClicks';
import { CONTACT_CHANNELS } from '../components/contactChannels';
import { SHARE_TARGETS, shareHref } from '../components/shareTargets';
import { loadAnalytics, resetAnalyticsForTest, storeConsent } from '../lib/analytics';

const ID = 'G-TEST12345';
const RELEASE = 'https://github.com/tedeuxx/tadeumendonca-io/releases/tag/v1.0.0';

/** Both hooks on one root — the shell's shape. `outboundOnly` drops the contact listener for the one
 *  test that has to show the outbound listener does not depend on the other having run. */
function Harness({ links, outboundOnly = false }: { links: { href: string; label: string }[]; outboundOnly?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  useContactClicks(outboundOnly ? { current: null } : root);
  useOutboundClicks(root);
  return (
    <div ref={root}>
      {links.map(({ href, label }) => (
        // `preventDefault` at the React root, which is a strict ancestor of the node under test, so it
        // runs after both listeners have already seen the click. It only silences jsdom's
        // "navigation not implemented" noise.
        <a key={label} href={href} onClick={(e) => e.preventDefault()}>
          {/* Nested, exactly as the real surfaces render: the click target is the span, never the
              anchor, which is what the `closest('a')` walk is for. */}
          <span>{label}</span>
        </a>
      ))}
    </div>
  );
}

function mount(links: { href: string; label: string }[], outboundOnly = false) {
  const pushed: unknown[][] = [];
  const view = render(
    <MemoryRouter initialEntries={['/pt']}>
      <LocaleProvider>
        <Harness links={links} outboundOnly={outboundOnly} />
      </LocaleProvider>
    </MemoryRouter>,
  );
  window.gtag = ((...args: unknown[]) => pushed.push(args)) as typeof window.gtag;
  return { pushed, view };
}

/** jsdom cannot navigate to an external href. Swallowed at the DOCUMENT, after both listeners and the
 *  React handler have run, so the run stays quiet without changing what is under test. */
const swallow = (event: Event) => event.preventDefault();

beforeEach(() => {
  document.addEventListener('click', swallow);
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

describe('useOutboundClicks — one click, one event', () => {
  // THE DOUBLE-COUNT CHECK. Not `toHaveLength(0)` on the outbound half — the assertion is on the WHOLE
  // emitted list, so it fails both if the outbound listener adds a second event and if the contact
  // listener stops emitting.
  it.each(CONTACT_CHANNELS.map((channel) => [channel.label, channel.href, channel.analyticsTarget]))(
    'emits contact_click ALONE for the %s channel',
    (label, href, target) => {
      const { pushed, view } = mount([{ href, label }]);
      fireEvent.click(view.getByText(label));
      expect(pushed).toEqual([['event', 'contact_click', { locale: 'pt', target }]]);
    },
  );

  // A share deeplink is `share_complete`'s (emitted by the components' own onClick, absent from this
  // harness), so the two delegated listeners must emit nothing at all for one. That is a negative, and
  // its positive twin is the block below: the SAME harness, a link on the same hostnames, does emit.
  it.each(SHARE_TARGETS.map((target) => [target.label, shareHref(target, '/pt/blog/x', 'Title')]))(
    'emits nothing from either listener for a share to %s',
    (label, href) => {
      const { pushed, view } = mount([{ href, label }]);
      fireEvent.click(view.getByText(label));
      expect(pushed).toEqual([]);
    },
  );

  it('emits outbound_click ALONE for an external link that belongs to no other event', () => {
    const { pushed, view } = mount([{ href: RELEASE, label: 'Release' }]);
    fireEvent.click(view.getByText('Release'));
    expect(pushed).toEqual([
      ['event', 'outbound_click', { locale: 'pt', href: 'github.com/tedeuxx/tadeumendonca-io/releases/tag/v1.0.0' }],
    ]);
  });

  // The refusal is inside `outboundHref`, not in the order the two effects registered. With the contact
  // listener detached the outbound one still refuses a contact channel — so the exclusion cannot be
  // being supplied by the other listener having run first.
  it('refuses a contact channel even with the contact listener detached', () => {
    const channel = CONTACT_CHANNELS[0];
    const { pushed, view } = mount([{ href: channel.href, label: channel.label }], true);
    fireEvent.click(view.getByText(channel.label));
    expect(pushed).toEqual([]);
  });
});

describe('useOutboundClicks — the gate and the lifecycle', () => {
  it('emits nothing when the reader has not consented', () => {
    window.localStorage.clear();
    const { pushed, view } = mount([{ href: RELEASE, label: 'Release' }]);
    fireEvent.click(view.getByText('Release'));
    expect(pushed).toEqual([]);
  });

  // WITHDRAWN AFTER GRANTED — the third consent state, and the one `injected` alone got wrong. The
  // listener is still attached and gtag is still loaded; the emission must stop anyway, which it does
  // only because `trackEvent` re-reads the stored choice per call.
  it('goes silent after consent is withdrawn mid-session', () => {
    const { pushed, view } = mount([{ href: RELEASE, label: 'Release' }]);
    fireEvent.click(view.getByText('Release'));
    expect(pushed).toHaveLength(1);
    window.localStorage.clear();
    fireEvent.click(view.getByText('Release'));
    expect(pushed).toHaveLength(1);
  });

  it('stops listening on unmount', () => {
    const { pushed, view } = mount([{ href: RELEASE, label: 'Release' }]);
    const link = view.getByText('Release');
    view.unmount();
    fireEvent.click(link);
    expect(pushed).toEqual([]);
  });

  it('ignores a click that is not on a link at all', () => {
    const { pushed, view } = mount([{ href: RELEASE, label: 'Release' }]);
    fireEvent.click(view.container.firstChild as Element);
    expect(pushed).toEqual([]);
  });
});
