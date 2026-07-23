import { describe, it, expect } from 'vitest';
import { strings, translate, type Entry, type MessageKey } from './messages';
import { LOCALES } from './config';

/** Every dot-path to an { pt, en } leaf in the nested catalog. */
function entryKeys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    // An Entry leaf has a string `pt`; anything else is a nested group to recurse into.
    return typeof (v as Entry).pt === 'string' ? [path] : entryKeys(v as object, path);
  });
}

describe('message catalog', () => {
  // Key parity across locales is compile-enforced (each leaf `satisfies Entry`, so a missing pt/en is a
  // type error). Here we assert the runtime values are present and non-empty for every key in both locales.
  it('has a non-empty string for every key in both locales', () => {
    const keys = entryKeys(strings);
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      for (const locale of LOCALES) {
        const value = translate(locale, key as MessageKey);
        expect(typeof value).toBe('string');
        expect(value).not.toBe('');
      }
    }
  });

  it('resolves a dot-path key to the locale-specific string', () => {
    expect(translate('pt', 'nav.articles')).toBe('Artigos');
    expect(translate('en', 'nav.articles')).toBe('Articles');
    expect(translate('pt', 'cv.present')).toBe('Atual');
    expect(translate('en', 'cv.present')).toBe('Present');
  });
});
