// #597 slice B. `contact_reach`, and the defect class this file exists to make impossible: slice A
// shipped THREE no-ops that were indistinguishable from a pass — an observer started before consent
// that silently consumed a one-shot, a ref one element too high, and a guard satisfiable at load. All
// three are available again here, and each has an assertion below that fails when it recurs.
//
// jsdom has no IntersectionObserver, so it is stubbed and driven by hand — what is under test is the
// hook's decision about WHEN to create an observer and what to do with the first intersection. That a
// real scroll on a real page drives it, and that the section is NOT on screen at the top of the landing,
// is asserted in `e2e/analytics-events.spec.ts` on the built site.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRef } from 'react';
import { act, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../i18n';
import { ConsentProvider, useConsent } from '../lib/consent';
import { useContactReach } from './useContactReach';
import { loadAnalytics, resetAnalyticsForTest, storeConsent } from '../lib/analytics';

const ID = 'G-TEST12345';

interface FakeEntry {
  target: Element;
  isIntersecting: boolean;
}
type FakeCallback = (entries: FakeEntry[]) => void;

let observers: { callback: FakeCallback; observed: Set<Element>; disconnected: boolean }[] = [];

class FakeIntersectionObserver {
  private record: { callback: FakeCallback; observed: Set<Element>; disconnected: boolean };
  constructor(callback: FakeCallback) {
    this.record = { callback, observed: new Set(), disconnected: false };
    observers.push(this.record);
  }
  observe(el: Element) {
    this.record.observed.add(el);
  }
  unobserve(el: Element) {
    this.record.observed.delete(el);
  }
  disconnect() {
    this.record.disconnected = true;
    this.record.observed.clear();
  }
}

/** Deliver a batch to the live observer, only for elements it is still watching — so `disconnect` after
 *  the first intersection is a behaviour the suite can SEE rather than a detail it trusts. */
function intersect(isIntersecting: boolean) {
  const observer = observers[observers.length - 1];
  act(() => {
    observer.callback([...observer.observed].map((target) => ({ target, isIntersecting })));
  });
}

let pushed: unknown[][];
let grant: () => void = () => {};

function Section() {
  const ref = useRef<HTMLElement>(null);
  useContactReach(ref);
  // The grant is reached through the REAL provider rather than by writing to storage, because the whole
  // property under test is that the observer is created by the status transition.
  grant = useConsent().accept;
  return (
    <footer ref={ref} id="contato">
      contact
    </footer>
  );
}

function mount() {
  return render(
    <MemoryRouter initialEntries={['/pt']}>
      <LocaleProvider>
        <ConsentProvider>
          <Section />
        </ConsentProvider>
      </LocaleProvider>
    </MemoryRouter>,
  );
}

const reachEvents = () => pushed.filter((entry) => entry[1] === 'contact_reach');

beforeEach(() => {
  observers = [];
  pushed = [];
  window.localStorage.clear();
  // The once-per-session marker for `contact_reach` lives in `sessionStorage`. Without this every case
  // after the first would find the session's shot already spent and would pass by emitting nothing.
  window.sessionStorage.clear();
  delete window.gtag;
  delete window.dataLayer;
  resetAnalyticsForTest();
  vi.stubEnv('VITE_GA_MEASUREMENT_ID', ID);
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

/** Replace the loaded shim with a capture, after whatever consent path the test took. */
function capture() {
  window.gtag = ((...args: unknown[]) => pushed.push(args)) as typeof window.gtag;
}

describe('useContactReach — the observer is created at the GRANT', () => {
  // THE ONE-SHOT-CONSUMED-BEFORE-CONSENT DEFECT, asserted directly. If the observer were created at
  // mount, it would exist here — and on a real page it would already have fired for a section on screen,
  // spending the only shot while the emitter was still a no-op.
  it('creates no observer at all while the reader is undecided', () => {
    mount();
    expect(observers).toHaveLength(0);
  });

  it('creates one when consent is granted, and emits on the first intersection', () => {
    mount();
    act(() => grant());
    capture();
    expect(observers).toHaveLength(1);
    intersect(true);
    expect(reachEvents()).toEqual([['event', 'contact_reach', { locale: 'pt' }]]);
  });

  // A returning reader who already granted: the observer exists from mount because the status is
  // already `granted`, which is the same rule and not an exception to it.
  it('creates one at mount for a reader who granted on a previous visit', () => {
    storeConsent('granted');
    loadAnalytics();
    mount();
    capture();
    expect(observers).toHaveLength(1);
    intersect(true);
    expect(reachEvents()).toHaveLength(1);
  });

  it('creates none for a reader who declined', () => {
    storeConsent('denied');
    mount();
    expect(observers).toHaveLength(0);
  });
});

describe('useContactReach — what it does with intersections', () => {
  function granted() {
    storeConsent('granted');
    loadAnalytics();
    const view = mount();
    capture();
    return view;
  }

  // The guard that must not be satisfiable by a batch that says the section is NOT on screen. The
  // positive twin is the line after it, in the same test, so this is not a lone vacuous negative.
  it('does not emit for a non-intersecting batch, and does for the next intersecting one', () => {
    granted();
    intersect(false);
    expect(reachEvents()).toEqual([]);
    intersect(true);
    expect(reachEvents()).toHaveLength(1);
  });

  it('emits once and then disconnects, however many intersections follow', () => {
    granted();
    intersect(true);
    intersect(true);
    intersect(true);
    expect(reachEvents()).toHaveLength(1);
    expect(observers[0].disconnected).toBe(true);
  });

  it('disconnects on unmount', () => {
    const view = granted();
    view.unmount();
    expect(observers[0].disconnected).toBe(true);
  });

  // ============================================================================================
  // ONE PER SESSION, NOT ONE PER OBSERVER (PR #602 round 2). The three cases above all drive ONE
  // observer, which is why the suite could report a one-shot while the built site emitted twice: the
  // effect rebuilds on any change of `locale` or `status`, and a fresh `IntersectionObserver` fires an
  // initial callback for whatever is on screen. Remounting is the same rebuild, reachable here; the
  // locale toggle and the consent re-grant are asserted in `e2e/analytics-events.spec.ts`, where a real
  // browser can drive them.
  it('does not emit again after the effect is rebuilt with the section already reached', () => {
    const first = granted();
    intersect(true);
    expect(reachEvents()).toHaveLength(1);
    first.unmount();

    granted();
    // The rebuild does not even build an observer: the session already has its row, so there is nothing
    // left to watch. Asserted as the count of observers, not only as the count of events — a hook that
    // observed and then filtered would pass the event assertion and would still be wrong.
    const observersAfter = observers.length;
    intersect(true);
    expect(reachEvents()).toHaveLength(1);
    expect(observers).toHaveLength(observersAfter);
    expect(observers[observers.length - 1].observed.size).toBe(0);
  });

  // THE MARK RECORDS WHAT SHIPPED, NOT WHAT WAS ATTEMPTED. A reader who withdrew consent between the
  // observer's creation and its first callback gets a no-op; marking there would spend the session's one
  // shot on a hit GA4 never received, and no later grant could produce it.
  it('does not spend the session shot on an emission consent suppressed', () => {
    const view = granted();
    window.localStorage.clear();
    intersect(true);
    expect(reachEvents()).toEqual([]);
    view.unmount();

    granted();
    intersect(true);
    expect(reachEvents()).toHaveLength(1);
  });

  it('emits nothing when the reader has not consented, even if the observer is driven by hand', () => {
    // The observer is created by a grant and then consent is withdrawn — gtag stays loaded and the
    // observer stays alive, so the ONLY thing that can stop the emission is `trackEvent` re-reading the
    // stored choice per call. This is the withdrawn-after-granted state, one layer down.
    granted();
    window.localStorage.clear();
    intersect(true);
    expect(reachEvents()).toEqual([]);
  });
});
