// Should we OFFER the reader their own language? (#172)
//
// Per-locale URLs made the path authoritative (ADR-0036): a shared `/en/…` link pins English for whoever
// opens it, including a pt-BR native who would rather read Portuguese. The answer is deliberately an
// OFFER, never a redirect — the sharer's link keeps working exactly as sent, and the reader opts in.
//
// The decision is pure and lives here rather than in the component so every branch can be exercised
// without a DOM: the interesting part is not the toast, it is the four ways it must stay silent.
import { isLocale, STORAGE_KEY, type Locale } from '../i18n/config';

/** localStorage key recording that the reader dismissed the offer. Distinct from `locale` (STORAGE_KEY), which records a CHOICE. */
export const SUGGESTION_DISMISSED_KEY = 'locale-suggestion-dismissed';

/**
 * Is this the build-time snapshot browser rather than a visitor? (`scripts/prerender.mjs` sets the flag
 * through `addInitScript`.)
 *
 * The prerender context is pinned to en-US and its output is served to EVERYONE, so anything that renders
 * off the visitor's language must not render into it. Without this, `/pt` snapshots contained an offer to
 * read in English — shipped in the HTML, shown to every Portuguese reader until hydration removed it.
 *
 * A post-mount `mounted` flag does not cover this, and the reason is easy to get wrong: the prerender
 * snapshots a LIVE, already-hydrated page, so effects have run and `mounted` is true. Measured, not
 * assumed — the first implementation used the mount flag and the offer was in `dist/pt/**` anyway.
 */
export function isPrerender(): boolean {
  return typeof window !== 'undefined' && window.__PRERENDER__ === true;
}

/** The visitor's own language, from the browser/OS. Anything that is not Portuguese reads as English —
 *  the site has two editions, and English is the baseline for every other language (owner rule). */
export function browserLocale(language = navigator.language): Locale {
  return language.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

export interface SuggestionInput {
  /** The locale the URL pins (ADR-0036) — what the reader is currently being served. */
  pathLocale: Locale;
  /** The reader's own language. */
  visitorLocale: Locale;
  /** A previously PERSISTED explicit choice (the PT/EN toggle), if any. */
  storedChoice: string | null;
  /** Whether the reader already dismissed the offer. */
  dismissed: boolean;
}

/**
 * The locale to offer, or null to stay silent. Null in four distinct cases, each for its own reason:
 *
 *  - the page is already in the reader's language — nothing to offer;
 *  - the reader dismissed the offer before — asking again on every page is nagging, and the issue
 *    explicitly rules it out;
 *  - the reader has explicitly CHOSEN this locale with the toggle — a pt-BR speaker reading the English
 *    edition on purpose is the case most likely to regress silently, and the offer would second-guess a
 *    decision they already made;
 *  - the stored choice is the OTHER locale, which means they chose it and then followed a link that
 *    pins this one. The path still wins (ADR-0036), and the offer stands — this is the case the feature
 *    exists for, so it is listed here to be explicit that it does NOT suppress.
 */
export function localeToOffer({ pathLocale, visitorLocale, storedChoice, dismissed }: SuggestionInput): Locale | null {
  if (visitorLocale === pathLocale) return null;
  if (dismissed) return null;
  if (isLocale(storedChoice) && storedChoice === pathLocale) return null;
  return visitorLocale;
}

/** Read the persisted state. Storage access is wrapped: a browser with storage disabled must not break the page. */
export function readSuggestionState(): { storedChoice: string | null; dismissed: boolean } {
  try {
    return {
      storedChoice: window.localStorage.getItem(STORAGE_KEY),
      dismissed: window.localStorage.getItem(SUGGESTION_DISMISSED_KEY) === '1',
    };
  } catch {
    // Storage unavailable (private mode, blocked cookies). Treat it as "no history": the offer may show
    // once per page, which is the failure that costs the reader least.
    return { storedChoice: null, dismissed: false };
  }
}

/** Record the dismissal so the offer is not repeated. */
export function storeDismissal(): void {
  try {
    window.localStorage.setItem(SUGGESTION_DISMISSED_KEY, '1');
  } catch {
    // Nothing to do — the offer will reappear next page, which is preferable to throwing on a click.
  }
}

/**
 * Persist a locale CHOICE without navigating — the same store and key the PT/EN toggle writes, so it
 * outranks detection from here on (`detectLocale`: path → stored → navigator).
 *
 * Separate from the toggle's `setLocale` on purpose: that one persists AND navigates, which is right
 * when the reader is changing edition and wrong when they are staying put. Calling it with the locale
 * already on screen would push a history entry for a navigation to the page you are on.
 *
 * #323 is why this exists. The dismiss button reads "Continue in Portuguese" — an affirmative statement
 * of preference — and its handler wrote only the dismissal key. So a reader who answered the offer with
 * it had stated a language and the site stored NOTHING, then silenced the one control that would have
 * asked again. Next open at the bare root fell through to `navigator.language`, in the other language,
 * permanently. From the reader's seat that is "it does not remember", which is exactly how it was
 * reported.
 */
export function storeChoice(locale: Locale): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Same posture as `storeDismissal`: a browser with storage disabled must not break a click. The
    // cost is that the preference does not survive the session, which is the failure that costs least.
  }
}
