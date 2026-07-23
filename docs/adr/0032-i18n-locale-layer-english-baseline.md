# 0032. Internationalize the site — light in-repo locale layer, English-pinned crawlable baseline

- **Status:** accepted
- **Date:** 2026-07-23
- **Deciders:** the owner
- **Driven by:** [ADR-0024](./0024-profile-canonical-cv-cross-surface.md) (cross-surface CV coherence)
- **Supersedes:** [ADR-0011](./0011-ui-ptbr-i18n-deferred.md)

## Context & problem
The owner maintains **one CV across several surfaces** — this site, LinkedIn, and the Canva CV. LinkedIn and
Canva are **English**, and the site's canonical structured CV data (`profile.ts`, [ADR-0024](./0024-profile-canonical-cv-cross-surface.md))
is **already English**. But the site's UI was **pt-BR-only** ([ADR-0011](./0011-ui-ptbr-i18n-deferred.md)),
so the site presented an English CV inside pt-BR chrome — incoherent with the other surfaces and blocking the
CV sync.

ADR-0011 recorded pt-BR-now and **deferred i18n to its own phase**, naming the UI-pt-BR / profile-data-EN
inconsistency as the thing that phase would resolve. **This is that phase, done now.** i18n is the
prerequisite to finish the cross-surface CV sync: the site must be able to present in English to match
LinkedIn + Canva, while still serving pt-BR visitors in their language.

## Decision drivers
- **Cross-surface CV coherence** ([ADR-0024](./0024-profile-canonical-cv-cross-surface.md)): the English CV
  must render in English chrome so the site matches LinkedIn + Canva. This is the driving requirement.
- **Native-language reach:** a pt-BR visitor should still get the site in their language, live.
- **Lean by design** ([ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)): two locales on a static
  SPA don't justify an i18n framework or a new dependency-class.
- **Static invariant** ([ADR-0002](./0002-fully-static-spa-no-backend.md)) and **build-time OG/SEO**
  ([ADR-0004](./0004-build-time-render-not-ssr-or-edge.md), [ADR-0005](./0005-og-coverage-every-public-url.md)):
  whatever we build must not add a server and must keep the crawlable/unfurlable baseline intact.

## Considered options
1. **Light in-repo locale layer** (chosen) — a typed pt/en message catalog + a `LocaleProvider` +
   `useT()` / `useLocale()` hooks, **no i18n library**. *Trade-off:* hand-rolled, so no ICU
   pluralization/interpolation niceties; but **zero new dependency-class**, minimal bundle, and it fits the
   repo's "simplest thing, no unnecessary deps, no shadcn" floor. Two locales don't need a framework.
2. **An i18n library** (react-i18next / react-intl / lingui) — *Why not:* a new dependency/tool-class plus
   bundle weight for little gain at exactly two locales. The pluralization/interpolation machinery these
   bring is unearned at this scale (ADR-0001).

## Decision outcome
Chosen: **the light in-repo locale layer**, with the following specifics.

- **Default = the visitor's native browser language.** `navigator.language` resolves to `pt` or `en`; a
  **manual PT/EN toggle** overrides and **persists** in `localStorage`; the fallback is `en`.
- **Detect-before-first-render.** The locale is resolved **synchronously before `createRoot`**, so there is
  no post-mount language flash. `<html lang>` tracks the active locale.
- **CV content stays canonical English.** Only the UI **chrome** localizes; the CV data (`profile.ts`,
  [ADR-0024](./0024-profile-canonical-cv-cross-surface.md)) stays English. In **EN**, chrome + content are
  both English (the point of this work). In **PT**, pt-BR chrome wraps the English CV — an **accepted
  interim**, resolved by the deferred pt-BR-CV-translation slice (Slice 3 below).
- **The prerender / crawlable + OG baseline is pinned to ENGLISH.** `scripts/prerender.mjs` forces the
  browser locale to `en-US` during the snapshot, so Google / LinkedIn / WhatsApp discovery + unfurl are
  **English** — serving the CV-sync driver and [ADR-0024](./0024-profile-canonical-cv-cross-surface.md) —
  while the **live SPA still auto-detects native**. *Consequence:* a pt-BR visitor sharing the blog gets
  English **chrome** in the unfurl (the article **body** stays pt-BR).
- **`LocaleProvider` is a LANGUAGE context, explicitly NOT the forbidden visual `ThemeProvider`.**
  `apps/fed/CLAUDE.md`'s "no `ThemeProvider` / single fixed theme" rule is about the **visual** theme
  (brutalist mono is fixed, [ADR-0008](./0008-brutalist-mono-identity.md)). This locale context is a
  deliberate, carved exception so a future reader does not misread it as drift.

### Slice split
- **Slice 1 (this ADR, shipping now):** client-side PT/EN toggle + native auto-detect + English-pinned
  prerender.
- **Slice 2 (deferred):** route-prefixed `/en` · `/pt` + **per-locale prerender** + `hreflang` / per-locale
  canonical + per-locale OG. This interacts with [ADR-0005](./0005-og-coverage-every-public-url.md)
  (OG coverage) and [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md) (build-time render) — it is the
  slice that makes **pt-BR discovery** first-class.
- **Slice 3 (deferred):** a translated pt-BR `profile` object, so PT mode wraps a pt-BR CV instead of the
  English one.
- **Out of scope:** blog article i18n — long-form pt-BR articles stay pt-BR.

## Consequences
**Good**
- The site presents the CV in **English**, coherent with LinkedIn + Canva ([ADR-0024](./0024-profile-canonical-cv-cross-surface.md));
  the CV-sync driver is served.
- **Native-language visitors still get their language live** (auto-detect + persisted manual toggle).
- **No new dependency** — a typed catalog + two hooks; the "simplest thing" floor ([ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)) holds.
- The **static invariant** ([ADR-0002](./0002-fully-static-spa-no-backend.md)) is intact — no server, no
  Accept-Language edge logic.

**Bad / accepted costs**
- A **single-locale prerender** means only the **English** snapshot ships OG/SEO; **pt-BR discovery is
  deferred to Slice 2**.
- **PT mode wraps an English CV** until Slice 3 translates the `profile` object.
- A brief **static-shell flash** for a non-baseline (pt-BR) browser until the bundle renders and re-detects —
  mitigated by detect-before-first-render, and **fully removed only by Slice 2's per-locale prerender**.

## Links
- **Supersedes** [ADR-0011](./0011-ui-ptbr-i18n-deferred.md) (UI in pt-BR; i18n deferred) — this is the i18n
  phase ADR-0011 named.
- **Driven by / consistent with** [ADR-0024](./0024-profile-canonical-cv-cross-surface.md): the English CV
  stays canonical — no contradiction; only chrome localizes.
- **Interacts with** [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md) (build-time render) and
  [ADR-0005](./0005-og-coverage-every-public-url.md) (OG coverage on every public URL) — the deferred Slice 2
  makes per-locale prerender + `hreflang` first-class.
- Also **supersedes the earlier i18n sketch** in `docs/redesign/redesign-plan.md` (pt default + a
  CloudFront-Function Accept-Language approach) — that plan section is now stale and will be updated
  separately.
