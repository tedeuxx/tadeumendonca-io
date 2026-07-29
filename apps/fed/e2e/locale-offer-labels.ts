// The locale offer's accessible name, in both locales — declared ONCE for the whole E2E suite (#231).
//
// Why this file exists: the prerender guard in `per-locale.spec.ts` asserts the shipped HTML does NOT
// contain these strings. A **negative** assertion never fails on a bad selector — rename the copy in
// `src/i18n/messages.ts` and the guard searches for a string that exists nowhere, and passes having
// checked nothing. That is the same green-that-stopped-checking shape this repo keeps finding, sitting on
// top of an invariant (ADR-0036: *the prerender is not a visitor*) whose whole justification is that the
// failure is invisible outside the built artifact.
//
// Declaring the labels here does not by itself make the guard honest — it only moves nine copies into
// one. What makes it honest is that the guard now **proves the label is live before asserting its
// absence**: it first drives a real browser where the offer MUST appear and matches on this value, then
// checks the prerendered HTML. A stale label fails the positive half, loudly, instead of silently
// weakening the negative one.
//
// Deliberately NOT imported from `src/i18n/messages.ts`. No E2E spec imports app code today, and doing it
// here would introduce a version skew that matters: this suite also runs against **production**, where
// the deployed copy is whatever last shipped, not what is in the working tree. A spec that asserts
// against tree-state copy would go red on a legitimate copy change before the deploy — failing for a
// setup reason, which #195 forbids of the post-deploy step. One hand-copied constant with a liveness
// proof is the smaller cost.
export const LOCALE_OFFER_LABEL = {
  pt: 'Sugestão de idioma',
  en: 'Language suggestion',
} as const;

/** Both labels, for assertions that must cover either edition. */
export const LOCALE_OFFER_LABELS = Object.values(LOCALE_OFFER_LABEL);
