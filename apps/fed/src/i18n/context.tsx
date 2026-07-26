// LANGUAGE context (UI locale) exposing { locale, setLocale, t }.
//
// NOTE: this is a LANGUAGE context, NOT the forbidden `ThemeProvider`. The "no ThemeProvider / single
// fixed theme" rule (apps/fed/CLAUDE.md, fixed decisions) is about the visual THEME — colours, radius,
// shadow. Localizing UI chrome is an orthogonal concern and introduces no second visual theme.
//
// Per-locale URLs (ADR-0036): the URL PATH is the source of truth for the active locale. The provider
// reads it from the router location (`/pt/…` → pt, `/en/…` → en); it does not hold locale state. The
// toggle NAVIGATES to the same sub-path under the other prefix (and persists the choice, so the bare-root
// redirect follows the last edition the reader picked). A shared `/pt/…` link therefore always wins over a
// persisted `en`, because the path is read first.
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { htmlLang, localeFromPath, localePath, pathWithoutLocale, STORAGE_KEY, type Locale } from './config';
import { translate, type MessageKey } from './messages';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
}

// Default (no provider) falls back to English — the same baseline as detectLocale's final fallback,
// so there is a single source of truth for "no signal → en". In the app a provider always wraps the
// tree (inside the /:locale route), so this default only guards stray renders.
const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => translate('en', key),
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  // The path is authoritative. The provider only renders under the /:locale route (App.tsx validates the
  // segment), so a prefix is always present; the `?? 'en'` guards a stray mount off a valid prefix.
  const locale = localeFromPath(location.pathname) ?? 'en';

  // The manual toggle: persist the override (drives the bare-root default next visit) and navigate to the
  // SAME sub-path under the other locale's prefix, preserving any query + hash.
  const setLocale = useCallback(
    (next: Locale) => {
      window.localStorage.setItem(STORAGE_KEY, next);
      const rest = pathWithoutLocale(location.pathname);
      navigate(`${localePath(next, rest === '' ? '/' : rest)}${location.search}${location.hash}`);
    },
    [navigate, location.pathname, location.search, location.hash],
  );

  // Keep <html lang> in sync with the path locale (main.tsx sets it pre-render; this tracks client-side
  // navigation and the toggle).
  useEffect(() => {
    document.documentElement.lang = htmlLang(locale);
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t: (key) => translate(locale, key) }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** Full locale context: `{ locale, setLocale, t }`. */
export function useLocale() {
  return useContext(LocaleContext);
}

/** Just the translator: `const t = useT(); t('nav.articles')`. */
export function useT() {
  return useContext(LocaleContext).t;
}

/**
 * A path localizer bound to the active locale: `const lp = useLocalePath(); lp('/me')` → `/pt/me`.
 * Every in-app link/route is authored against the UNPREFIXED logical path and prefixed here, so links
 * stay within the reader's current locale.
 */
export function useLocalePath() {
  const { locale } = useContext(LocaleContext);
  return useCallback((path: string) => localePath(locale, path), [locale]);
}
