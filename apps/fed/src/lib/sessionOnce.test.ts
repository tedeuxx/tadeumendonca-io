// The once-per-session marker store (#597, PR #602 round 2). Small surface, and every case below is a
// property the hooks depend on rather than a restatement of `sessionStorage`'s own contract.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SESSION_ONCE_PREFIX, firedThisSession, markFiredThisSession, onceKey } from './sessionOnce';

beforeEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('onceKey', () => {
  it('namespaces every key it builds', () => {
    expect(onceKey('contact_reach')).toBe(`${SESSION_ONCE_PREFIX}contact_reach`);
  });

  it('joins its parts so two events on one article do not collide', () => {
    expect(onceKey('article_progress', 'my-commitment', 25)).not.toBe(
      onceKey('article_progress', 'my-commitment', 50),
    );
    expect(onceKey('article_progress', 'my-commitment', 25)).not.toBe(onceKey('article_end_reached', 'my-commitment'));
  });
});

describe('firedThisSession / markFiredThisSession', () => {
  it('is false before the mark and true after it', () => {
    const key = onceKey('contact_reach');
    expect(firedThisSession(key)).toBe(false);
    markFiredThisSession(key);
    expect(firedThisSession(key)).toBe(true);
  });

  it('marks one key without marking another', () => {
    markFiredThisSession(onceKey('article_progress', 'a', 25));
    expect(firedThisSession(onceKey('article_progress', 'a', 50))).toBe(false);
    expect(firedThisSession(onceKey('article_progress', 'b', 25))).toBe(false);
  });

  // THE MARKERS ARE NOT IN `localStorage`, and this is asserted rather than assumed: consent and the
  // locale choice live there, dozens of specs clear it, and the site's own "Cookie preferences" control
  // clears the consent key. A marker sharing that store would be wiped by an unrelated act.
  it('writes nothing to localStorage', () => {
    markFiredThisSession(onceKey('contact_reach'));
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.getItem(onceKey('contact_reach'))).toBe('1');
  });

  // PRIVATE MODE FAILS OPEN, IN BOTH DIRECTIONS. Blocked storage makes these THROW rather than return
  // null. The chosen direction is "the event emits": a guard that failed closed would silently drop a
  // funnel stage for every reader with storage disabled, which is invisible in the data — strictly worse
  // than the visible duplicate it would be preventing.
  it('reports false rather than throwing when reading is blocked', () => {
    vi.spyOn(window.sessionStorage, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => firedThisSession(onceKey('contact_reach'))).not.toThrow();
    expect(firedThisSession(onceKey('contact_reach'))).toBe(false);
  });

  it('swallows a write failure rather than throwing into the observer callback', () => {
    vi.spyOn(window.sessionStorage, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => markFiredThisSession(onceKey('contact_reach'))).not.toThrow();
  });
});
