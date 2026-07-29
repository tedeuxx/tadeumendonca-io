import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  browserLocale,
  localeToOffer,
  readSuggestionState,
  storeDismissal,
  SUGGESTION_DISMISSED_KEY,
} from './localeSuggestion';
import { STORAGE_KEY } from '../i18n/config';

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
  it('survives storage being unavailable, in both directions', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(readSuggestionState()).toEqual({ storedChoice: null, dismissed: false });
    expect(() => storeDismissal()).not.toThrow();
  });
});
