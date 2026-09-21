# 0032. Internationalize the site — light in-repo locale layer, ~~English-pinned crawlable baseline~~

> **The title's second half is RETIRED** (2026-07-26, [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md)).
> Both locales are prerendered. What this ADR still owns is the locale layer — read the 2026-07-29
> amendment at the foot before acting on anything here (#234).

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

- **Default = the visitor's native browser language.** ~~`navigator.language` resolves to `pt` or `en`~~
  **the visitor's FULL declared list, `navigator.languages`, resolves to `pt` or `en` (amended
  2026-09-20, see the foot of this file)**; a **manual PT/EN toggle** overrides and **persists** in
  `localStorage`; the fallback is `en`.
- **Detect-before-first-render.** The locale is resolved **synchronously before `createRoot`**, so there is
  no post-mount language flash. `<html lang>` tracks the active locale.
- ~~**CV content stays canonical English.** Only the UI **chrome** localizes; the CV data (`profile.ts`,
  [ADR-0024](./0024-profile-canonical-cv-cross-surface.md)) stays English. In **EN**, chrome + content are
  both English (the point of this work). In **PT**, pt-BR chrome wraps the English CV — an **accepted
  interim**, resolved by the deferred pt-BR-CV-translation slice (Slice 3 below).~~ **SUPERSEDED by
  Slice 3, shipped 2026-07-23:** the CV content localizes too, so chrome and content are always in the
  same language. English remains the **canonical** edition (ADR-0024), which is a statement about which
  edition is authoritative — not about which one a pt visitor sees.
- ~~**The prerender / crawlable + OG baseline is pinned to ENGLISH.** `scripts/prerender.mjs` forces the
  browser locale to `en-US` during the snapshot, so Google / LinkedIn / WhatsApp discovery + unfurl are
  **English** — serving the CV-sync driver and [ADR-0024](./0024-profile-canonical-cv-cross-surface.md) —
  while the **live SPA still auto-detects native**. *Consequence:* a pt-BR visitor sharing the blog gets
  English **chrome** in the unfurl (the article **body** stays pt-BR).~~
  **RETIRED 2026-07-26 by [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md)** — every route is now
  snapshotted in **both** locales, each with its own head; only the bare `/` snapshot is still English, as
  the x-default entry. See the 2026-07-29 amendment at the foot of this file.
- **`LocaleProvider` is a LANGUAGE context, explicitly NOT the forbidden visual `ThemeProvider`.**
  `apps/fed/CLAUDE.md`'s "no `ThemeProvider` / single fixed theme" rule is about the **visual** theme
  (brutalist mono is fixed, [ADR-0008](./0008-brutalist-mono-identity.md)). This locale context is a
  deliberate, carved exception so a future reader does not misread it as drift.

### Slice split
- **Slice 1 (this ADR, shipping now):** client-side PT/EN toggle + native auto-detect + English-pinned
  prerender.
- ~~**Slice 2 (deferred):** route-prefixed `/en` · `/pt` + **per-locale prerender** + `hreflang` / per-locale
  canonical + per-locale OG. This interacts with [ADR-0005](./0005-og-coverage-every-public-url.md)
  (OG coverage) and [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md) (build-time render) — it is the
  slice that makes **pt-BR discovery** first-class.~~
  **SHIPPED 2026-07-26 as [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md).** Not deferred work.
- ~~**Slice 3 (deferred):** a translated pt-BR `profile` object, so PT mode wraps a pt-BR CV instead of the
  English one.~~ **RESOLVED (2026-07-23):** `profile.ts` is now authored bilingually (`ProfileSource` +
  `resolveProfile`), so PT mode renders a real pt-BR CV. English stays the canonical edition and the facts
  are shared, not mirrored — see the amendment on
  [ADR-0024](./0024-profile-canonical-cv-cross-surface.md). The "PT wraps an English CV" cost recorded
  below is therefore **no longer accepted — it is paid off**.
