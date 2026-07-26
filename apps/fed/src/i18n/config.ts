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

/** The `og:locale` value (Open Graph uses `xx_YY`). pt → pt_BR, en → en_US. */
export function ogLocale(locale: Locale): string {
  return locale === 'pt' ? 'pt_BR' : 'en_US';
}

/**
 * The locale encoded in a URL path, or null when the path carries no valid locale prefix
 * (bare `/`, an unprefixed `/me`, or an invalid segment like `/xyz`). Per-locale URLs are the
 * source of truth (ADR-0036): `/pt/me` → 'pt', `/en` → 'en', `/me` → null, `/` → null.
 */
export function localeFromPath(pathname: string): Locale | null {
  const seg = pathname.split('/')[1];
  return isLocale(seg) ? seg : null;
}

/**
 * Prefix a logical route path with a locale segment: `localePath('pt', '/me')` → `/pt/me`,
 * `localePath('en', '/')` → `/en`, `localePath('pt', '/#artigos')` → `/pt/#artigos`. The input is
 * the UNPREFIXED logical path the app is authored against; this is the single place the prefix is added.
 */
export function localePath(locale: Locale, path = '/'): string {
  return path === '/' ? `/${locale}` : `/${locale}${path}`;
}

/**
 * The logical (unprefixed) remainder of a locale-prefixed path: `/pt/me` → `/me`, `/pt` → '',
 * `/en/blog/x` → `/blog/x`. An already-unprefixed path is returned unchanged. Used to carry the
 * sub-path across a locale switch (`setLocale`) and when redirecting the bare root.
 */
export function pathWithoutLocale(pathname: string): string {
  const m = /^\/(?:pt|en)(\/.*)?$/.exec(pathname);
  return m ? (m[1] ?? '') : pathname;
}

/**
 * Resolve the active locale. Called SYNCHRONOUSLY before `createRoot` (see main.tsx) so React's
 * first render is already in the right locale — no post-mount flash — and by the bare-root redirect
 * (App.tsx) to pick which prefix an unprefixed URL lands on.
 *
 * Precedence (ADR-0036 — per-locale URLs make the path authoritative):
 *   1. the locale in the URL path (`/pt/…`, `/en/…`) — a shared prefixed link wins over everything;
 *   2. else a persisted override (the manual toggle) — the bare-root default follows the last choice;
 *   3. else the user's native browser language (`navigator.language`, pt* → pt);
 *   4. else English — the professional / prerender / x-default baseline.
 */
export function detectLocale(pathname?: string): Locale {
  const fromPath = pathname ? localeFromPath(pathname) : null;
  if (fromPath) return fromPath;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (isLocale(stored)) return stored;
  return navigator.language.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}
