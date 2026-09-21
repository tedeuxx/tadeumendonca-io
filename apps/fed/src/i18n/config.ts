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
 * The edition every other language falls back to. English is the professional / prerender / x-default
 * baseline (ADR-0032), which is why it is a FALLBACK below and never a match — see `browserLocale`.
 */
export const BASELINE_LOCALE: Locale = 'en';

/**
 * The browser's declared languages, in the order the reader declared them.
 *
 * `navigator.languages` is the list; `navigator.language` is only its first entry. The single-value
 * API is the FALLBACK rather than the source, because some privacy configurations expose an empty
 * `languages` and some test environments do not expose it at all. Reading `languages[0]` on an empty
 * list would be a regression for those readers rather than a fix, which is why this is a length check
 * and not an index.
 */
export function declaredLanguages(): readonly string[] {
  const declared = navigator.languages;
  if (Array.isArray(declared) && declared.length > 0) return declared;
  return navigator.language ? [navigator.language] : [];
}

/**
 * The visitor's own language, resolved from the FULL declared list rather than from its first entry
 * (#661).
 *
 * Reading only `navigator.language` served English to a reader whose browser declares
 * `["en-US", "en", "pt"]` — Portuguese asked for, third in the list. That is not a fringe
 * configuration: it is the ordinary machine of a Brazilian engineer whose OS, IDE and browser are set
 * up in English, which is this site's modal reader. Nothing detected them, they were served the
 * baseline, and they were then counted as an English reader.
 *
 * The walk is in DECLARED ORDER and compares on the PRIMARY SUBTAG, so `pt-BR`, `pt-PT` and `pt` all
 * read as Portuguese and `en-US`, `en-GB` and `en` all read as English.
 *
 * ENGLISH IS THE BASELINE, NOT A MATCH, and that asymmetry is the fix rather than an oversight. The
 * site has exactly two editions and English is what every other language falls back to (the owner's
 * rule, 2026-07-28). If an `en*` entry ended the walk, the list above would resolve to English again
 * and this change would fix nothing. So the rule in one sentence: **Portuguese declared anywhere in
 * the list wins; everything else is English.** With two editions and one of them the fallback, order
 * is not observable in the outcome — the walk is written in order anyway, so that a third edition
 * would behave correctly rather than accidentally.
 */
export function browserLocale(languages: readonly string[] = declaredLanguages()): Locale {
  for (const tag of languages) {
    const primary = tag.toLowerCase().split('-')[0];
    if (isLocale(primary) && primary !== BASELINE_LOCALE) return primary;
  }
  return BASELINE_LOCALE;
}

/**
 * Resolve the active locale. Called SYNCHRONOUSLY before `createRoot` (see main.tsx) so React's
 * first render is already in the right locale — no post-mount flash — and by the bare-root redirect
 * (App.tsx) to pick which prefix an unprefixed URL lands on.
 *
 * Precedence (ADR-0036 — per-locale URLs make the path authoritative):
 *   1. the locale in the URL path (`/pt/…`, `/en/…`) — a shared prefixed link wins over everything;
 *   2. else a persisted override (the manual toggle) — the bare-root default follows the last choice;
 *   3. else the browser's DECLARED LIST, in order (`navigator.languages`, pt* anywhere → pt);
 *   4. else English — the professional / prerender / x-default baseline.
 *
 * Steps 1 and 2 are untouched by #661 and must stay so. The path is authoritative because the
 * prerender, the self-canonical + `hreflang` reciprocity and the sharer's contract all rest on it, and
 * an explicit persisted choice outranks any inference about the reader. Only step 3 widened.
 */
export function detectLocale(pathname?: string): Locale {
  const fromPath = pathname ? localeFromPath(pathname) : null;
  if (fromPath) return fromPath;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (isLocale(stored)) return stored;
  return browserLocale();
}