- ~~**Out of scope:** blog article i18n — long-form pt-BR articles stay pt-BR.~~
  **Amended 2026-07-23 — everything the reader reads is authored in both languages.** The owner's
  rule, stated plainly: *"tudo tem que ser dois idiomas."* Long-form is no longer an exception, so
  there is no category of content where chrome and body can disagree.

  **Shape:** prose gets **one markdown file per locale** (`rampup.pt.md` · `rampup.en.md`), selected by
  a `Record<Locale, string>` so a missing translation is a **compile error**. This deliberately differs
  from the key-first `{ pt, en }` shape used for the message catalog and the CV: a paragraph is not a
  leaf, and interleaving two languages inside one document would make both unreadable to edit. Same
  contract — every locale present or it does not build — different granularity.

  **Cost, accepted:** two files can drift where a key-first object cannot, so the parity that matters
  is asserted mechanically — the editions must expose the same links in the same order and the same
  section count, and each edition must render *without* the other's text present. That catches a stale
  translation and a fallback rendering both; it cannot catch a translation that is merely bad.

  ~~**Still true:** the **prerender baseline stays English** (verified: the `/ramp-up` snapshot contains
  the English body and none of the Portuguese), so OG/SEO discovery is unchanged and the client
  re-resolves after hydration. Per-locale prerender remains Slice 2.~~ **No longer true — see the RETIRED
  note above and the 2026-07-29 amendment.**

  ~~**Debt this creates:** the existing pt-BR article has no English edition, so the rule is not yet
  satisfied repo-wide — tracked separately rather than silently ignored.~~ **DISCHARGED:** both editions
  exist (`src/content/blog/my-commitment.{pt,en}.md`), and the pair is now a **build invariant** —
  `lib/content.ts` throws at module load if either is missing (ADR-0037).

## Consequences
**Good**
- ~~The site presents the CV in **English**, coherent with LinkedIn + Canva~~ — the CV is presented in the
  reader's locale (both editions are authored and prerendered); English remains the **canonical** edition
  ([ADR-0024](./0024-profile-canonical-cv-cross-surface.md)), and the Canva CV was retired 2026-07-28. #234
- **Native-language visitors still get their language live** (auto-detect + persisted manual toggle).
- **No new dependency** — a typed catalog + two hooks; the "simplest thing" floor ([ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)) holds.
- The **static invariant** ([ADR-0002](./0002-fully-static-spa-no-backend.md)) is intact — no server, no
  Accept-Language edge logic.

**Bad / accepted costs**
- ~~A **single-locale prerender** means only the **English** snapshot ships OG/SEO; **pt-BR discovery is
  deferred to Slice 2**.~~ **No longer a cost — retired by [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md).**
- ~~**PT mode wraps an English CV** until Slice 3 translates the `profile` object.~~ **Paid off
  2026-07-23** — Slice 3 shipped; `profile.ts` is authored bilingually, so PT renders a real pt-BR CV. (This
  sat unstruck between two bullets that WERE struck in the #234 sweep, contradicting the Good bullet eleven
  lines above it.)
- ~~A brief **static-shell flash** for a non-baseline (pt-BR) browser until the bundle renders and re-detects —
  mitigated by detect-before-first-render, and **fully removed only by Slice 2's per-locale prerender**.~~
  **Gone** — Slice 2 shipped ([ADR-0036](./0036-per-locale-urls-prerender-hreflang.md)).

