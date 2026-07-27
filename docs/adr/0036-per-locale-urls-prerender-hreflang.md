# 0036. Language is addressable — symmetric per-locale URL prefixes, per-locale prerender, hreflang + OG-per-locale

- **Status:** accepted
- **Date:** 2026-07-26
- **Deciders:** the owner
- **Supersedes / superseded by:** — (completes and retires interim clauses of [ADR-0032](./0032-i18n-locale-layer-english-baseline.md); resolves [ADR-0010](./0010-routing-landing-cv-split-redirects.md)'s deferred "localized URL prefixes" question)
- **Driven by:** Issue [#162](https://github.com/tedeuxx/tadeumendonca-io/issues/162), and consistent-with [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md), [ADR-0005](./0005-og-coverage-every-public-url.md), [ADR-0024](./0024-profile-canonical-cv-cross-surface.md), [ADR-0032](./0032-i18n-locale-layer-english-baseline.md), [ADR-0034](./0034-build-time-cv-pdf-static-artifact.md)

## Context & problem
[ADR-0032](./0032-i18n-locale-layer-english-baseline.md) internationalized the site with a light in-repo
locale layer — native auto-detect + a persisted PT/EN toggle — but pinned the **prerender / crawlable + OG
baseline to English**, and explicitly named the rest as its deferred **Slice 2**: *"route-prefixed `/en` ·
`/pt` + per-locale prerender + `hreflang` / per-locale canonical + per-locale OG… the slice that makes pt-BR
discovery first-class."* Under that interim, language is a **client-side runtime state**, not an address:
there is exactly one URL per surface, only its English snapshot ships to crawlers/unfurlers, and a pt-BR
visitor sharing any page produces an **English** unfurl. pt-BR is therefore live-only and **invisible to
search and social** — the presence is half-served in the language half the audience reads.

Separately, [ADR-0010](./0010-routing-landing-cv-split-redirects.md)'s 2026-07-25 `/architecture` amendment
reaffirmed the *body*-level "everything the reader reads is in both languages" policy, but drew a hard line
around **URLs**: it recorded that a dual-slug scheme "would be a **new routing pattern** — a bigger decision
than adding a surface" and left **"localized URL prefixes… a separate, unmade decision."** That unmade
decision is what blocks Slice 2. This ADR makes it.

**This is completing ADR-0032's Slice 2 — not reversing a decision.** The English-pinned prerender was always
recorded as an *interim* baseline with a named successor slice; shipping that slice is the plan executing as
written, not a change of mind.

## Decision drivers
- **First-class pt-BR discovery** (the Slice-2 driver): the pt-BR edition must be a real, crawlable,
  unfurlable **address**, not a runtime toggle a bot never sees.
- **Static invariant, no edge** ([ADR-0002](./0002-fully-static-spa-no-backend.md),
  [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md)): whatever resolves a locale must do so at
  **build time** or **client-side** — never a request-time / Accept-Language edge function. ADR-0004's
  no-SSR/edge invariant is load-bearing and must survive untouched.
- **OG/SEO completeness per surface** ([ADR-0005](./0005-og-coverage-every-public-url.md)): every public URL
  is OG/crawler-complete — and once each surface exists in two locales, that contract now spans **both**,
  plus an x-default.
- **English stays canonical** ([ADR-0024](./0024-profile-canonical-cv-cross-surface.md),
  [ADR-0032](./0032-i18n-locale-layer-english-baseline.md)): canonicality is a statement about which edition
  is *authoritative* (LinkedIn, the Canva CV, the exported `profile` constant), independent of which edition
  a given visitor is served. x-default resolves to English.
- **`iac/` is untouched, deliberately** ([ADR-0013](./0013-s3-cloudfront-hosting.md)): the CloudFront Function
  is locale-agnostic (clean-URL rewrite only); a URL scheme that needs no edge locale logic keeps the infra
  boundary closed and this slice code-only.
- **Lean by design** ([ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)): two locales on a static
  SPA get an addressing scheme, not an i18n-routing framework.

## Considered options
1. **Symmetric per-locale prefixes `/pt/…` and `/en/…` for every public route** (chosen) — every surface
   exists at **both** `/pt/<slug>` and `/en/<slug>` on the **same English slug**; the per-locale prerender
   snapshots each route in both locales to `dist/pt/**` + `dist/en/**`, plus a **bare-root x-default English**
   snapshot; each page carries `hreflang` alternates (`pt`, `en`, `x-default`) + a **per-locale self-canonical**
   and per-locale OG (`og:locale` + localized title/description). Bare `/` and any unprefixed path
   **client-side auto-detect and redirect** to the matching locale prefix, preserving the sub-path.
   *Trade-off:* the prerendered route count and OG-image count **double** (each route × 2 locales, + the
   x-default root) — a build-time cost [ADR-0005](./0005-og-coverage-every-public-url.md) already anticipates
   as "build time grows with the route count"; and both prefixes are now a **permanent public URL contract**.
2. **Default-unprefixed English + a single `/pt` tier** (English lives at the bare path, only Portuguese is
   prefixed) — *Why not:* asymmetry makes English the "real" URL and pt-BR a second-class annex, which is
   exactly the discovery imbalance this slice exists to close; it also muddies `hreflang`/canonical
   (the bare path doubles as both the en alternate *and* x-default, so the en edition has no clean
   self-canonical distinct from x-default). Symmetry keeps every locale a first-class address and keeps the
   alternate/canonical graph unambiguous.
3. **Locale subdomains (`en.` / `pt.`)** — *Why not:* subdomains are separate hosts — new DNS records, a
   CloudFront alternate-domain + certificate SAN, and cross-origin split of analytics/canonical — i.e. it
   would **reopen `iac/`** and add operational surface, for no discovery gain over path prefixes. Path
   prefixes keep the whole change **code-only** (the CloudFront Function stays locale-agnostic) and keep one
   origin/one cert/one analytics property.
4. **Edge Accept-Language negotiation** (a CloudFront Function reading `Accept-Language` to route/redirect) —
   *Why not:* it reintroduces **request-time locale compute at the edge**, the precise thing
   [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md) removed, and puts locale logic in `iac/`. The
   **client-side bare-root redirect below makes it unnecessary** — see Decision outcome.

## Decision outcome
Chosen: **option 1 — symmetric per-locale URL prefixes, per-locale prerender, hreflang + OG-per-locale.**

- **URL scheme — locale prefix on the SAME English slug.** Every public route is addressable at `/pt/<slug>`
  **and** `/en/<slug>`, e.g. `/pt/me` · `/en/me`, `/pt/portfolio` · `/en/portfolio`, `/pt/architecture` ·
  `/en/architecture`. This is a **prefix on one canonical slug**, **not** a dual localized-slug pair
  (`/pt/perfil ↔ /en/me`). Dual localized slugs are the bigger routing decision
  [ADR-0010](./0010-routing-landing-cv-split-redirects.md) deferred on 2026-07-25; **this slice does not adopt
  it** — one slug per route, prefixed by locale.
- **Per-locale prerender.** `scripts/prerender.mjs` snapshots each enumerated route (`scripts/routes.mjs`)
  **twice** — once forcing `pt`, once forcing `en` — into `dist/pt/**` and `dist/en/**`, and additionally
  emits a **bare-root x-default snapshot in English**. Each snapshot carries complete, locale-correct meta in
  the served HTML — satisfying [ADR-0005](./0005-og-coverage-every-public-url.md) for **both** editions plus
  x-default. This **retires ADR-0032's "prerender baseline pinned to English" clause** and its "single-locale
  prerender" accepted cost: both editions now ship to crawlers/unfurlers.
- **hreflang + per-locale self-canonical.** Each page declares `<link rel="alternate" hreflang="pt">`,
  `hreflang="en"`, and `hreflang="x-default"` (→ the English root), and a **self-referential canonical** to
  its own locale URL. x-default = English, consistent with
  [ADR-0024](./0024-profile-canonical-cv-cross-surface.md)/[ADR-0032](./0032-i18n-locale-layer-english-baseline.md).
- **OG-per-locale (text/meta now).** Each snapshot sets `og:locale` (`pt_BR` / `en_US`) and a **per-locale
  `og:title` / `og:description`**, so a pt-BR share unfurls in pt-BR and an en share in English — the exact
  gap ADR-0032 left open. **Localized OG *image art* is deferred** (see scope boundaries); the OG text/meta
  ships now.
- **Bare `/` (and any unprefixed path) auto-detect and redirect client-side.** React resolves the locale
  (`navigator.language` → `pt`/`en`, honoring the persisted toggle, fallback `en` per ADR-0032) and
  `<Navigate replace>`s to the matching locale prefix, **preserving the sub-path** (`/portfolio` →
  `/en/portfolio` or `/pt/portfolio`). **This client-side redirect is the deliberate reason no edge
  Accept-Language logic is needed** — the one place a reader might assume an edge negotiation, made explicit:
  detection is React's, at first paint, so `iac/` and ADR-0004's no-edge invariant both stay closed. The
  bare-root English snapshot exists so a crawler/unfurler hitting `/` before JS runs still sees a complete
  x-default page.
- **`iac/` is untouched.** The CloudFront Function remains the locale-agnostic clean-URL rewrite; the prefixes
  are just more static object paths in the bucket. No DNS, no cert, no edge change.

**CV-PDF source route note (for [ADR-0034](./0034-build-time-cv-pdf-static-artifact.md)):** the build-time CV
PDF is printed from the CV route, whose string moves `/me` → **`/en/me`** under this scheme (English is the
canonical print edition per ADR-0034/ADR-0024). The `/cv.pdf` output path and the "printed from the English
edition" decision are unchanged — only the source route string shifts to carry the `/en` prefix. Recorded here
so the PDF-source path is not left stale; a matching one-line note is added to ADR-0034.

## Consequences
**Good**
- **pt-BR is now a first-class address** — crawlable, unfurlable, self-canonical, with its own OG — closing
  the discovery half [ADR-0032](./0032-i18n-locale-layer-english-baseline.md) deferred. A shared pt-BR URL
  unfurls in pt-BR.
- **The OG/SEO-completeness contract ([ADR-0005](./0005-og-coverage-every-public-url.md)) now holds across
  both locales + x-default**, with correct `hreflang` telling search engines the editions are the same page
  in two languages (no duplicate-content penalty; the right edition surfaces per searcher).
- **The static, no-edge story is intact** ([ADR-0004](./0004-build-time-render-not-ssr-or-edge.md)) — locale
  is resolved at **build** (the two snapshots) and **client-side** (the bare-root redirect), never at the
  edge. `iac/` did not move.
- **The static-shell flash for pt-BR visitors is removed** — ADR-0032's residual "non-baseline flash until
  the bundle re-detects" is gone: a pt visitor lands on the prerendered `/pt/**` HTML directly.
- **English stays canonical** with a clean x-default; no contradiction with
  [ADR-0024](./0024-profile-canonical-cv-cross-surface.md).

**Bad / accepted costs**
- **The prerendered route count and OG-image count double** (each route × 2 locales) plus the x-default root —
  build time and the prerender/sitemap enumeration grow accordingly. Anticipated by
  [ADR-0005](./0005-og-coverage-every-public-url.md)'s "build cost scales with route count"; the prerender
  smoke + the E2E canonical-route drift guard (`seo.spec.ts`) must now assert **both** locale trees, or a
  missing edition ships blank.
- **Both prefixes are a permanent public URL contract.** `/pt/…` and `/en/…` are now URLs in the world;
  changing the scheme later means back-compat redirects (per
  [ADR-0010](./0010-routing-landing-cv-split-redirects.md)'s contract — currently relaxed only for the
  pre-launch window).
- **The sitemap grows** to enumerate both locale trees with `xhtml:link` alternates; generated from the same
  `scripts/routes.mjs` × locales, so it cannot drift from the prerender, but it is larger.
- **The bare-root redirect is a client-side hop** for human visitors landing on `/` — one `<Navigate replace>`
  before they reach their locale. Crawlers get the x-default snapshot directly, so SEO does not pay this hop.

**Scope boundaries (deliberate)**
- **Localized OG *image art* is deferred.** `og:locale` + per-locale **title/description text** ship now;
  a **per-locale rendered OG image** (localized card art) is a clean follow-on on the same
  `gen-og`/prerender pipeline, deliberately deferred — not designed out. The English OG image serves both
  locales in the interim.
- **NOT dual localized slugs.** This adopts locale **prefixes on one English slug** only. The
  `/pt/perfil ↔ /en/me` localized-slug scheme remains the separate, bigger routing decision
  [ADR-0010](./0010-routing-landing-cv-split-redirects.md) flagged; it is **not** decided here.
  > **Update (2026-07-26):** this clause is **revised for the blog surface only** by
  > [ADR-0037](./0037-localized-article-slugs.md): article routes (`/blog/:slug`) now carry a
  > **per-locale slug** (`/en/blog/my-commitment` ⇄ `/pt/blog/meu-compromisso`). Everything else in this
  > ADR stands — the symmetric per-locale prefixes, per-locale prerender, hreflang and OG-per-locale all
  > remain, and **non-article routes keep the one-slug-prefixed-twice scheme** decided here.
- **No edge / Accept-Language logic** — the client-side redirect covers the negotiation; `iac/` stays closed.
- **A localized `cv.pt.pdf`** remains the deferred follow-on [ADR-0034](./0034-build-time-cv-pdf-static-artifact.md)
  already books — this ADR only shifts the *source route string* to `/en/me`, it does not add the pt edition.

## Links
- **Implements** Issue [#162](https://github.com/tedeuxx/tadeumendonca-io/issues/162).
- **Completes [ADR-0032](./0032-i18n-locale-layer-english-baseline.md)'s deferred Slice 2** — retires that
  ADR's "prerender baseline pinned to English" clause and its "single-locale-prerender accepted cost." Not a
  reversal: Slice 2 was always the named successor to the interim English-pinned baseline.
- **Resolves the deferred question in [ADR-0010](./0010-routing-landing-cv-split-redirects.md)** — its
  2026-07-25 amendment left "localized URL prefixes… a separate, unmade decision"; that decision is made here
  (prefixes yes, dual-slugs still deferred). ADR-0010 is amended with a forward-link to this ADR.
- **Consistent with [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md)** — per-locale prerender is more
  build-time render, still no SSR/edge; the client-side bare-root redirect is why no Accept-Language edge
  logic is needed.
- **Extends [ADR-0005](./0005-og-coverage-every-public-url.md)** — OG/SEO completeness now spans both locales
  + x-default; the route-count doubling is the accepted build cost ADR-0005 anticipates.
- **Consistent with [ADR-0024](./0024-profile-canonical-cv-cross-surface.md)** — English stays the canonical
  edition; x-default = English; the CV PDF still prints from the English edition (route string `/en/me`).
- **Touches [ADR-0034](./0034-build-time-cv-pdf-static-artifact.md)** — the CV-PDF source route string moves
  `/me` → `/en/me`; a matching one-line note is added to ADR-0034.
- **`iac/` untouched** ([ADR-0013](./0013-s3-cloudfront-hosting.md)) — the CloudFront Function is
  locale-agnostic; the prefixes are static object paths.
