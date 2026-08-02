// The words on the OG cards, per locale — the pure half of the two generators (#167).
//
// Split out for the same reason og-cards.mjs is: a generator drives a browser and cannot be unit
// tested, but WHICH WORDS it prints is decision content, and this is the one place a test can reach it.
//
// WHY THIS FILE EXISTS AT ALL, which is the part worth reading: the default card's hook is the HERO'S
// TAGLINE, and it was re-typed here as a literal. Two copies of one sentence in two languages, with
// nothing asserting they match — the shape that put Portuguese on /en/portfolio for three days (#235).
// A .mjs script cannot import the TypeScript catalog, so the copy still lives here; what changed is that
// `og-copy.test.mjs` now reconstructs each locale's tagline from these fields and compares it to
// `src/i18n/messages.ts`. Editing the hero without editing the card is a red test, not a silent
// divergence between the page and the card that advertises it.

/** Locales the site publishes. Mirrors src/i18n/config.ts. */
export const LOCALES = ['pt', 'en'];

/**
 * The line under the mark on every card, both locales, both generators.
 *
 * NOT TRANSLATED, and that is a positioning decision rather than an omission: `agentic`, `AI-native`,
 * `AI-DLC` and `Agent Harness Engineering` stay English in both editions, because the card is where a pt
 * reader meets the term FIRST and a rectangle that renders ~320px wide has no room to teach one.
 *
 * It says `Agentic development`, not `Agentic dev` — the abbreviation was drift on the single surface
 * the vocabulary decision names explicitly.
 *
 * THIS LINE HAS NOW BEEN CHANGED TWICE IN THREE DAYS, and the cost is worth stating precisely because
 * it did not stop either change. `Loop Engineering` → `Harness Engineering` on 2026-07-31, then
 * → `Agent Harness Engineering` on 2026-08-02 (both owner). Each edit REPUBLISHES all four cards, and
 * under ADR-0041 every regeneration republishes an artifact scrapers have pinned: a post that unfurled
 * before an edit keeps the old card forever, and is right on every post made after.
 *
 * So the cost is per-EDIT and bounded by how much has been shared, not by how many surfaces the term
 * lives on — which is exactly why each rename still moves every surface in ONE batch. Splitting a
 * rename across merges would multiply the windows in which someone pins a card carrying one name while
 * the CV reads another, at no saving.
 */
export const META_LINE = 'Agentic development · AI-DLC & Agent Harness Engineering · Open source';

/**
 * The default card's hook and subline, per locale.
 *
 * `lines` are the hook's leading rows, `tail` opens the last row and `accent` closes it in safety orange.
 * Concatenated with single spaces they reconstruct the hero's `taglineLead` — minus its trailing em-dash,
 * which is a page-layout join between two spans and not part of the sentence.
 *
 * EVERY BREAK IS AUTHORED, PER LOCALE, and that is the point of the array. The first version gave each
 * edition one authored break and let the rest wrap: en broke where a human decided (`LEARN TO BUILD /
 * WITH AI`, a clean semantic seam) while pt broke wherever the browser ran out of room (`APRENDA A /
 * CONSTRUIR / COM IA`), stranding the article `A` at the end of a line, away from the verb it belongs
 * to. Same words, but one edition line-planned and the other auto-wrapped is the structural signature of
 * a TRANSLATION — which this copy is not; it is the hero's own pt sentence, authored as a peer.
 * The generator still measures the rendered result, because an authored plan is not a guarantee of fit.
 */
export const CARD_COPY = {
  pt: { lines: ['Aprenda', 'a construir'], tail: 'com', accent: 'IA', sub: 'do dia a dia à produção' },
  en: { lines: ['Learn to build'], tail: 'with', accent: 'AI', sub: 'from everyday life to production' },
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
