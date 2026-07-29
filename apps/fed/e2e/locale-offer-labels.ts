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
// one. What makes it honest is that the guard proves **each** label is live before asserting its absence:
// it drives a real browser twice, once per direction (a pt-BR reader on `/en/me`, an en-US reader on
// `/pt/me`), matching on the value it is about to grep for. A stale label fails the positive half,
// loudly, instead of silently weakening the negative one.
//
// BOTH directions are required, and the first version of this file only covered `pt` — which left the
// `en` label in exactly the state this exists to fix. English is the canonical edition (ADR-0024) and
// pt-BR is a translation of it, so an English-only copy edit is the MORE likely one, and it was the one
// still unguarded.
//
// Deliberately NOT imported from `src/i18n/messages.ts`. No E2E spec imports app code today, and doing it
// here would introduce a version skew that matters: this suite also runs against **production**, where
// the deployed copy is whatever last shipped, not what is in the working tree. A spec that asserts
// against tree-state copy would go red on a legitimate copy change before the deploy — failing for a
// setup reason, which #195 forbids of the post-deploy step. One hand-copied constant with a liveness
// proof is the smaller cost.
// Typed rather than `as const`: `e2e/` is outside `tsconfig.json`'s `include`, so `npm run typecheck`
// does not cover this file and ESLint here is not type-aware. Without the annotation a mistyped key
// (`LOCALE_OFFER_LABEL.ptBR`) is silently `undefined`, and `getByRole('region', { name: undefined })`
// matches ANY region — so the liveness proof below would pass on any page. A string literal could not
// fail that way; the indirection introduces the risk, so the indirection carries the guard.
export const LOCALE_OFFER_LABEL: Record<'pt' | 'en', string> = {
  pt: 'Sugestão de idioma',
  en: 'Language suggestion',
};

/** Both labels, for assertions that must cover either edition. */
export const LOCALE_OFFER_LABELS = Object.values(LOCALE_OFFER_LABEL);
