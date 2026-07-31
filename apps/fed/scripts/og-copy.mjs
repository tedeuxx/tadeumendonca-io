// The words on the OG cards, per locale — the pure half of the two generators (#167).
//
// Split out for the same reason og-cards.mjs is: a generator drives a browser and cannot be unit
// tested, but WHICH WORDS it prints is decision content, and this is the one place a test can reach it.
//
// WHY THIS FILE EXISTS AT ALL, which is the part worth reading: the default card's hook is the HERO'S
// TAGLINE, and it was re-typed here as a literal. Two copies of one sentence in two languages, with
// nothing asserting they match — the shape that put Portuguese on /en/portfolio for three days (#235).
// A .mjs script cannot import the TypeScript catalog, so the copy still lives here; what changed is that
// `og-copy.test.ts` now reconstructs each locale's tagline from these fields and compares it to
// `src/i18n/messages.ts`. Editing the hero without editing the card is a red test, not a silent
// divergence between the page and the card that advertises it.

/** Locales the site publishes. Mirrors src/i18n/config.ts. */
export const LOCALES = ['pt', 'en'];

/**
 * The line under the mark on every card, both locales, both generators.
 *
 * NOT TRANSLATED, and that is a positioning decision rather than an omission: `agentic`, `AI-native`,
 * `AI-DLC` and `Loop Engineering` stay English in both editions, because the card is where a pt reader
 * meets the term FIRST and a rectangle that renders ~320px wide has no room to teach one.
 *
 * It says `Agentic development`, not `Agentic dev`. The vocabulary hierarchy fixes the identity as
 * "Agentic development / AI-DLC / Loop Engineering"; the abbreviation was drift on the single surface
 * that decision names explicitly.
 */
export const META_LINE = 'Agentic development · AI-DLC / Loop Engineering · Open source';

/**
 * The default card's hook and subline, per locale.
 *
 * `line1` / `line2` are the hook's two authored blocks, `accent` is the final word carried in safety
 * orange, and the three concatenate back to the hero's `taglineLead` (minus its trailing em-dash, which
 * is a page-layout join and not part of the sentence).
 *
 * ONE authored break, before the last line — not a full line plan. `line1` still wraps naturally if it
 * is too wide, which is what the pt edition actually does: `APRENDA A / CONSTRUIR / COM IA` renders as
 * three lines, not two. That reads well and fills the card better than the two-line en edition does,
 * but it is the browser's decision, not this file's — so the generator MEASURES the result rather than
 * trusting it, the same refusal ADR-0041 put on the article cards after a pt-BR word ran off the canvas
 * with every gate still green.
 */
export const CARD_COPY = {
  pt: { line1: 'Aprenda a construir', line2: 'com', accent: 'IA', sub: 'do dia a dia à produção' },
  en: { line1: 'Learn to build', line2: 'with', accent: 'AI', sub: 'from everyday life to production' },
};

/**
 * The card's public path for a locale.
 *
 * English keeps the unsuffixed `og-default.png` — the locale suffix is ADDITIVE, not a rename. Every
 * link shared since launch pinned that URL, and renaming it would 404 the image on posts already out;
 * the suffix-for-everyone symmetry is aesthetic, the pinned URL is structural. English is also the
 * x-default edition, so the bare name being the English one is true rather than merely convenient.
 */
export const defaultCardFile = (locale) => (locale === 'en' ? 'og-default.png' : `og-default.${locale}.png`);
