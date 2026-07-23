// Locale layer (light, in-repo — no i18n library, honouring "simple, no unnecessary deps"). Two
// locales: pt (pt-BR chrome) and en (the professional / prerender baseline). This module holds the
// pure locale primitives — the message catalog is in ./messages, the React context in ./context.

export type Locale = 'pt' | 'en';

export const LOCALES: readonly Locale[] = ['pt', 'en'];

/** localStorage key for the manual PT/EN toggle (the persisted override). */
export const STORAGE_KEY = 'locale';

export function isLocale(value: unknown): value is Locale {
  return value === 'pt' || value === 'en';
}

/** The <html lang> value for a locale (BCP-47). pt → pt-BR so the CV region reads as Brazilian. */
export function htmlLang(locale: Locale): string {
  return locale === 'pt' ? 'pt-BR' : 'en';
}

/** The Intl date locale for `toLocaleDateString` (article/feed dates). */
export function dateLocale(locale: Locale): string {
  return locale === 'pt' ? 'pt-BR' : 'en-US';
}

/**
 * Resolve the active locale. Called SYNCHRONOUSLY before `createRoot` (see main.tsx) so React's
 * first render is already in the right locale — no post-mount flash.
 *
 * Precedence:
 *   1. a persisted override (the manual toggle) wins over detection;
 *   2. else the user's native browser language (`navigator.language`, pt* → pt);
 *   3. else English — the professional / prerender baseline.
 */
export function detectLocale(): Locale {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (isLocale(stored)) return stored;
  return navigator.language.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}