## Amendment (2026-07-29) — this ADR's English-pinned half is fully retired; read 0036 first
[ADR-0036](./0036-per-locale-urls-prerender-hreflang.md) shipped what this ADR called **Slice 2**, and in
doing so retired its **English-pinned prerender** clause and every consequence hanging off it. Those
statements are struck through above rather than deleted (supersede, never rewrite) — but they had been
sitting unmarked, and this file is the one someone reads to learn how the locale layer works. Read
end-to-end, it said pt-BR was invisible to crawlers and that per-locale prerender was open work. Both
false since 2026-07-26 (#234).

**What is actually current:** every route is snapshotted in **both** locales, each with its own head,
canonical and OG (`localizedRoutes()` in `scripts/routes.mjs`); only the bare `/` snapshot is English, as
the x-default entry for the JS-less crawler. hreflang advertises the reciprocal pair.

**What this ADR still owns, unchanged:** the light in-repo locale layer itself — the typed pt/en catalog,
`LocaleProvider`, `useT()`/`useLocale()`, native auto-detect, the persisted toggle, and the rule that
`LocaleProvider` is a LANGUAGE context and not the forbidden visual `ThemeProvider`. English also remains
the **canonical edition** (ADR-0024) — a statement about which edition is authoritative, never about which
one a visitor is served.

## Amendment (2026-09-20) — the detection signal WIDENS from one entry to the whole declared list (#661)

**Nothing here is reversed. The signal's BREADTH changed and nothing else did**, which is why this is an
amendment rather than a new record: a new record would owe a `What this replaced` fold with nothing to
put in it.

**What was written above, and what it actually did.** The Decision outcome says *"the visitor's native
browser language"* and named `navigator.language` as how that is read. Those are not the same thing, and
the gap is the whole defect: **the browser declares an ORDERED LIST (`navigator.languages`) and
`navigator.language` is only its first entry.** A reader whose browser declares
`["en-US", "en", "pt"]` — Portuguese asked for, third — was served English. The intent above was always
*the visitor's native language*; the mechanism under it answered *the visitor's first-listed language*.

**Why the affected reader is not a fringe.** That is the ordinary machine of a Brazilian engineer whose
OS, IDE and browser are configured in English, which is this site's modal reader. **And the defect was
invisible to the one person who inspects this site closely**: the owner's own `localStorage` holds a
`pt` override, so step 2 answers before step 3 is ever consulted and every test he runs on the root
passes.

**The rule now, stated so a later reader does not re-derive the asymmetry as an oversight.** The walk is
over `navigator.languages` in DECLARED ORDER, comparing on the PRIMARY SUBTAG (`pt-BR`, `pt-PT`, `pt` all
read as Portuguese). **English is the BASELINE, not a match** — the site has two editions and English is
what every other language on earth falls back to, so an `en*` entry cannot end the walk. In one sentence:
**Portuguese declared anywhere in the list wins; everything else is English.** With two editions and one
of them the fallback, declared order is not observable in the outcome; the walk is written in order
anyway so a third edition would behave correctly rather than accidentally.

**Absence is handled rather than assumed.** Some privacy configurations expose an empty `languages` and
some environments do not expose it at all, so `navigator.language` is the fallback and an empty list
reaches the baseline — never `languages[0]` on an empty array, which would be a regression for exactly
those readers rather than a fix.

**Two call sites moved together, and the duplication was removed rather than synchronised.**
`detectLocale` decides what is SERVED and `browserLocale` decided whether to OFFER the other edition, and
each carried its own copy of the rule. Fix one alone and the site contradicts itself out loud — serving
Portuguese while offering English on top of it, or firing the offer on every page for a reader the
detection never served. There is now **one implementation**, in `src/i18n/config.ts`, used by both; the
copy in `src/lib/localeSuggestion.ts` is gone and divergence is no longer expressible.

**The precedence ladder is UNTOUCHED, and that is scope rather than luck.** The path still beats
everything ([ADR-0036](./0036-per-locale-urls-prerender-hreflang.md), and
[ADR-0052](./0052-neutral-self-canonical-share-url-per-article.md) made that path the one every shared link now takes), and a
persisted override still beats every inference. Three things rest on the path rule — the prerender, the
self-canonical + `hreflang` reciprocity and the sharer's contract — so overriding it would make
`canonical`, `og:locale` and `<html lang>` lie about served content. Only step 3 widened, and both
clauses are now asserted rather than assumed, in jsdom and in a real browser.

**One mechanical reason this survived a green suite, recorded because it outlives this fix.** Every
locale assertion in `e2e/i18n.spec.ts` drove `test.use({ locale: '<one string>' })`, which takes a single
string — so the harness could express *this reader speaks Portuguese* and *this reader speaks English*
and nothing else. **The affected configuration was unrepresentable in it.** That is a gap in the harness,
not an oversight in any one test. The seam that can express it is `page.addInitScript`, already used in
`scripts/prerender.mjs` and `e2e/per-locale.spec.ts`.

**Explicitly NOT in scope, and not stubbed:** the IP-geolocation step (`#669`). It touches `iac/`, it is
a decision against [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md), and it gets its own record.

## Links
- **Supersedes** [ADR-0011](./0011-ui-ptbr-i18n-deferred.md) (UI in pt-BR; i18n deferred) — this is the i18n
  phase ADR-0011 named.
- **Driven by / consistent with** [ADR-0024](./0024-profile-canonical-cv-cross-surface.md): the English CV
  stays canonical — no contradiction; only chrome localizes.
- **Interacts with** [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md) (build-time render) and
  [ADR-0005](./0005-og-coverage-every-public-url.md) (OG coverage on every public URL) — ~~the deferred Slice 2
  makes~~ **Slice 2 shipped as [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md) and made** per-locale
  prerender + `hreflang` first-class. #234
- Also **supersedes the earlier i18n sketch** in `docs/redesign/redesign-plan.md` (pt default + a
  CloudFront-Function Accept-Language approach) — ~~that plan section is now stale and will be updated
  separately.~~ **Still stale, and deliberately not updated:** `docs/redesign/` is the *pre-build* design
  record, superseded by the ADRs rather than maintained alongside them. Read it as history. #234
