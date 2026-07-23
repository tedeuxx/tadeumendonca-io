import { describe, it, expect } from 'vitest';
import { messages, translate, type MessageKey } from './messages';
import { LOCALES } from './config';

/** Every leaf (string) dot-path in a nested catalog object. */
function leafKeys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    return typeof v === 'string' ? [path] : leafKeys(v as object, path);
  });
}

describe('message catalog', () => {
  it('has identical key sets in both locales (no key missing on either side)', () => {
    const pt = leafKeys(messages.pt).sort();
    const en = leafKeys(messages.en).sort();
    expect(en).toEqual(pt);
    expect(pt.length).toBeGreaterThan(0);
  });

  it('has a non-empty string for every key in every locale', () => {
    for (const locale of LOCALES) {
      for (const key of leafKeys(messages[locale])) {
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
