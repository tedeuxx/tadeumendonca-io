import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  detectLocale,
  isLocale,
  htmlLang,
  dateLocale,
  ogLocale,
  localeFromPath,
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

describe('detectLocale', () => {
  const setNavLanguage = (language: string) => vi.stubGlobal('navigator', { language });

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
});
