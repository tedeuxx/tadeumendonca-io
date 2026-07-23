import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { detectLocale, isLocale, htmlLang, dateLocale, STORAGE_KEY } from './config';

describe('isLocale', () => {
  it('accepts pt/en and rejects anything else', () => {
    expect(isLocale('pt')).toBe(true);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe('htmlLang / dateLocale', () => {
  it('map pt → pt-BR and en → en / en-US', () => {
    expect(htmlLang('pt')).toBe('pt-BR');
    expect(htmlLang('en')).toBe('en');
    expect(dateLocale('pt')).toBe('pt-BR');
    expect(dateLocale('en')).toBe('en-US');
  });
});

describe('detectLocale', () => {
  const setNavLanguage = (language: string) => vi.stubGlobal('navigator', { language });

  beforeEach(() => window.localStorage.removeItem(STORAGE_KEY));
  afterEach(() => vi.unstubAllGlobals());

  it('honours a valid persisted override over browser detection', () => {
    window.localStorage.setItem(STORAGE_KEY, 'en');
    setNavLanguage('pt-BR'); // detection alone would say pt; the toggle override wins
    expect(detectLocale()).toBe('en');
  });

  it('ignores an invalid stored value and falls back to detection', () => {
    window.localStorage.setItem(STORAGE_KEY, 'de');
    setNavLanguage('pt-BR');
    expect(detectLocale()).toBe('pt');
  });

  it('detects pt from a pt* browser language', () => {
    setNavLanguage('PT-br'); // case-insensitive
    expect(detectLocale()).toBe('pt');
  });

  it('falls back to en for a non-pt browser language (the professional baseline)', () => {
    setNavLanguage('fr-FR');
    expect(detectLocale()).toBe('en');
  });
});
