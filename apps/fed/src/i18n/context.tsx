// LANGUAGE context (UI locale) exposing { locale, setLocale, t }.
//
// NOTE: this is a LANGUAGE context, NOT the forbidden `ThemeProvider`. The "no ThemeProvider / single
// fixed theme" rule (apps/fed/CLAUDE.md, fixed decisions) is about the visual THEME — colours, radius,
// shadow. Localizing UI chrome is an orthogonal concern and introduces no second visual theme.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { detectLocale, htmlLang, STORAGE_KEY, type Locale } from './config';
import { translate, type MessageKey } from './messages';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
}

// Default (no provider) falls back to English — the same baseline as detectLocale's final fallback,
// so there is a single source of truth for "no signal → en". In the app a provider always wraps the
// tree (main.tsx), so this default only guards stray renders.
const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => translate('en', key),
});

export function LocaleProvider({ initialLocale, children }: { initialLocale?: Locale; children: ReactNode }) {
  // Initialised from the value resolved synchronously in main.tsx (passed in), so the FIRST render is
  // already correct. When omitted (e.g. a test that doesn't care), detect at mount.
  const [locale, setLocaleState] = useState<Locale>(() => initialLocale ?? detectLocale());

  // The manual toggle: persist the override (wins over detection next load) and switch now.
  const setLocale = useCallback((next: Locale) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setLocaleState(next);
  }, []);

  // Keep <html lang> in sync with the active locale. main.tsx sets it pre-render (no flash); this
  // keeps it correct after a manual toggle.
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
