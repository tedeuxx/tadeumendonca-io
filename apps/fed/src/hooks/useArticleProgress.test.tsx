// #597. The three conditions `article_end_reached` is gated on, each asserted by the journey that
// would be WRONG without it — a leap to the bottom, a scroll faster than reading, and a reader who
// left before the floor elapsed. jsdom has no IntersectionObserver and no scrolling, so the observer
// is stubbed and driven by hand; what is under test is the hook's decision, which is the part a real
// browser would not tell us more about anyway. The end-to-end proof that a REAL scroll drives it lives
// in `e2e/analytics-events.spec.ts`.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRef } from 'react';
import { act, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../i18n';
import { ConsentProvider } from '../lib/consent';
import { Markdown } from '../components/Markdown';
import { dwellFloorMs, useArticleProgress } from './useArticleProgress';
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

/** Deliver an intersection batch to the hook's observer, only for elements it is still watching —
 *  which is what makes `unobserve` after a milestone a behaviour the suite can see rather than a
 *  detail it trusts. */
function intersect(entries: FakeEntry[]) {
  const observer = observers[0];
  act(() => {
    observer.callback(entries.filter((entry) => observer.observed.has(entry.target)));
  });
}

function Prose({ slug, body, blocks }: { slug: string; body: string; blocks: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useArticleProgress({ container: ref, slug, body });
  return (
    <div ref={ref}>
      {Array.from({ length: blocks }, (_, i) => (
        <p key={i}>block {i}</p>
      ))}
    </div>
  );
}

/** The same wiring `ArticlePage` uses — the real `Markdown`, the ref handed to its own wrapper. */
function RealProse() {
  const ref = useRef<HTMLDivElement>(null);
  useArticleProgress({ container: ref, slug: 'x', body: MARKDOWN_BODY });
  return (
    <div className="max-w-none">
      <Markdown blockRef={ref}>{MARKDOWN_BODY}</Markdown>
    </div>
  );
}

const MARKDOWN_BODY = ['One.', 'Two.', 'Three.', 'Four.', 'Five.'].join('\n\n');

function mountProse({ body, blocks = 9 }: { body: string; blocks?: number }) {
  const pushed: unknown[][] = [];
  const view = render(
    <MemoryRouter initialEntries={['/pt/blog/x']}>
      <LocaleProvider>
        <ConsentProvider>
          <Prose slug="x" body={body} blocks={blocks} />
        </ConsentProvider>
      </LocaleProvider>
    </MemoryRouter>,
  );
  // Installed after mount so the loader's own js/config commands stay out of the array.
  window.gtag = ((...args: unknown[]) => pushed.push(args)) as typeof window.gtag;
  return { pushed, paragraphs: Array.from(view.container.querySelectorAll('p')) };
}

const names = (pushed: unknown[][]) => pushed.map((entry) => entry[1]);

beforeEach(() => {
  observers = [];
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  vi.useFakeTimers({ shouldAdvanceTime: true });
  window.localStorage.clear();
  delete window.gtag;
  delete window.dataLayer;
  resetAnalyticsForTest();
  vi.stubEnv('VITE_GA_MEASUREMENT_ID', ID);
  storeConsent('granted');
  loadAnalytics();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('dwellFloorMs', () => {
  it('derives the floor from the article length rather than a constant', () => {
    const short = 'word '.repeat(500);
    const long = 'word '.repeat(4000);
    // 500 words at the 1000 wpm implausibility bound is 30s; 4000 is 240s.
    expect(dwellFloorMs(short)).toBe(30_000);
    expect(dwellFloorMs(long)).toBe(240_000);
    expect(dwellFloorMs(long)).toBeGreaterThan(dwellFloorMs(short));
  });

  it('holds a minimum for a piece too short for the derived value to discriminate anything', () => {
    expect(dwellFloorMs('one two three')).toBe(5_000);
    expect(dwellFloorMs('')).toBe(5_000);
  });
});

describe('useArticleProgress', () => {
  it('emits article_progress once per milestone, in the order the blocks are met', () => {
    const { pushed, paragraphs } = mountProse({ body: 'word '.repeat(500) });

    // Nine blocks → milestone indices floor(8*0.25)=2, floor(8*0.5)=4, floor(8*0.75)=6.
    intersect([{ target: paragraphs[2], isIntersecting: true }]);
    intersect([{ target: paragraphs[4], isIntersecting: true }]);
    intersect([{ target: paragraphs[6], isIntersecting: true }]);
    // Re-entering a milestone already reported must not emit a second time — a reader scrolling back
    // up to re-read is not a second quarter of the article.
    intersect([{ target: paragraphs[2], isIntersecting: true }]);

    expect(pushed).toEqual([
      ['event', 'article_progress', { locale: 'pt', slug: 'x', percent: 25 }],
      ['event', 'article_progress', { locale: 'pt', slug: 'x', percent: 50 }],
      ['event', 'article_progress', { locale: 'pt', slug: 'x', percent: 75 }],
    ]);
  });

  // THE LEAP. End key, or a scrollbar drag: the last block intersects and the middle blocks never do.
  // This is the assertion that fails if condition 2 is dropped, and it is the one document-100% cannot
  // make at all.
  it('does NOT emit article_end_reached when the reader jumps to the end without passing through it', () => {
    const { pushed, paragraphs } = mountProse({ body: 'word '.repeat(500) });

    intersect([{ target: paragraphs[8], isIntersecting: true }]);
    act(() => void vi.advanceTimersByTime(600_000));

    expect(names(pushed)).not.toContain('article_end_reached');
    expect(pushed).toHaveLength(0);
  });

  // THE HALF-LEAP, and it is the journey that got through on the BUILT SITE while every unit test was
  // green. The first screenful of a real article already contains the 25% block, so it fires at load;
  // an End-key press after that satisfied a precondition spelled "at least one milestone" and the
  // article reported a read nobody performed. The precondition is the DEEPEST milestone for exactly
  // this reason.
  it('does NOT emit when only the shallow milestone was met before the jump', () => {
    const { pushed, paragraphs } = mountProse({ body: 'word '.repeat(500) });

    intersect([{ target: paragraphs[2], isIntersecting: true }]);
    intersect([{ target: paragraphs[8], isIntersecting: true }]);
    act(() => void vi.advanceTimersByTime(600_000));

    expect(names(pushed)).toEqual(['article_progress']);
  });

  // THE FLOOR. Every block met, in order, but faster than the words could have been read.
  it('does NOT emit article_end_reached before the dwell floor has elapsed', () => {
    const { pushed, paragraphs } = mountProse({ body: 'word '.repeat(500) });

    intersect([{ target: paragraphs[2], isIntersecting: true }]);
    intersect([{ target: paragraphs[4], isIntersecting: true }]);
    intersect([{ target: paragraphs[6], isIntersecting: true }]);
    intersect([{ target: paragraphs[8], isIntersecting: true }]);
    act(() => void vi.advanceTimersByTime(29_000));

    expect(names(pushed)).not.toContain('article_end_reached');
  });

  it('emits article_end_reached once the floor elapses with the end still on screen', () => {
    const { pushed, paragraphs } = mountProse({ body: 'word '.repeat(500) });

    intersect([{ target: paragraphs[2], isIntersecting: true }]);
    intersect([{ target: paragraphs[4], isIntersecting: true }]);
    intersect([{ target: paragraphs[6], isIntersecting: true }]);
    intersect([{ target: paragraphs[8], isIntersecting: true }]);
    act(() => void vi.advanceTimersByTime(31_000));

    expect(pushed).toContainEqual(['event', 'article_end_reached', { locale: 'pt', slug: 'x' }]);
    // Exactly once, and never again — the observer stops watching the last block after it fires.
    intersect([{ target: paragraphs[8], isIntersecting: true }]);
    act(() => void vi.advanceTimersByTime(60_000));
    expect(names(pushed).filter((name) => name === 'article_end_reached')).toHaveLength(1);
  });

  // The re-check the timer performs is not a promise that the event WILL fire — it requires the end to
  // still be on screen. A reader who scrolled past and moved on is not counted.
  it('does NOT emit when the end scrolled back out before the floor elapsed', () => {
    const { pushed, paragraphs } = mountProse({ body: 'word '.repeat(500) });

    intersect([{ target: paragraphs[2], isIntersecting: true }]);
    intersect([{ target: paragraphs[4], isIntersecting: true }]);
    intersect([{ target: paragraphs[6], isIntersecting: true }]);
    intersect([{ target: paragraphs[8], isIntersecting: true }]);
    act(() => void vi.advanceTimersByTime(10_000));
    intersect([{ target: paragraphs[8], isIntersecting: false }]);
    act(() => void vi.advanceTimersByTime(60_000));

    expect(names(pushed)).not.toContain('article_end_reached');
  });

  // A short piece whose whole prose is visible at load: the milestone and the last block arrive in ONE
  // batch. `entries` is not guaranteed to be in document order, so a single-pass callback could
  // evaluate the terminal event before its own precondition was set and leave the article permanently
  // ineligible. The batch is delivered end-first here on purpose.
  it('stays eligible when a milestone and the end intersect in the same batch, end-first', () => {
    const { pushed, paragraphs } = mountProse({ body: 'one two three', blocks: 5 });

    intersect([
      { target: paragraphs[4], isIntersecting: true },
      { target: paragraphs[1], isIntersecting: true },
      { target: paragraphs[2], isIntersecting: true },
      { target: paragraphs[3], isIntersecting: true },
    ]);
    act(() => void vi.advanceTimersByTime(6_000));

    expect(pushed).toContainEqual(['event', 'article_end_reached', { locale: 'pt', slug: 'x' }]);
  });

  // THE DEFECT THIS FOUND ON THE BUILT SITE, and it is the one a jsdom-only suite would have shipped.
  // Milestones are one-shot — a reported block is unobserved — so observing from MOUNT consumes every
  // milestone that is on screen while the consent banner is still up, silently, because the emitter
  // no-ops. On a short article the first screenful covers all three, so the article emitted nothing for
  // the whole visit. Starting the observer AT THE GRANT is what fixes it, and this asserts the
  // observer does not exist before then.
  it('does not observe anything at all until the reader has consented', () => {
    window.localStorage.clear();
    const { pushed, paragraphs } = mountProse({ body: 'word '.repeat(500) });

    expect(observers).toHaveLength(0);
    // Nothing to deliver to, and — the load-bearing half — nothing has been spent either, so the
    // milestones are still available the moment consent arrives.
    expect(paragraphs).toHaveLength(9);
    expect(pushed).toHaveLength(0);
  });

  // THE INTEGRATION THE HARNESS ABOVE CANNOT SEE, and the reason this test exists at all: `Prose`
  // renders its paragraphs as direct children of the observed element, which is the shape `ArticlePage`
  // only APPEARS to have. `Markdown` renders its own `<div className="markdown">` wrapper, so a ref on
  // the caller's div sees ONE child, `blocks.length === 1`, every milestone index collapses onto the
  // last block and is excluded — and the article reports nothing, forever, with no error anywhere.
  //
  // That shipped through a fully green unit suite and was caught by the E2E. This asserts the wiring
  // with the REAL renderer, so the next refactor that re-wraps the prose reddens in 20ms rather than in
  // a browser.
  it('observes the real Markdown wrapper, so a re-wrapping of the prose reddens here', () => {
    const pushed: unknown[][] = [];
    render(
      <MemoryRouter initialEntries={['/pt/blog/x']}>
        <LocaleProvider>
          <ConsentProvider>
            <RealProse />
          </ConsentProvider>
        </LocaleProvider>
      </MemoryRouter>,
    );
    window.gtag = ((...args: unknown[]) => pushed.push(args)) as typeof window.gtag;

    const observer = observers[0];
    // Five paragraphs in, four blocks excluding the last → three distinct milestone elements observed
    // plus the last block. One child would give zero milestones, which is the defect.
    expect(observer.observed.size).toBe(4);

    intersect([...observer.observed].map((target) => ({ target, isIntersecting: true })));
    expect(names(pushed).filter((name) => name === 'article_progress')).toHaveLength(3);
  });

  it('disconnects on unmount so a navigation away leaves no live observer', () => {
    const view = render(
      <MemoryRouter initialEntries={['/pt/blog/x']}>
        <LocaleProvider>
          <ConsentProvider>
            <Prose slug="x" body="one two three" blocks={5} />
          </ConsentProvider>
        </LocaleProvider>
      </MemoryRouter>,
    );
    expect(observers[0].disconnected).toBe(false);
    view.unmount();
    expect(observers[0].disconnected).toBe(true);
  });
});
