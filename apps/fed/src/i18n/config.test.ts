import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  browserLocale,
  declaredLanguages,
  detectLocale,
  isLocale,
  htmlLang,
  dateLocale,
  ogLocale,
  localeFromHint,
  localeFromPath,
  LOCALE_HINT_COOKIE,
  localePath,
  pathWithoutLocale,
  STORAGE_KEY,
} from './config';

describe('isLocale', () => {
  it('accepts pt/en and rejects anything else', () => {
    expect(isLocale('pt')).toBe(true);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe('htmlLang / dateLocale / ogLocale', () => {
  it('map pt → pt-BR and en → en / en-US / en_US', () => {
    expect(htmlLang('pt')).toBe('pt-BR');
    expect(htmlLang('en')).toBe('en');
    expect(dateLocale('pt')).toBe('pt-BR');
    expect(dateLocale('en')).toBe('en-US');
    expect(ogLocale('pt')).toBe('pt_BR');
    expect(ogLocale('en')).toBe('en_US');
  });
});

describe('localeFromPath', () => {
  it('reads the locale from a prefixed path', () => {
    expect(localeFromPath('/pt')).toBe('pt');
    expect(localeFromPath('/en')).toBe('en');
    expect(localeFromPath('/pt/me')).toBe('pt');
    expect(localeFromPath('/en/blog/x')).toBe('en');
  });

  it('returns null for a bare, unprefixed, or invalid-locale path', () => {
    expect(localeFromPath('/')).toBeNull();
    expect(localeFromPath('/me')).toBeNull();
    expect(localeFromPath('/xyz/me')).toBeNull();
  });
});

describe('localePath', () => {
  it('prefixes a logical path with the locale segment', () => {
    expect(localePath('pt', '/me')).toBe('/pt/me');
    expect(localePath('en', '/blog/x')).toBe('/en/blog/x');
    expect(localePath('pt', '/#artigos')).toBe('/pt/#artigos');
  });

  it('maps the root to the bare prefix', () => {
    expect(localePath('pt', '/')).toBe('/pt');
    expect(localePath('en')).toBe('/en');
  });
});

describe('pathWithoutLocale', () => {
  it('strips the locale prefix, preserving the sub-path', () => {
    expect(pathWithoutLocale('/pt')).toBe('');
    expect(pathWithoutLocale('/en')).toBe('');
    expect(pathWithoutLocale('/pt/me')).toBe('/me');
    expect(pathWithoutLocale('/en/blog/x')).toBe('/blog/x');
  });

  it('returns an already-unprefixed path unchanged', () => {
    expect(pathWithoutLocale('/me')).toBe('/me');
    expect(pathWithoutLocale('/')).toBe('/');
  });
});

// #661. The browser declares an ORDERED LIST and the code read only its first entry, so a reader whose
// browser says ["en-US", "en", "pt"] was served English while asking for Portuguese. These exercise the
// resolver directly — `detectLocale` reaches it through two more precedence steps, and a defect in the
// walk should not have to be diagnosed through them.
describe('browserLocale', () => {
  // Pinned from the single-value era, unchanged in meaning: one entry behaves exactly as before.
  it.each([
    [['pt-BR'], 'pt'],
    [['PT-br'], 'pt'], // case-insensitive
    [['pt'], 'pt'],
    [['pt-PT'], 'pt'], // the region subtag is not consulted — any Portuguese is Portuguese
    [['en-US'], 'en'],
    [['en-GB'], 'en'],
  ])('resolves the single-entry list %j to %s', (languages, expected) => {
    expect(browserLocale(languages)).toBe(expected);
  });

  // The owner's rule (2026-07-28): ANY language that is not Portuguese loads English. The site has two
  // editions, so a French or Japanese reader gets the baseline rather than nothing — asserted explicitly
  // because "not pt" is easy to write as "== en" by accident.
  it.each([['fr-FR'], ['ja'], ['es-AR'], ['de']])('falls back to en for %s', (tag) => {
    expect(browserLocale([tag])).toBe('en');
  });

  // THE DEFECT ITSELF, and the single most important assertion in this file. This is the owner's own
  // browser: English first, Portuguese third. Revert the walk to `languages[0]` and this line goes red.
  it('takes a Portuguese entry that is NOT first — the configuration the defect was reported from', () => {
    expect(browserLocale(['en-US', 'en', 'pt'])).toBe('pt');
  });

  // The generalisation of the line above, held separately so a fix that special-cased three entries or
  // the exact tag "pt" would still fail here.
  it.each([
    [['en-GB', 'pt-PT'], 'pt'],
    [['fr-FR', 'de', 'pt-BR'], 'pt'],
    [['en-US', 'PT-br'], 'pt'],
  ])('finds Portuguese anywhere in %j', (languages, expected) => {
    expect(browserLocale(languages)).toBe(expected);
  });

  // The inverse, so the widening cannot be a blanket "return pt": a list with no Portuguese in it at any
  // position is still English, however long it is.
  it('stays on the baseline when no entry is Portuguese, at any position', () => {
    expect(browserLocale(['en-US', 'en', 'fr-FR', 'ja', 'es-AR'])).toBe('en');
  });

  // An empty list is not the same as "no preference expressed as English by luck" — it must reach the
  // baseline through the fallback rather than through an index on an empty array.
  it('resolves an empty list to the baseline without throwing', () => {
    expect(browserLocale([])).toBe('en');
  });

  // A garbage or truncated tag must not match by prefix accident: "ptx" is not Portuguese, and a naive
  // `startsWith('pt')` — which is exactly what this replaced — said it was.
  it.each([['ptx'], ['pty-ZZ'], ['engineering'], ['']])('does not match the non-locale tag %j', (tag) => {
    expect(browserLocale([tag])).toBe('en');
  });
});

describe('declaredLanguages', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns navigator.languages, in declared order, when it is present', () => {
    vi.stubGlobal('navigator', { language: 'en-US', languages: ['en-US', 'en', 'pt'] });
    expect(declaredLanguages()).toEqual(['en-US', 'en', 'pt']);
  });

  // Some privacy configurations expose an EMPTY list. `languages[0]` there is `undefined`, which is why
  // this is a length check: falling back to the single-value API is the whole point of the branch.
  it('falls back to navigator.language when languages is empty', () => {
    vi.stubGlobal('navigator', { language: 'pt-BR', languages: [] });
    expect(declaredLanguages()).toEqual(['pt-BR']);
  });

  // And when the list is absent altogether (older engines, and every stubbed navigator in this suite).
  it('falls back to navigator.language when languages is absent', () => {
    vi.stubGlobal('navigator', { language: 'pt-BR' });
    expect(declaredLanguages()).toEqual(['pt-BR']);
  });

  // Neither signal available: an empty list, never a `[undefined]` that would crash the walk.
  it('returns an empty list when the browser declares nothing at all', () => {
    vi.stubGlobal('navigator', { language: '' });
    expect(declaredLanguages()).toEqual([]);
    expect(browserLocale(declaredLanguages())).toBe('en');
  });
});

describe('detectLocale', () => {
  const setNavLanguage = (language: string) => vi.stubGlobal('navigator', { language });
  const setNavLanguages = (languages: string[]) =>
    vi.stubGlobal('navigator', { language: languages[0], languages });

  beforeEach(() => window.localStorage.removeItem(STORAGE_KEY));
  afterEach(() => vi.unstubAllGlobals());

  // Per-locale URLs (ADR-0036): the path is authoritative — it beats a persisted override AND the browser.
  it('honours the locale in the path over a persisted override and the browser', () => {
    window.localStorage.setItem(STORAGE_KEY, 'en');
    setNavLanguage('en-US');
    expect(detectLocale('/pt/me')).toBe('pt'); // a shared /pt link wins over everything
    expect(detectLocale('/en/me')).toBe('en');
  });

  it('falls through to the persisted override when the path carries no locale', () => {
    window.localStorage.setItem(STORAGE_KEY, 'en');
    setNavLanguage('pt-BR'); // detection alone would say pt; the toggle override wins
    expect(detectLocale('/me')).toBe('en');
    expect(detectLocale()).toBe('en');
  });

  it('ignores an invalid stored value and falls back to browser detection', () => {
    window.localStorage.setItem(STORAGE_KEY, 'de');
    setNavLanguage('pt-BR');
    expect(detectLocale('/')).toBe('pt');
  });

  it('detects pt from a pt* browser language (no path, no override)', () => {
    setNavLanguage('PT-br'); // case-insensitive
    expect(detectLocale()).toBe('pt');
  });

  it('falls back to en for a non-pt browser language (the professional baseline)', () => {
    setNavLanguage('fr-FR');
    expect(detectLocale()).toBe('en');
  });

  // #661, asserted THROUGH the resolver rather than beside it: the widening has to survive the two
  // precedence steps above it, and the three tests below pin exactly where it sits in the ladder.
  it('detects pt from a NON-FIRST entry of the declared list (the reported defect)', () => {
    setNavLanguages(['en-US', 'en', 'pt']);
    expect(detectLocale()).toBe('pt');
    expect(detectLocale('/')).toBe('pt');
    expect(detectLocale('/me')).toBe('pt'); // an unprefixed path — post-#660, the shared-link path
  });

  // Step 2 still outranks step 3. This is the clause the Issue put out of scope in writing, so it is
  // asserted rather than assumed: an explicit choice beats any inference about the reader.
  it('keeps the persisted override above the declared list', () => {
    window.localStorage.setItem(STORAGE_KEY, 'en');
    setNavLanguages(['en-US', 'en', 'pt']); // the list says pt; the reader's own choice says en
    expect(detectLocale()).toBe('en');
    expect(detectLocale('/me')).toBe('en');
  });

  // Step 1 still outranks everything, including a declared list that disagrees with it. The prerender,
  // the self-canonical + hreflang reciprocity and the sharer's contract all rest on this.
  it('keeps the path above the declared list and the override alike', () => {
    window.localStorage.setItem(STORAGE_KEY, 'pt');
    setNavLanguages(['en-US', 'en', 'pt']);
    expect(detectLocale('/en/me')).toBe('en');
    expect(detectLocale('/pt/me')).toBe('pt');
  });
});

// #788 — the EDGE HINT, step 3 of the ladder (ADR-0036, "The edge exposes a locale hint, never a locale
// decision"). The parser is tested on its own, then through `detectLocale`, because the contract is
// about WHERE it sits as much as what it reads.
describe('localeFromHint', () => {
  it('resolves pt from the pt hint, wherever the cookie sits in the header', () => {
    expect(localeFromHint('locale_hint=pt')).toBe('pt');
    expect(localeFromHint('a=1; locale_hint=pt; b=2')).toBe('pt');
    expect(localeFromHint('a=1;locale_hint= pt ')).toBe('pt');
  });

  // `other` is NOT English: it means "not decided by geography", so it resolves nothing.
  it('resolves nothing from other, unknown, an empty value or any value outside the set', () => {
    for (const value of ['other', 'unknown', '', 'PT', 'pt-BR', 'en', 'ptx', '"pt"']) {
      expect(localeFromHint(`locale_hint=${value}`), value).toBeNull();
    }
  });

  it('resolves nothing when the cookie is absent or only a look-alike name is present', () => {
    expect(localeFromHint('')).toBeNull();
    expect(localeFromHint('a=1; b=2')).toBeNull();
    expect(localeFromHint('xlocale_hint=pt; locale_hintx=pt; locale_hint')).toBeNull();
  });

  it('reads the cookie the edge function names', () => {
    expect(LOCALE_HINT_COOKIE).toBe('locale_hint');
  });
});

describe('detectLocale — the edge hint (#788)', () => {
  const setNavLanguages = (languages: string[]) =>
    vi.stubGlobal('navigator', { language: languages[0], languages });
  const setHint = (value: string) => {
    document.cookie = `locale_hint=${value}; path=/`;
  };
  const clearHint = () => {
    document.cookie = 'locale_hint=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  };

  beforeEach(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    clearHint();
    delete window.__PRERENDER__;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    clearHint();
    delete window.__PRERENDER__;
  });

  // The browser says English throughout, so the ONLY reason any of these can resolve to pt is the hint.
  it('resolves pt from the pt hint with no path and no override, above an English browser', () => {
    setNavLanguages(['en-US', 'en']);
    setHint('pt');
    expect(detectLocale()).toBe('pt');
    expect(detectLocale('/')).toBe('pt');
    expect(detectLocale('/me')).toBe('pt'); // an unprefixed sub-path
    expect(detectLocale('/blog/my-commitment')).toBe('pt'); // the bare article path
  });

  // The control: identical inputs, no hint. Without it the test above could pass on a resolver that
  // ignored the cookie and returned pt for some other reason.
  it('serves the browser language when the cookie is absent', () => {
    setNavLanguages(['en-US', 'en']);
    expect(detectLocale('/')).toBe('en');
  });

  it('keeps a persisted en override above the pt hint', () => {
    setNavLanguages(['en-US', 'en']);
    setHint('pt');
    window.localStorage.setItem(STORAGE_KEY, 'en');
    expect(detectLocale('/')).toBe('en');
  });

  it('keeps the path above the pt hint', () => {
    setNavLanguages(['en-US', 'en']);
    setHint('pt');
    expect(detectLocale('/en/me')).toBe('en');
    expect(detectLocale('/en')).toBe('en');
  });

  it('falls through to navigator.languages on other, in both directions', () => {
    setHint('other');
    setNavLanguages(['pt-BR']);
    expect(detectLocale('/')).toBe('pt'); // other is NOT English
    setNavLanguages(['en-US']);
    expect(detectLocale('/')).toBe('en');
  });

  it('falls through to navigator.languages on unknown or a garbage value', () => {
    setNavLanguages(['fr-FR', 'pt']);
    for (const value of ['unknown', 'garbage', 'PT']) {
      setHint(value);
      expect(detectLocale('/'), value).toBe('pt');
    }
    setNavLanguages(['fr-FR']);
    for (const value of ['unknown', 'garbage', 'PT']) {
      setHint(value);
      expect(detectLocale('/'), value).toBe('en');
    }
  });

  // The prerender is not a visitor (ADR-0036, 2026-07-28): the bare-root snapshot must stay English.
  it('ignores the hint in the snapshot browser', () => {
    setNavLanguages(['en-US']);
    setHint('pt');
    window.__PRERENDER__ = true;
    expect(detectLocale('/')).toBe('en');
    window.__PRERENDER__ = false;
    expect(detectLocale('/')).toBe('pt'); // a false flag is a visitor, not the snapshot browser
  });

  it('never writes the cookie', () => {
    setNavLanguages(['en-US']);
    setHint('other');
    const before = document.cookie;
    detectLocale('/');
    detectLocale('/en/me');
    expect(document.cookie).toBe(before);
  });
});
