import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  browserLocale,
  localeToOffer,
  readSuggestionState,
  storeChoice,
  storeDismissal,
  SUGGESTION_DISMISSED_KEY,
} from './localeSuggestion';
import { detectLocale, STORAGE_KEY } from '../i18n/config';

describe('browserLocale', () => {
  it.each([
    ['pt-BR', 'pt'],
    ['PT-br', 'pt'],
    ['pt', 'pt'],
    ['en-US', 'en'],
  ])('maps %s → %s', (input, expected) => {
    expect(browserLocale(input)).toBe(expected);
  });

  // The owner's rule (2026-07-28): the device language decides, and ANY language that is not Portuguese
  // loads English. The site has two editions, so a French or Japanese reader gets the baseline rather
  // than nothing — asserted explicitly because "not pt" is easy to write as "== en" by accident.
  it.each(['fr-FR', 'ja', 'es-AR', 'de'])('falls back to en for %s', (input) => {
    expect(browserLocale(input)).toBe('en');
  });
});

describe('localeToOffer', () => {
  const base = { pathLocale: 'en', visitorLocale: 'pt', storedChoice: null, dismissed: false } as const;

  it('offers the visitor language when the URL pins the other one', () => {
    expect(localeToOffer({ ...base })).toBe('pt');
    expect(localeToOffer({ ...base, pathLocale: 'pt', visitorLocale: 'en' })).toBe('en');
  });

  it('stays silent when the page is already in the visitor language', () => {
    expect(localeToOffer({ ...base, visitorLocale: 'en' })).toBeNull();
  });

  it('stays silent once dismissed — the offer must not nag on every page', () => {
    expect(localeToOffer({ ...base, dismissed: true })).toBeNull();
  });

  // The branch the plan-review called out as most likely to regress silently: a pt-BR speaker reading
  // the English edition ON PURPOSE. Suggesting Portuguese there second-guesses a choice they made.
  it('stays silent when the reader explicitly chose the locale the URL pins', () => {
    expect(localeToOffer({ ...base, storedChoice: 'en' })).toBeNull();
  });

  // The inverse is NOT a suppression, and it is the case the feature exists for: the reader once chose
  // pt, then opened a shared /en link. The path still wins (ADR-0036), and the offer stands.
  it('still offers when the stored choice is the OTHER locale (a shared link overrode it)', () => {
    expect(localeToOffer({ ...base, storedChoice: 'pt' })).toBe('pt');
  });

  it('ignores a stored value that is not a locale', () => {
    expect(localeToOffer({ ...base, storedChoice: 'garbage' })).toBe('pt');
  });
});

describe('suggestion storage', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('round-trips the dismissal and reads the stored locale choice', () => {
    window.localStorage.setItem(STORAGE_KEY, 'pt');
    expect(readSuggestionState()).toEqual({ storedChoice: 'pt', dismissed: false });
    storeDismissal();
    expect(window.localStorage.getItem(SUGGESTION_DISMISSED_KEY)).toBe('1');
    expect(readSuggestionState().dismissed).toBe(true);
  });

  // Private mode and blocked cookies make localStorage THROW rather than return null. A notice about
  // language must not be able to break the page it is offered on.
  // Spied on `window.localStorage` ITSELF, not on `Storage.prototype`. The prototype form was here
  // first and did not take: coverage showed both `catch` blocks unexecuted, so the assertions were
  // running against a store that never threw — `not.toThrow()` on a call that cannot throw passes for
  // the wrong reason and reads as a hardened path. Verified the fix by the only means that settles it:
  // the catch lines are now covered, and inverting either assertion fails.
  it('survives storage being unavailable, in both directions', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(readSuggestionState()).toEqual({ storedChoice: null, dismissed: false });
    expect(() => storeDismissal()).not.toThrow();
    expect(() => storeChoice('pt')).not.toThrow();
  });

  it('persists a choice without touching the dismissal key', () => {
    storeChoice('pt');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('pt');
    expect(window.localStorage.getItem(SUGGESTION_DISMISSED_KEY)).toBeNull();
  });
});

// #323. Every test above exercises ONE function against fixed inputs, which is precisely why the defect
// survived: both functions were individually correct and the bug lived in the seam between them. These
// cross it — what the dismiss handler writes, read back through the resolver a later session runs.
//
// WHAT THESE DO NOT PROVE, stated because the first version of this block claimed otherwise. They call
// the store functions directly, so they verify that persisting a choice SURVIVES into `detectLocale` —
// not that the component's handler calls it. Remove `storeChoice` from the handler and every test here
// stays green. The wiring is pinned by a CLICK, in `components/LocaleSuggestion.test.tsx`; these pin
// the consequence. Both are needed and neither substitutes for the other.
describe('the seam: answering the offer, then re-resolving in a later session', () => {
  beforeEach(() => window.localStorage.clear());

  // The reported case. OS is English, the reader is on /pt and answers "Continue in Portuguese" —
  // an affirmative statement of preference. Before the fix this wrote only the dismissal key, so the
  // next open at the bare root fell through to navigator.language and served English forever, while
  // the offer that would have caught it had been permanently silenced.
  it('a dismissal that MEANS "stay in this language" survives into the next session', () => {
    // What the handler does, in the order it does it.
    storeChoice('pt');
    storeDismissal();

    // A later session opening the bare root: no locale in the path, an English browser.
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
    expect(detectLocale('/')).toBe('pt');
    vi.restoreAllMocks();
  });

  // The inverse, asserted so the fix cannot trade one defect for another: the dismissal still suppresses
  // the offer, and it must suppress it on the OTHER locale too — a later shared /en link must not
  // re-ask a reader who already declined English.
  it('still does not re-offer after a dismissal, on either locale', () => {
    storeChoice('pt');
    storeDismissal();
    const { storedChoice, dismissed } = readSuggestionState();

    expect(localeToOffer({ pathLocale: 'pt', visitorLocale: 'en', storedChoice, dismissed })).toBeNull();
    expect(localeToOffer({ pathLocale: 'en', visitorLocale: 'en', storedChoice, dismissed })).toBeNull();
  });

  // And the feature itself must survive: a reader who never answered is still offered. A fix that
  // suppressed globally would pass both assertions above and break the thing #172 built.
  it('still offers a reader who has never answered', () => {
    const { storedChoice, dismissed } = readSuggestionState();
    expect(localeToOffer({ pathLocale: 'pt', visitorLocale: 'en', storedChoice, dismissed })).toBe('en');
  });
});
