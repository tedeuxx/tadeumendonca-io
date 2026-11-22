# 0036. Language is addressable — symmetric per-locale URL prefixes, per-locale prerender, hreflang + OG-per-locale

- **Status:** accepted · **amended 2026-11-22** (absorbs the rest of the `locale-and-routing` capability,
  formerly records 0010, 0032, 0037 and 0052, as the sections *Client-side routing and the public
  surfaces*, *The locale layer*, *Localized article slugs* and *A neutral, self-canonical share URL per
  article*, and folds the reversed record 0011 into *The locale layer* as *What this replaced: the
  pt-BR-only UI*; every decision is unchanged, #456)
- **Capability:** `locale-and-routing`
- **Date:** 2026-07-26
- **Deciders:** the owner
- **Supersedes / superseded by:** — (completes the deferred Slice 2 of *The locale layer* below and retires
  its interim clauses; makes the "localized URL prefixes" decision that *Client-side routing and the public
  surfaces* below had left unmade)
- **Driven by:** Issue [#162](https://github.com/tedeuxx/tadeumendonca-io/issues/162), and consistent-with [ADR-0002](./0002-fully-static-spa-no-backend.md#content-and-og-resolved-at-build-time), [ADR-0005](./0005-og-coverage-every-public-url.md), [ADR-0024](./0024-profile-canonical-cv-cross-surface.md) (and the downloadable-CV decision, record 0034 until #456 absorbed it into ADR-0024)

**This document is the whole `locale-and-routing` capability.** The first half is the addressing decision
itself: a URL is an edition, every route exists under a `/pt` and an `/en` prefix, both are prerendered,
and the head says so. Its amendments and its section on the edge locale hint follow. The four sections
after them are the decisions the addressing rests on or refines: how the SPA routes and which public
surfaces exist, the locale layer that resolves and renders a language, the per-locale slug an article
carries, and the neutral share address every social post links. Each of those was a record of its own
until #456 folded it here; each says where it came from. Inside this document, *the anchor* means the
first half and its amendments.

## Context & problem
The locale layer ([*The locale layer*](#the-locale-layer) below) internationalized the site with a light in-repo
locale layer — native auto-detect + a persisted PT/EN toggle — but pinned the **prerender / crawlable + OG
baseline to English**, and explicitly named the rest as its deferred **Slice 2**: *"route-prefixed `/en` ·
`/pt` + per-locale prerender + `hreflang` / per-locale canonical + per-locale OG… the slice that makes pt-BR
discovery first-class."* Under that interim, language is a **client-side runtime state**, not an address:
there is exactly one URL per surface, only its English snapshot ships to crawlers/unfurlers, and a pt-BR
visitor sharing any page produces an **English** unfurl. pt-BR is therefore live-only and **invisible to
search and social** — the presence is half-served in the language half the audience reads.

Separately, the routing decision's 2026-07-25 `/architecture` amendment ([*Client-side routing and the public surfaces*](#client-side-routing-and-the-public-surfaces) below)
reaffirmed the *body*-level "everything the reader reads is in both languages" policy, but drew a hard line
around **URLs**: it recorded that a dual-slug scheme "would be a **new routing pattern** — a bigger decision
than adding a surface" and left **"localized URL prefixes… a separate, unmade decision."** That unmade
decision is what blocks Slice 2. This ADR makes it.

**This is completing the locale layer's Slice 2 — not reversing a decision.** The English-pinned prerender was always
recorded as an *interim* baseline with a named successor slice; shipping that slice is the plan executing as
written, not a change of mind.

## Decision drivers
- **First-class pt-BR discovery** (the Slice-2 driver): the pt-BR edition must be a real, crawlable,
  unfurlable **address**, not a runtime toggle a bot never sees.
- **Static invariant, no edge** ([ADR-0002](./0002-fully-static-spa-no-backend.md),
  its section [*Content and OG resolved at build time*](./0002-fully-static-spa-no-backend.md#content-and-og-resolved-at-build-time)): whatever resolves a locale must do so at
  **build time** or **client-side** — never a request-time / Accept-Language edge function. ADR-0002's
  no-SSR/edge invariant is load-bearing and must survive untouched.
  > **Narrowed 2026-11-01** (#669, ~~`proposed` until the owner ratifies PR #803~~ **`accepted`
  > 2026-11-01**: the owner merged PR #803 himself, [recorded on #669](https://github.com/tedeuxx/tadeumendonca-io/issues/669#issuecomment-6566368759)): the edge may now
  > **expose a fact** (a viewer-response `locale_hint` cookie); it still never **resolves** a locale,
  > routes or redirects. See *The edge exposes a locale hint, never a locale decision (2026-11-01)* below.
- **OG/SEO completeness per surface** ([ADR-0005](./0005-og-coverage-every-public-url.md)): every public URL
  is OG/crawler-complete — and once each surface exists in two locales, that contract now spans **both**,
  plus an x-default.
- **English stays canonical** ([ADR-0024](./0024-profile-canonical-cv-cross-surface.md),
  [*The locale layer*](#the-locale-layer) below): canonicality is a statement about which edition
  is *authoritative* (LinkedIn, `/cv.pdf`, the exported `profile` constant), independent of which edition
  a given visitor is served. x-default resolves to English. *(This named the Canva CV until #234 — it was
  retired 2026-07-28, ADR-0024's amendment.)*
- **`iac/` is untouched, deliberately** ([ADR-0013](./0013-s3-cloudfront-hosting.md)): the CloudFront Function
  is locale-agnostic (clean-URL rewrite only); a URL scheme that needs no edge locale logic keeps the infra
  boundary closed and this slice code-only.
- **Lean by design** ([ADR-0053](./0053-this-library-records-presence-and-site-architecture-one-document-per-capability.md#lean-by-design--the-keystone-every-record-is-read-through)): two locales on a static
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
   [ADR-0002](./0002-fully-static-spa-no-backend.md#content-and-og-resolved-at-build-time) removed, and puts locale logic in `iac/`. The
   **client-side bare-root redirect below makes it unnecessary** — see Decision outcome.

## Decision outcome
Chosen: **option 1 — symmetric per-locale URL prefixes, per-locale prerender, hreflang + OG-per-locale.**

- **URL scheme — locale prefix on the SAME English slug.** Every public route is addressable at `/pt/<slug>`
  **and** `/en/<slug>`, e.g. `/pt/me` · `/en/me`, `/pt/portfolio` · `/en/portfolio`, `/pt/architecture` ·
  `/en/architecture`. This is a **prefix on one canonical slug**, **not** a dual localized-slug pair
  (`/pt/perfil ↔ /en/me`). Dual localized slugs are the bigger routing decision
  the routing decision ([*Client-side routing and the public surfaces*](#client-side-routing-and-the-public-surfaces) below) deferred on 2026-07-25; **this slice does not adopt
  it** — one slug per route, prefixed by locale.
- **Per-locale prerender.** `scripts/prerender.mjs` snapshots each enumerated route (`scripts/routes.mjs`)
  **twice** — once forcing `pt`, once forcing `en` — into `dist/pt/**` and `dist/en/**`, and additionally
  emits a **bare-root x-default snapshot in English**. Each snapshot carries complete, locale-correct meta in
  the served HTML — satisfying [ADR-0005](./0005-og-coverage-every-public-url.md) for **both** editions plus
  x-default. This **retires the locale layer's "prerender baseline pinned to English" clause** and its "single-locale
  prerender" accepted cost: both editions now ship to crawlers/unfurlers.
- **hreflang + per-locale self-canonical.** Each page declares `<link rel="alternate" hreflang="pt">`,
  `hreflang="en"`, and `hreflang="x-default"` (→ the English root), and a **self-referential canonical** to
  its own locale URL. x-default = English, consistent with
  [ADR-0024](./0024-profile-canonical-cv-cross-surface.md) and [*The locale layer*](#the-locale-layer).
- **OG-per-locale (text/meta now).** Each snapshot sets `og:locale` (`pt_BR` / `en_US`) and a **per-locale
  `og:title` / `og:description`**, so a pt-BR share unfurls in pt-BR and an en share in English — the exact
  gap the locale layer's first slice left open. **Localized OG *image art* is deferred** (see scope boundaries); the OG text/meta
  ships now.
- **Bare `/` (and any unprefixed path) auto-detect and redirect client-side.** React resolves the locale
  (`navigator.language` → `pt`/`en`, honoring the persisted toggle, fallback `en` per the locale layer; since #661
  the full `navigator.languages` list, and since #788 an edge hint above it — see *The edge exposes a
  locale hint, never a locale decision* below) and
  `<Navigate replace>`s to the matching locale prefix, **preserving the sub-path** (`/portfolio` →
  `/en/portfolio` or `/pt/portfolio`). **This client-side redirect is the deliberate reason no edge
  Accept-Language logic is needed** — the one place a reader might assume an edge negotiation, made explicit:
  detection is React's, at first paint, so `iac/` and ADR-0002's no-edge invariant both stay closed. The
  bare-root English snapshot exists so a crawler/unfurler hitting `/` before JS runs still sees a complete
  x-default page.
- **`iac/` is untouched.** The CloudFront Function remains the locale-agnostic clean-URL rewrite; the prefixes
  are just more static object paths in the bucket. No DNS, no cert, no edge change.

**CV-PDF source route note (for the downloadable-CV decision, now [ADR-0024](./0024-profile-canonical-cv-cross-surface.md)'s *The downloadable edition*; it was record 0034 until #456):** the build-time CV
PDF is printed from the CV route, whose string moves `/me` → **`/en/me`** under this scheme (English is the
canonical print edition per ADR-0024). The `/cv.pdf` output path and the "printed from the English
edition" decision are unchanged — only the source route string shifts to carry the `/en` prefix. Recorded here
so the PDF-source path is not left stale; a matching one-line note was added to the downloadable-CV record (since absorbed into ADR-0024).

## Consequences
**Good**
- **pt-BR is now a first-class address** — crawlable, unfurlable, self-canonical, with its own OG — closing
  the discovery half the locale layer deferred. A shared pt-BR URL
  unfurls in pt-BR.
- **The OG/SEO-completeness contract ([ADR-0005](./0005-og-coverage-every-public-url.md)) now holds across
  both locales + x-default**, with correct `hreflang` telling search engines the editions are the same page
  in two languages (no duplicate-content penalty; the right edition surfaces per searcher).
- **The static, no-edge story is intact** ([ADR-0002](./0002-fully-static-spa-no-backend.md#content-and-og-resolved-at-build-time)) — locale
  is resolved at **build** (the two snapshots) and **client-side** (the bare-root redirect), never at the
  edge. `iac/` did not move.
- **The static-shell flash for pt-BR visitors is removed** — the locale layer's residual "non-baseline flash until
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
  changing the scheme later means back-compat redirects (per the back-compat contract in
  [*Client-side routing and the public surfaces*](#client-side-routing-and-the-public-surfaces); it was relaxed only for the pre-launch window, which has closed).
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
  the routing decision flagged; it is **not** decided here.
  > **Update (2026-07-26):** this clause is **revised for the blog surface only** by
  > [*Localized article slugs*](#localized-article-slugs) below: article routes (`/blog/:slug`) now carry a
  > **per-locale slug** (`/en/blog/my-commitment` ⇄ `/pt/blog/meu-compromisso`). Everything else in this
  > ADR stands — the symmetric per-locale prefixes, per-locale prerender, hreflang and OG-per-locale all
  > remain, and **non-article routes keep the one-slug-prefixed-twice scheme** decided here.
- **No edge / Accept-Language logic** — the client-side redirect covers the negotiation; `iac/` stays closed.
  > **Narrowed 2026-11-01** (#669, ~~`proposed`~~ **`accepted`**, [the owner's merge of PR #803](https://github.com/tedeuxx/tadeumendonca-io/issues/669#issuecomment-6566368759)): still no edge negotiation, but `iac/` now carries a
  > function that exposes a locale hint to the client. See *The edge exposes a locale hint, never a locale
  > decision (2026-11-01)* below.
- **A localized `cv.pt.pdf`** remains the deferred follow-on [ADR-0024](./0024-profile-canonical-cv-cross-surface.md) (its downloadable-edition section)
  already books — this ADR only shifts the *source route string* to `/en/me`, it does not add the pt edition.

## Amendment (2026-07-27) — x-default is the **prefixed English canonical** everywhere but the root; a URL may be advertised only if the build prerenders it
**The invariant, stated generally because it is the durable part of this amendment:**

> **A URL may be advertised — in `hreflang`, in the sitemap — only if the build prerenders it.**

The route module already guaranteed that for the `pt` and `en` alternates: they are generated from the same
`localizedRoutes()` enumeration the prerender consumes, so they cannot drift. **x-default was the one place
the invariant did not hold**, and it broke.

**What changed.** `hreflang="x-default"` points at the **prefixed English canonical** for the four static
routes — `/en/me`, `/en/portfolio`, `/en/ramp-up`, `/en/architecture` — instead of the bare, unprefixed path.
**The root keeps its bare x-default** (`https://tadeumendonca.io/`), because the bare origin is the one
unprefixed URL the prerender genuinely snapshots (`dist/index.html`, the bare-root English snapshot this
document already decided). **An ARTICLE's x-default is the neutral, unprefixed `/blog/<en-slug>`**: that
was the prefixed `/en/blog/<en-slug>` from this amendment until 2026-09-20, when
[*A neutral, self-canonical share URL per article*](#a-neutral-self-canonical-share-url-per-article) below made the bare article URL a snapshotted, self-canonical document. That is not the invariant
being traded away, it is the invariant being *satisfied*: the address may be advertised **because** the
build prerenders it. Implemented in **both** places, which are duplicated by construction:
`apps/fed/scripts/routes.mjs` (feeds sitemap + prerender) and `apps/fed/src/hooks/useDocumentHead.ts`
(runtime `<link>` tags).

**Why the decision above left room for the bug.** This document fixed the **semantics** of x-default
(*x-default = English*) and, for the root, its target (*→ the English root*). It never stated the **form**
x-default takes for a non-root route. The implementation chose the bare path, and that looked entirely
reasonable given the client-side redirect clause: an unprefixed path auto-detects and redirects, so a
*human* landing on `/me` does arrive in their locale. The gap is that a **scraper does not run the
redirect** — and only `localizedRoutes()` targets plus the bare root were prerendered, while
`iac/frontend.tf` maps 403/404 to `/index.html` with response code **200**. Measured with JS disabled
against a real `build:static` + preview: **five of the six advertised x-default URLs answered 200 carrying
the HOME page's meta** (`og:title` = `tadeumendonca.io`, canonical = `https://tadeumendonca.io/en`). Only
`/` was correct — because it genuinely is the home page. Per [ADR-0005](./0005-og-coverage-every-public-url.md)
a scraper **pins** that card permanently. A soft-404 that answers 200 is worse than a 404: nothing fails, it
just publishes the wrong page under five addresses.
[ADR-0005, *Distribution to LinkedIn and X*](./0005-og-coverage-every-public-url.md#distribution-to-linkedin-and-x)'s 2026-07-27 amendment had already named this
hazard for the article case, and made the draft generator refuse any URL absent from the prerendered list;
this amendment fixes the source rather than the one consumer that guarded against it.

**Option considered and rejected for the four static routes: prerender the bare URLs instead.** Emitting a
bare snapshot for every route would satisfy the invariant literally and keep the "clean" locale-neutral URL
advertised. *Why not, as it was argued on 2026-07-27:* it fixed the scraper and **left the Portuguese reader
in a dead end.** The bare-path redirect preserved the sub-path, and article slugs are **per-locale**
([*Localized article slugs*](#localized-article-slugs) below) — so a pt-BR reader following a bare `/blog/my-commitment` was redirected to
`/pt/blog/my-commitment`, a route that does not exist, and fell through to the blog listing. Measured:
headings `["Blog"]` for pt-BR versus `["Blog", "My Commitment", …]` for en-US.

**That reason was discharged for articles, and only for articles.** Issue #204 made the unprefixed redirect
slug-aware (`articlePathForLocale`), so a bare article path resolves in **both** editions, and on 2026-09-20
[*A neutral, self-canonical share URL per article*](#a-neutral-self-canonical-share-url-per-article) took the option for the article class only — one neutral URL per ARTICLE, keyed on the current English
slug. **The four static routes still sit under the rejection**: they have no share convention pointing at
them, no per-locale slug problem, and a working prefixed x-default. Their bare paths resolve for a human,
are not prerendered, and must never be advertised in `hreflang` or the sitemap.

**Trade-off (accepted), paid by the four static routes.** Their x-default names the English edition
explicitly and advertises no locale-neutral entry point. That is standard hreflang practice and what
[ADR-0024](./0024-profile-canonical-cv-cross-surface.md)'s English-canonical decision implies. An article
does advertise a locale-neutral entry point, and it is the address every social post carries; the neutral
article snapshot is served in English, so the English-canonical implication holds there too.

**What this costs a reader, stated rather than glossed.** The redirect clause is untouched, so a bare path
a reader *types or is sent* still auto-detects. But for `/me`, `/portfolio`, `/ramp-up` and `/architecture`
the **advertised** address is the prefixed English one, and a pt-BR reader following `/en/me` gets English
and stays there, because an explicit locale prefix wins in `detectLocale`. That is a **downgrade for the
pt-BR reader on those four routes**, traded for OG cards that are correct. The trade is defensible — a search
engine serves the `pt` alternate to a pt reader rather than x-default, and the front door (bare root) still
auto-detects — but it is a real change in what a reader gets, and the owner ratified it as such.

**Clarification to [*Localized article slugs*](#localized-article-slugs).** Its *"x-default = the English slug"* means the **unprefixed** English slug,
`/blog/<en-slug>`, since 2026-09-20 (it meant the prefixed `/en/blog/<en-slug>` between 2026-07-27 and
then). Nothing about per-locale article slugs changes — the neutral address is keyed on the current
English slug, which is the same string that section governs.

**How the invariant is now enforced, not just written down.**
- `apps/fed/scripts/routes.test.mjs` (new) asserts it by **membership**: every advertised alternate — `pt`,
  `en` **and** `x-default`, on every route — must be a member of the prerendered set. Verified to **fail**
  against the old behaviour, naming all **six** broken URLs: the four static routes plus **both** article
  routes. (An earlier draft of this amendment said four — that repro had reverted only the non-article
  branch, so it missed the article case this very amendment calls the worse one. Corrected after review.)
- `e2e/seo.spec.ts` gains a test asserting every advertised alternate serves **its own canonical**, not
  merely a 200 — the check that would have caught the soft-404. The pre-existing test titled *"every
  advertised URL resolves to a live page"* checked exactly **one** URL and was renamed to say so; a test
  title that overstates its coverage is how a whole class of URLs went unverified.

## Amendment (2026-07-28) — the path stays authoritative, so the reader's own language is **offered**, never imposed; and the prerender is not a visitor
**The invariant, stated generally because it outlives this feature:**

> **The prerender is not a visitor.** `scripts/prerender.mjs` snapshots every route in a single **en-US**
> browser and that HTML is served to **everyone**, so any component that renders off the **visitor**
> (`navigator.language`, storage, viewport, time zone) rather than the **route** must **opt out of the
> snapshot explicitly**.
>
> **The exemption is "identical for every visitor", not "does not render".** `ConsentBanner` reads storage
> and IS baked into the snapshot — `analyticsConfigured()` is true in every shipped build, so
> `dist/pt/index.html` contains it. That is fine, and the reason has to be stated precisely or the
> invariant reads as violated: consent starts *undecided* for everyone, and the bar renders in the
> ROUTE's locale. What must never enter the snapshot is a render that differs **between visitors**.

**What shipped.** This ADR made the URL path authoritative: a shared `/en/…` link pins English for whoever
opens it, including a pt-BR native. That is the right trade for the sharer — the link works exactly as sent —
but it left the reader with no in-page way out. When the path locale differs from the visitor's browser/OS
language, the site now shows a **dismissible notice offering the visitor's edition**. Accepting persists
through the **same `locale` localStorage key as the PT/EN toggle** (so it overrides detection thereafter) and
navigates to the **sibling per-locale URL for the same logical route** — not the landing.

**Considered and rejected: auto-redirect on language mismatch.** It is the shorter path for the reader and it
is what an edge Accept-Language negotiation would have done. *Why not:* it silently breaks the sharer's link.
The whole point of this ADR is that a URL **is** an edition; a redirect makes `/en/me` mean "whatever the
opener's browser says", so a link sent deliberately in one language cannot be trusted to arrive in it.
**Offer, never redirect** — the path still wins; the reader opts in. *Trade-off (accepted):* a pt-BR reader
who wants Portuguese pays one extra click, and there is now a notice on the page for a reader who wanted
neither.

**A second persisted key — `locale-suggestion-dismissed`, independent of `locale`.** The two mean different
things and must not be conflated: **`locale` records a CHOICE** (the toggle, or accepting the offer) and
drives which edition is served; **`locale-suggestion-dismissed`** records only that the offer was **declined**,
so it is never repeated. *Trade-off:* a second key is more client state to reason about, and a reader who
clears storage is offered once again — accepted over overloading `locale` with a sentinel, which would have
made "declined the offer" indistinguishable from "chose this language".

> **Amended 2026-08-02 (#323): dismissing writes `locale` too, and the enumeration above is superseded.**
> *"`locale` records a CHOICE (the toggle, or accepting the offer)"* is now incomplete — **the dismiss
> control writes it as well.** Kept as written rather than edited, per this library's rule.
>
> **What changed is the premise, not the decision.** This amendment assumed *dismiss = decline*. It is
> not: the button is labelled **"Continuar em inglês" / "Continue in Portuguese"** — an affirmative
> statement of preference that also happens to close the notice. So a reader who answered the offer had
> stated a language, the site stored nothing, **and then permanently silenced the one control that would
> have asked again**. Next open at the bare root fell through to `navigator.language`, in the other
> edition, forever. Reported as *"não guarda a preferência de ter trocado para pt"*, which is exactly
> what it looks like from the reader's seat.
>
> **The two-key decision survives intact, and that is why this is an amendment rather than a reversal.**
> Both keys are still written separately and *"declined"* stays distinguishable from *"chose"* — which is
> what the trade-off paragraph above was protecting. What each key now buys:
> **`locale`** stops the offer on this locale and drives the bare-root default; **`locale-suggestion-dismissed`**
> covers the *other* locale, so a later shared link in the language just declined does not re-ask.
>
> **Recorded here rather than left in a code comment**, because leaving it there would repeat the defect's
> own shape: `localeSuggestion.ts:11` documented the key as *"the reader dismissed the offer"* while
> `messages.ts:290` labelled the same button as an affirmative choice, and neither knew about the other.
> A record and an artifact disagreeing is how this went unnoticed for its whole life.
>
> **Still not reversed:** accepting must NOT write the dismissal key — see immediately below, unchanged.

> **Amended 2026-08-02 (#333): the dismissal FILLS A GAP and never overwrites.** The block immediately
> above says *"the dismiss control writes it as well"* — unqualified, and that is now too strong. It
> writes `locale` **only when no valid locale is already stored.** Superseded, not rewritten, one hour
> after being recorded: the record was true for the state the code was in and stopped being true when the
> next slice landed.
>
> **The toggle is sovereign over the dismissal** (owner decision). They are not the same kind of act,
> even though both end in a locale:
>
> - the **toggle** is a decision about the reader's own preference — nothing prompted it, they went
>   looking for the control;
> - the **dismissal** answers a question the *site* asked, about the page they happen to be on.
>   "Continue in Portuguese" means *this page is fine* — a statement about the current visit, not a
>   re-declaration of a standing preference.
>
> Treating them as equal let an incidental shared link overwrite a deliberate setting: toggle to EN,
> later open a `/pt` link, answer the offer, and the stored choice silently flipped to `pt`. Same class
> as the defect the block above fixes — the site behaving as though the reader had said something they
> did not say. Found by `security` reviewing that very fix, which is the shape a working gate has.
>
> | stored before dismissing | after dismissing on `/pt` |
> |---|---|
> | nothing | `pt` — the amendment above, intact |
> | `en`, from the toggle | **`en`, untouched** |
> | `pt` | `pt`, unchanged |
>
> **The predicate is `isLocale`, not truthiness, and that is load-bearing rather than tidy.**
> `detectLocale` decides whether a stored value has any effect with the identical test — so the write is
> suppressed in exactly the cases where the existing value will actually be honoured, and never in a case
> where it will not. A truthiness check reads the same and strands a reader: truthy garbage blocks the
> write, `detectLocale` still refuses to honour it, and the dismissal key has already silenced the one
> control that would have asked again.
>
> **Unchanged:** the dismissal key is still written every time, so declining stays durable; accepting
> still writes no dismissal; `localeToOffer` is still untouched.

**Declined only — accepting must NOT write it.** The distinction is load-bearing rather than tidy. The
dismissal is checked before everything else, so writing it on an *accept* would permanently retire the
feature for the reader who just used it: the next shared wrong-language link would leave them exactly
where this amendment found them. Nothing needs the write — on the edition they switched to, the visitor's
language and the path's now agree, which is the first and cheapest silence. (The first implementation did
write it, every test passed, and the review caught it; the absence is now asserted.)

**The suppression case worth recording.** The offer stays silent in four cases; three are obvious (page
already in the reader's language · already dismissed · nothing to offer). The fourth is not: it is silent
when the reader **explicitly chose the locale the URL pins** (stored `locale` === path locale) — a pt-BR
speaker reading the English edition **on purpose** must not be second-guessed. It deliberately does **not**
suppress when the stored choice is the **other** locale: they chose `pt`, then followed a shared `/en` link;
the path still wins per this ADR, and the offer stands. That is the case the feature exists for. The decision
is a pure function (`src/lib/localeSuggestion.ts`) precisely so every branch is exercisable without a DOM.

**The prerender consequence — measured, not reasoned.** On a `/pt` route the snapshot browser looks like an
English speaker, so every render condition held and the offer **baked into the Portuguese HTML**: `dist/pt/**`
shipped an offer to read in English, shown to every Portuguese reader until hydration removed it. The obvious
fix — render client-only behind a **post-mount flag** — **does not work here**, and the first implementation
used exactly that and still leaked: this prerender snapshots a **live, already-hydrated page**
(`page.content()` after the head settles), so effects have run and `mounted` is long since true. The signal
must be about **who** is rendering, not **when** — hence `window.__PRERENDER__`, set by the snapshot browser
via `addInitScript` and checked by the component. *Trade-off:* a build-only global is a seam between the
snapshot harness and app code, and any future visitor-dependent component must remember to check it; the
alternative (making the prerender a non-hydrating render) would be a much larger change to
[ADR-0002](./0002-fully-static-spa-no-backend.md#content-and-og-resolved-at-build-time)'s build-time-render mechanism for one component's sake.
Enforced rather than written down: `e2e/per-locale.spec.ts` asserts the **shipped** HTML for both editions
carries no offer — asserted against the artifact because every unit test passed while `dist/pt/**` was wrong.
Verified by mutation.

**Two smaller decisions, recorded so they are not re-litigated.**
- The notice carries **its own `lang`** — the **suggested** locale, not the page's — because the text is
  written in the language being offered; without it a screen reader pronounces Portuguese with an English
  voice, or the reverse.
- Both bottom notices (consent bar + locale offer) now share **one fixed container** in `AppShell` and sit in
  it as normal blocks. Positioning each `fixed bottom-0` would overlap them, and offsetting one by the other's
  height would hard-code a number that changes with the copy.

**Nothing in the decision above changes.** Per-locale prefixes, per-locale prerender, hreflang, OG-per-locale
and x-default all stand; this amendment adds a client-side **offer** on top of an unchanged URL contract, and
records the prerender invariant it exposed. `iac/` is untouched — the negotiation is still client-side, so
[ADR-0002](./0002-fully-static-spa-no-backend.md#content-and-og-resolved-at-build-time)'s no-edge invariant holds.

## Amendment (2026-08-05) — why the dual-slug question keeps coming back, and the separation that ends it

**Nothing in the decision above changes.** The "NOT dual localized slugs" clause stands exactly as
written; `/library` ships as `/pt/library` · `/en/library`, which is this ADR as-is. This amendment adds
no decision. It records **why the same question has now been opened four times** and what a fifth opening
has to establish before it is worth anyone's time.

### The separation — the reusable part

Two different benefits have been argued for under one name, and they are delivered by different things:

| Benefit | Delivered by | Status |
| --- | --- | --- |
| **Language-pinning** — a forwarded link carries its language; the recipient sees the same edition as the sender, and the unfurl is in that language | the **locale prefix** (`/pt/…`, `/en/…`) | **shipped, by this ADR.** The path is authoritative, both editions prerender with their own head, hreflang and OG are per-locale |
| **Slug readability** — the word *after* the prefix is in the reader's language (`/pt/biblioteca`) | a **localized slug pair** | not adopted for static routes |

**These are separable, and only the first has ever been the requirement.** The owner's own statement of
what he wanted — *"urls e unfurl autossuficientes por língua para facilitar encaminhamento de links e
contexto com o idioma fixado"* — is language-pinning in full, and it was already live. A pair adds the
Portuguese word and nothing else; it does not make a link more self-sufficient, because the prefix
already fixed the language before the slug is read.

**The test for anyone reopening this:** say which of the two you want. **If the answer is pinning, it
already exists and there is nothing to decide.** If the answer is genuinely slug readability, that is a
real but much smaller benefit, and it is then weighed against a permanent second URL contract per route
plus the cost recorded below — on its own merits, not on pinning's.

### The count, and what the fourth opening cost

The dual-slug pair has been set aside four times without that separation being made:

1. The routing decision's 2026-07-25 `/architecture` amendment ([*Client-side routing and the public surfaces*](#client-side-routing-and-the-public-surfaces) below) —
   *"a new routing pattern — a bigger decision than adding a surface."*
2. The anchor's decision outcome — *"**NOT dual localized slugs.** … it is **not** decided here."*
3. The blog-only carve-out of [*Localized article slugs*](#localized-article-slugs) below — *"non-article routes keep the
   one-slug-prefixed-twice scheme."*
4. Issue [#166](https://github.com/tedeuxx/tadeumendonca-io/issues/166), 2026-08-05.

Each of the first three gives a **procedural** reason — the decision is large, or belongs elsewhere, or
is unchanged here. None weighs the reader, which is why none of them settled anything: a deferral that
never states what is being given up invites the next person to assume it is something valuable.

**The fourth opening is the evidence this amendment is worth its space.** It ran to a full architecture
analysis and a built slice — the route enumeration, the locale toggle, the unprefixed redirect, a new
`localizedRoutes` module and its tests — all reverted before merge, because the benefit being reasoned
about was one the site already had. That is the cost of leaving the two benefits fused, paid once, and
this table is what it bought.

**Note where the record is deliberately not repeating itself.** The routing decision already recorded the dual-slug
rejection *per-surface*, on `/architecture`, and the question was reopened on the very next surface. So
this is recorded **here**, on the clause that is actually challenged, rather than as another per-surface
note — a per-surface rejection has now been demonstrated not to hold.

### Accepted cost — the alternative is booby-trapped, not merely absent

Keeping the shared slug has a price this ADR did not previously name, and it is not "a pair is
unimplemented." It is that **the mechanism refuses to extend silently, and a test asserts the refusal as
intended behaviour.**

`localizeArticlePath` (`apps/fed/src/lib/content.ts:293`) passes every non-article path through
unchanged, and `apps/fed/src/lib/content.test.ts:301` asserts exactly that pass-through. The same
blog-namespace regex gates `articlePathForLocale` and this module's `alternatesFor`. So whoever adds a
static pair next gets a **reader-facing dead end on a fully green suite**: the PT/EN toggle on
`/pt/<pt-slug>` navigates to `/en/<pt-slug>`, which the in-locale `*` sends to the English landing —
Issue [#204](https://github.com/tedeuxx/tadeumendonca-io/issues/204) reappearing on a static route, with
nothing red to say so.

This is recorded as a **cost of the decision, not as a defect to fix now**. It is harmless while no
static route carries a pair, and fixing it speculatively would build the mechanism this amendment exists
to say nobody currently needs. What it must not be is a surprise: a future pair is a routing-mechanism
change with four crossings to guard (the toggle, the unprefixed redirect, hreflang/sitemap reciprocity,
and what the wrong-locale slug does), **not** a table entry — and the green suite will not tell you that.

## The edge exposes a locale hint, never a locale decision (2026-11-01)

**Added 2026-11-01 by [#669](https://github.com/tedeuxx/tadeumendonca-io/issues/669) (slice B1, the edge
half), written by `tech-lead` in [PR #803](https://github.com/tedeuxx/tadeumendonca-io/pull/803).
~~This section is `proposed`: it becomes `accepted` only when the owner ratifies that boundary-class MR.~~
**`accepted` 2026-11-01: the owner merged PR #803 himself (`993b3f9`), which is his ratification of
that boundary-class MR, [recorded on #669](https://github.com/tedeuxx/tadeumendonca-io/issues/669#issuecomment-6566368759); the status changed in #788.**
Its consent question is already his, answered on 2026-11-01 («Antes, e divulgar»,
[#669 comment](https://github.com/tedeuxx/tadeumendonca-io/issues/669#issuecomment-6564678895)).** It is a section here rather than a record of its own because it is
behaviour of this capability, locale resolution, and
[0053](./0053-this-library-records-presence-and-site-architecture-one-document-per-capability.md)'s
capability limb puts such a decision in the capability's document. The owner decided IP geolocation
above the browser language, the CPLP map («Países lusófonos») and the bare root included («Raiz
também»), all on #669; the delivery shape, the cookie contract and the value set are `tech-lead`'s,
inside the bounds the closed description set. Consumed by
[#788](https://github.com/tedeuxx/tadeumendonca-io/issues/788) (slice B2, the client step).

### Context

The owner ruled that the reader's country, as the edge geolocates it, comes **before** the browser
language, at the bare root as well. The precedence the whole feature implements:

```
1. the locale in the URL path        (unchanged — the path keeps winning)
2. a persisted override              (unchanged — an explicit choice outranks any inference)
3. IP geolocation                    <- NEW (client step: slice B2, #788)
4. navigator.languages
5. English
```

**The country is known only at the edge, and the document cannot carry it.** The HTML is one cached
object per URL, identical for every viewer, and a viewer-request function can rewrite the request or
answer it, never add to the response. So the fact reaches the browser by another channel, and that
channel is what this section decides.

**Three constraints are not tradeable.** A non-JavaScript client (a crawler, a social scraper) receives
exactly what it receives today at every advertised URL —
[*A neutral, self-canonical share URL per article*](#a-neutral-self-canonical-share-url-per-article) rejected an edge redirect for that
reason and [ADR-0005](./0005-og-coverage-every-public-url.md) pins a card on first fetch. The persisted
override outranks the IP step. And locale **resolution** stays in the client, where this record put it.

**What is not yet known is the slice's spike.** Whether a CloudFront Function reads
`CloudFront-Viewer-Country` when the header is named only in an **origin request policy** (no cache-key
cost), or only when it is in the **cache policy** (one cached object per country), is a premise read
from vendor documentation and never measured here. Local work is read-only and the distribution changes
only through the pipeline, so the slice's own deploy is the spike and the post-deploy check is its
verdict.

### What it changes in this record

**The decision driver *"never a request-time / Accept-Language edge function"* is narrowed, not
reversed.** It read as *no locale-related code at the edge at all*, and that no longer holds: a
viewer-response CloudFront Function now sets a `locale_hint` cookie on each HTML response. Its operative
half is unchanged and now reads: **the edge never resolves a locale, never routes and never redirects.**
The driver existed to keep request-time locale **compute** out of the edge, the thing
[ADR-0002](./0002-fully-static-spa-no-backend.md#content-and-og-resolved-at-build-time) removed; reading one header and copying one of
three values into a cookie decides nothing. The *"No edge / Accept-Language logic"* consequence is
narrowed the same way: still no edge negotiation, but `iac/` now carries a function that exposes a hint.
Rejected option 4 stays rejected — the edge reads no `Accept-Language` and makes no routing decision —
and the 2026-07-28 amendment's *"the prerender is not a visitor"* invariant is untouched, since the HTML
is byte-identical for every viewer.

### The decision, as it binds

**A viewer-response function sets a short, script-readable cookie on every HTML response; the header it
reads is enabled by a custom origin request policy naming only `CloudFront-Viewer-Country`; the cookie
carries a three-valued hint; the client decides.**

| attribute | value | why |
|---|---|---|
| name | `locale_hint` | names what it is (a hint for locale resolution), not where it comes from |
| values | `pt` · `other` · `unknown` | a closed set; anything else is a defect |
| `Path` | `/` | every route reads it |
| `Secure` | set | HTTPS only |
| `SameSite` | `Lax` | no cross-site use exists |
| `HttpOnly` | **not** set | the client script must read it |
| `Max-Age` | `3600` | every HTML response sets it again, so the lifetime only has to span client-side navigation within one visit; an hour does, and keeps storage short |
| `Expires` | not set | `Max-Age` alone |
| scope | HTML responses on the default behavior only | `content-type` beginning `text/html`; `/assets/*` carries no function and gets none |

**The values:**

- `pt` — the header is present and names a CPLP member state;
- `other` — the header is present and names any other country;
- `unknown` — the header is absent, empty or not a string.

**The country map is the owner's, verbatim:** Angola `AO`, Brazil `BR`, Cabo Verde `CV`, Equatorial
Guinea `GQ`, Guinea-Bissau `GW`, Mozambique `MZ`, Portugal `PT`, São Tomé and Príncipe `ST`, Timor-Leste
`TL`, matched case-insensitively. It lives in the function only.

**How the client (B2, #788) consumes it:**

- **`pt`** — step 3 resolves to `pt`.
- **`other`, `unknown`, an absent cookie, or any value outside the set** — step 3 resolves nothing and
  falls through to step 4 (`navigator.languages`). **`other` does not mean English**; it means *not
  decided by geography*.
- Read synchronously from `document.cookie` at first script, before the bare-root redirect; under
  `window.__PRERENDER__` the step does not run.
- The client never writes, refreshes or deletes the cookie. The persisted override is a separate key and
  stays above step 3.

The absent-cookie case is real and not only a fault: a response without a `text/html` content type (a
`304` revalidation may carry none; not measured here) is passed through without the cookie, and a visit
after the hour lapses with no fresh HTML response has none. Treating absent as `unknown` keeps those cases
correct.

**How the spike becomes conclusive.** The go/no-go is `apps/fed/e2e/edge-locale-hint.spec.ts`, tagged
`@spike-669`, and it runs in **its own step** of `deploy.yml`'s post-deploy `e2e` job, apart from the smoke:
the smoke runs with `--grep-invert @spike-669`, the spike step with `--grep @spike-669` and
`continue-on-error`, and the `report` job prints the spike's outcome on its own line (GO or NO-GO). **A
NO-GO is therefore not a site-broken red**: the site is intact on a no-go, because nothing reads the
cookie until B2. The spec requests HTML at the live apex and asserts the value is **`pt` or `other`**.
Either proves the header reached the function, since only a present header produces one; **`unknown` is
the NO-GO** on the origin-request-policy route. Accepting either geographic value also removes the
unmeasured premise that the runner sits outside the CPLP. A missing cookie fails the same step with its
own message: the function is detached, stale or rejected. **On a no-go** the header moves to
the cache policy (rejected option 2 below, its cost stated in advance), the HTML cache fragments by
country, and the spike step runs again on that deploy. If that cost is judged not worth the feature, the
question goes back to the owner, as #669's planning note says. B2 does not start until `report` prints GO.

### Rejected options that are still live

- **A separate uncached endpoint** that the client fetches. Every unprefixed-path visit would wait one
  more round-trip before it can redirect, and it needs a new cache behavior. **Its one advantage is
  real**: nothing is stored, so the consent question does not arise. It is the route the
  behind-the-consent-gate position would have forced; the owner ruled against that position (see
  *Consent* below), so it stays rejected.
- **The header in the cache policy** — rejected unless the spike forces it. The country becomes part of
  the cache key, so every HTML document is cached once per viewer country, lowering the hit rate on
  every page for a value one function reads. Stated here so a no-go needs no new decision about whether
  to pay it.
- **A managed all-viewer origin request policy** — it forwards `Host`, which an S3 origin behind OAC
  rejects.
- **Two values, `pt` and `other`, with an absent header folded into `other`** — the issue's
  recommendation and the builder's first cut. From a runner outside the CPLP the post-deploy check is
  green whether or not the header arrived, so the spike's one question has no observable answer.
- **The raw country code** — it stores a location where a hint suffices, and moves the CPLP map into the
  client.
- **A value only for CPLP viewers** — a missing cookie would then mean *non-CPLP*, *header absent* and
  *function detached* at once, and the check from a non-CPLP runner could not fail.
- **An edge redirect to the resolved locale** — it changes what a non-JS client receives at an
  advertised URL ([*A neutral, self-canonical share URL per article*](#a-neutral-self-canonical-share-url-per-article)'s rejected edge
  redirect, #660's constraint; a scraper obeys a redirect too), and it would put resolution at the edge.

### Consent — the owner's ruling: set before any choice, and disclosed

**The owner decided it on 2026-11-01, in session, in three words: «Antes, e divulgar»**
([#669 comment](https://github.com/tedeuxx/tadeumendonca-io/issues/669#issuecomment-6564678895)).
The cookie stays set before any consent choice, so the hint exists on the first visit; and `/analytics`,
in both editions, discloses it.

**The question he was asked.** The site stores `locale_hint` on the reader's device on the first HTML
response, before any consent choice. It carries one of three values, no identifier and no location,
lives for an hour, and is read only by this site's own script. Does it go behind the consent gate
([ADR-0005, *Consent-gated GA4 analytics*](./0005-og-coverage-every-public-url.md#consent-gated-ga4-analytics)), or is it set before a choice?

**Chosen: set before a choice, and disclosed.** The feature works on a first visit, which is the visit it
exists for, and the reader is told what is stored, what it carries and how long it lives.

**The two positions that lost, and why:**

- **Set before a choice, undisclosed** — the delivery as first built. *Lost because* the site's own
  published sentence about cookies would then read as false (below): a reader could find a cookie the
  page appears to deny.
- **Behind the consent gate.** Nothing would be stored before a choice. *Lost because* on a first visit
  the hint would not exist when the client decides, so step 3 would never fire on the visit it was ruled
  for. In practice it meant **replacing the cookie with the endpoint**, which stores nothing and pays one
  round-trip on each unprefixed visit — the endpoint stays listed above as the rejected delivery shape.

**The copy the disclosure corrects.** `apps/fed/src/content/analytics.en.md`: *"Before a choice, on
decline, and on a build with no measurement id, the tag is never loaded, no cookie is set and no request
is made."* Its pt-BR edition, `apps/fed/src/content/analytics.pt.md`: *"Antes de escolher, se você
recusar, e num build sem identificador de medição, a tag nunca é carregada, nenhum cookie é gravado e
nenhuma requisição é feita."* In context the paragraph is about Google's tag, but *"no cookie is set"*
stands on its own. The disclosure lands in both editions in the same MR as the cookie (PR #803), but
**not at the same moment**: in `deploy.yml`, `deploy-app` depends on `terraform-apply`, so the cookie goes
live at the edge minutes before the corrected copy publishes. During that window the old sentence is
live beside the cookie, and **if `deploy-app` fails the window stays open until a fix ships**. The order
is deliberate and stays: the edge applies first, the app publishes after.

The ruling is the owner's and this section claims no legal position; it records the engineering
consequence of each answer.

### Consequences still being paid

- **Good:** non-JS clients are untouched — the only response change is one `Set-Cookie` header on HTML;
  the client decides at first script with no round-trip; the spike has a falsifiable verdict; the map
  has one home, and the cookie carries a hint, not a location.
- **A second function runs on every default-behavior response**, after the cache. `spa_rewrite` already
  runs on every page request, so this is not edge compute returning where there was none; what is new is
  a function whose output **varies per viewer**.
- **A runtime error in a viewer-response function fails the response.** The unit test evaluates the
  shipped bytes, but only the edge can say the runtime accepts them. Rollback is a revert and a merge.
- **The origin request policy changes what reaches the S3 origin.** If OAC signing rejected the forwarded
  header every page would fail; the plan on the MR and the post-deploy suite are where that shows, and
  the suite runs after the apply, not before.
- **Something is stored before consent**, on the owner's ruling, and the site says so on `/analytics`.
- **IP is not language.** A Brazilian abroad, a corporate VPN and a reader in Portugal (who gets pt-BR)
  resolve wrongly; the owner accepted this trade on #669.
- **On a no-go, the HTML cache fragments by country.**
- ~~**The `/architecture` claim that the edge function *"touches the URL, nothing else"* becomes
  incomplete.** Correcting it is B2's scope (#788).~~ **Paid in #788:** `/architecture` names both edge
  functions in both editions, and `/analytics` states the cookie's one use, limited to addresses that
  name no language.
- ~~**Nothing observes the client honouring the contract** until B2 ships with its own regression; until
  then the cookie is inert by construction.~~ **Since #788 the client reads it**, and three things observe
  that: the unit tests on `detectLocale` in `apps/fed/src/i18n/config.test.ts`, the journeys in
  `apps/fed/e2e/locale-hint.spec.ts` (the injected-cookie half runs locally only, because the live edge
  overwrites an injected cookie; one coherence check runs post-deploy too), and `scripts/prerender.mjs`,
  which sets `locale_hint=pt` in the snapshot browser so a broken opt-out fails the build.

### Where it came from

Driven by #669 (slice B1), consumed by #788 (slice B2). Runs on
[ADR-0013](./0013-s3-cloudfront-hosting.md)'s distribution, applied pipeline-only per its
[*Pipeline-only apply*](./0013-s3-cloudfront-hosting.md#pipeline-only-apply) section. Consistent with
[ADR-0002](./0002-fully-static-spa-no-backend.md#content-and-og-resolved-at-build-time) — nothing here renders.

## Client-side routing and the public surfaces

**Absorbed 2026-11-22 (#456, the eleventh slice) from the record that held it, 0010, decided 2026-07-22
and amended 2026-07-23, twice on 2026-07-24, 2026-07-25, 2026-07-30, 2026-08-05 and 2026-08-06.** The
decision is unchanged and still binds. What arrived: the routing model and the information architecture
as they bind, the decision each amendment added for a surface, the back-compat contract with its
pre-launch scope correction, the narrowed orientation claim for `/architecture`, and the rule that
markdown resolves a site path to the active locale. What was left in git history: the narration of each
amendment, and the forward-pointing updates to its deferred URL questions, which the anchor and
[*Localized article slugs*](#localized-article-slugs) now answer directly. The full record is in git
history: `git log --diff-filter=D -- 'docs/adr/0010-*'` names the commit that removed it, and its parent
holds the file.

### Context

The SPA needs a routing model and an information architecture. Two decisions fall here: what lives at
`/`, and how a URL that is already in the world keeps working when shared links and `og:image` deep-links
point at it. [ADR-0002](./0002-fully-static-spa-no-backend.md) leaves no server to route, so routing is
client-side, and every real route is prerendered
([ADR-0005](./0005-og-coverage-every-public-url.md)). The strategic priority is presence through content
and portfolio, so the home has to sell the content rather than the CV.

### The decision, as it binds

**react-router, client-side; `/` is the content landing; each standing surface is its own route; a URL in
the world keeps resolving.**

- **The landing** is content-first: hero, articles, a portfolio shortlist and contact. The articles list
  lives there, and `/blog` redirects to `/#artigos` as a live convenience for the blog namespace.
- **The profile is `/me`, labelled "Perfil" / "Profile"** (renamed from `/cv` on 2026-07-24, the owner's
  positioning call: "CV" read as too marketing and recruiting for a reader-first proof-of-engineering site). Only the framing and the route
  changed; the page's content did not. **The internal vocabulary stays**: the page component is
  `ProfilePage`, but `CVSection` and the `cv.*` catalog keys keep the word that names the machinery that
  renders a résumé. The decision stops at the reader-facing boundary.
- **`/portfolio`** and **`/blog/:slug`** are their own routes; the article slug is per locale
  ([*Localized article slugs*](#localized-article-slugs)).
- **`/ramp-up`** (2026-07-23) and **`/architecture`** (2026-07-25) are **pages, not articles and not
  landing sections**: a living document edited as the plan advances, and a blueprint of the site, each a
  standing part of the argument and each with a nav entry. Their bodies are markdown in the repository,
  one file per locale, rendered through the shared `<Markdown>`, so they inherit the article pipeline —
  the YouTube click-to-load facade included, so a page embeds video while shipping no third-party frame
  until the reader asks.
- **`/library`** (2026-08-05) is **chrome around typed data** (`src/data/library.ts`), following
  `/portfolio` rather than the markdown surfaces: a shelf is a list of records with a rating, and markdown
  would put structured facts where nothing can check them. Facts are authored once and carry no locale;
  the one prose leaf is `Record<Locale, string>`, so a missing translation is a compile error. It shipped
  before its books with an authored empty state, which is live copy kept under test; its nav entry and the
  `/ramp-up` cross-link landed with the first books (2026-08-06).
- **Every new surface takes one English slug, prefixed per locale, with a bilingual label and body.**
  `/pt/library` · `/en/library`, like the five surfaces before it. A localized slug pair was declined per
  surface twice; the reasoning lives on the clause that keeps being challenged, the anchor's 2026-08-05
  amendment, and is not restated per surface.
- **The route set has one source of truth, `apps/fed/scripts/routes.mjs`**, the single enumeration both
  the prerender and the sitemap read, so a route is snapshotted and advertised together or not at all. A
  surface's slice updates it and the E2E canonical-route drift guard (`seo.spec.ts`) together.
- **A redirect is not a route.** A back-compat path is a client-side `<Navigate … replace>`, never
  prerendered and never in the sitemap; `routes.mjs` lists only real routes. An unprefixed sub-path is a
  redirect to the reader's edition in the same way (the anchor), asserted rather than assumed.
- **The back-compat contract: a published URL is permanent.** Once a path is in the world it keeps
  resolving, with its redirect and its E2E guard. The contract was **scoped out for the pre-launch window**
  on 2026-07-24: nothing external pointed at `/cv`, `/profile`, `/articles` or `/articles/:slug`, so those
  redirects were dropped, and an unmatched path falls through to the landing via `*`. The window closed at
  launch; `/pt/library` and `/en/library` were the first surface added under the rule applied forward, so
  both were permanent from merge. For articles the contract is carried by `previousSlugs` in
  `src/lib/content.ts`: a corrected slug is recorded beside the slug that retires it, and `App.tsx` turns
  each entry into a redirect to the current slug.
- **Markdown resolves a site path to the active locale** (2026-08-06). Long-form is authored per locale
  but a site path is not, and a bare `[Biblioteca](/library)` in a Portuguese body would render an
  unprefixed path that resolves through the *browser's* language — the defect #204 fixed for articles,
  through another door. So authors write the **logical** path and `<Markdown>` resolves it to the active
  locale through react-router, as `AppShell` already did for chrome through `useLocalePath`. Absolute URLs,
  `mailto:` and `#anchor` links are untouched, and both editions author the identical link, which is what
  the source-parity guards compare.
- **`/architecture` is an orientation layer, narrowed for diagrams** (2026-07-30). It links the ADR
  library, the public repositories and `docs/catalog-ready.md` rather than restating them, and no ADR's
  reasoning is restated on it. The one exception is a **diagram**, admitted only where a sentence cannot
  carry the content — a topology, a path with a branch on it — and each diagram carries a build-time
  guard for its artifact and an assertion for its shape: `scripts/architecture-diagrams.test.mjs` asserts a
  directed path from the reader through the rewrite to the origin and back, so a labelled box list fails.
  The residual drift is owned by
  [ADR-0008, *Diagrams compiled from Mermaid at build time*](./0008-brutalist-mono-identity.md#diagrams-compiled-from-mermaid-at-build-time).
- **Where `/library` and `/ramp-up` name the same book, they agree on facts** — title, URL, and finished
  on `/ramp-up` if rated on `/library` — never on prose. Neither containment direction is an invariant (the
  shelf is broader than AI engineering, the reading list includes unread books), so the guard is scoped to
  the intersection and carries its own non-vacuity assertion (`src/data/library-rampup.test.ts`).
- **Route names in older text.** Text across the library written when the profile route was `/cv` is left
  as written, with a note where the reference sits, because the rename is invisible from the file that
  carries it. This is the *leave + flag* shape the library's README describes.

### Rejected options that are still live

No in-repo test refuses these, so the reasoning stays.

- **The CV at `/`** (the previous design) — the strategy leads with content and portfolio; the home is
  the shop window, with the profile one click away.
- **No back-compat redirects for URLs in the world** — every shared or indexed deep-link would 404,
  destroying accumulated presence. It was right only while there was no presence to protect, which is the
  pre-launch window that has closed.
- **A localized slug pair per static surface** (`/arquitetura ↔ /architecture`, `/pt/biblioteca ⇄
  /en/library`) — a new routing pattern for a benefit the prefix does not already deliver; see the
  anchor's 2026-08-05 amendment, including the booby-trap a pair would walk into.
- **A placeholder book on an empty `/library`** — reader-facing prose in the owner's voice that ships and
  is then removed, which is exactly what an OG scraper pins
  ([ADR-0005, *Per-article OG cards*](./0005-og-coverage-every-public-url.md#per-article-og-cards)).
  Chrome can say "not yet"; a fake book cannot.
- **A diagram that restates prose** — still forbidden by the orientation rule; a box list is decoration
  and is cut.

### Consequences still being paid

- The redirect set is maintenance, covered by E2E journeys, so a routing change cannot silently break a
  back-compat link.
- Client-side routing means the prerender must enumerate every real route; a missed route ships blank.
- Every surface added since launch is a permanent public URL from its merge.
- `/architecture` can now be wrong about the system in a way a page of pointers could not: a diagram is a
  third place an infrastructure change must land, and a stale diagram reads as authoritative.
- Two hand-authored book lists are guarded only where they overlap.

## The locale layer

**Absorbed 2026-11-22 (#456, the eleventh slice) from the record that held it, 0032, decided 2026-07-23
and amended 2026-07-23 (everything the reader reads in both languages), 2026-07-29 (its English-pinned
half retired) and 2026-09-20 (#661, the detection signal widens).** The decision is unchanged and still
binds. What arrived: the locale layer as it binds, its precedence ladder as it stands today, the
bilingual-content rule and its parity guards, the `LocaleProvider` carve-out, and the rejected options
still live. What was left in git history: the struck clauses about an English-pinned prerender and the
deferred slices, all retired or paid off by 2026-07-26; this section states what is current instead.
The reversed record this layer superseded, 0011, is folded below as *What this replaced*. The full records
are in git history: `git log --diff-filter=D -- 'docs/adr/0032-*'` and
`git log --diff-filter=D -- 'docs/adr/0011-*'` name the commit that removed each, and its parent holds the
file.

### Context

The owner maintains one CV across several surfaces. LinkedIn is English, and the site's canonical
structured CV (`profile.ts`, [ADR-0024](./0024-profile-canonical-cv-cross-surface.md)) was already
English, but the site's UI was pt-BR only (*What this replaced* below), so the site presented an English
CV inside pt-BR chrome — incoherent with the other surfaces and blocking the CV sync. A pt-BR visitor
still had to be served in their language. Two locales on a static SPA, with no server
([ADR-0002](./0002-fully-static-spa-no-backend.md)) and build-time OG
([ADR-0002, *Content and OG resolved at build time*](./0002-fully-static-spa-no-backend.md#content-and-og-resolved-at-build-time)),
do not justify an i18n framework (lean by design,
[ADR-0053](./0053-this-library-records-presence-and-site-architecture-one-document-per-capability.md#lean-by-design--the-keystone-every-record-is-read-through)).

### The decision, as it binds

**A light in-repo locale layer: a typed pt/en message catalog, a `LocaleProvider`, `useT()` and
`useLocale()`, and no i18n library.**

- **The precedence ladder**, one implementation in `src/i18n/config.ts`, used both by `detectLocale`
  (what is served) and by the offer of the other edition (the anchor's 2026-07-28 amendment), so the two
  cannot disagree:

  ```
  1. the locale in the URL path        (the anchor — the path always wins)
  2. a persisted override              (`locale` in localStorage: the toggle, or accepting the offer)
  3. the edge locale hint              (since #788 — The edge exposes a locale hint, above)
  4. navigator.languages
  5. English
  ```

- **Step 4 walks the reader's whole declared list** (2026-09-20, #661), in declared order, comparing on the
  primary subtag (`pt-BR`, `pt-PT` and `pt` all read as Portuguese). **English is the baseline, not a
  match**, so an `en*` entry cannot end the walk: Portuguese declared anywhere in the list wins, and
  everything else is English. An empty or absent `languages` falls back to `navigator.language` and then
  to the baseline — never `languages[0]` on an empty array. The walk is written in order even though, with
  two editions and one of them the fallback, order is not observable, so a third edition would behave
  correctly rather than by accident.
- **Detect before first render.** The locale is resolved synchronously before `createRoot`, so there is no
  post-mount language flash, and `<html lang>` tracks the active locale.
- **Everything the reader reads is authored in both languages** (the owner, 2026-07-23: *"tudo tem que
  ser dois idiomas"*). Chrome lives in the catalog, key-first `{ pt, en }`. Structured data carries a
  leaf-bilingual type — the **leaf rule** — so a missing translation is a compile error. Prose is **one
  markdown file per locale**, selected by a `Record<Locale, string>`, so a missing edition does not build;
  a paragraph is not a leaf, and interleaving two languages in one document would make both unreadable to
  edit. The CV localizes too: `profile.ts` is authored bilingually (`ProfileSource` + `resolveProfile`).
  English stays the **canonical** edition (ADR-0024) — a statement about which edition is authoritative,
  never about which one a visitor is served.
- **The parity that matters is asserted mechanically**, because two files can drift where a key-first
  object cannot: the editions expose the same links in the same order and the same section count, and each
  edition renders *without* the other's text present. That catches a stale translation and a fallback
  rendering; it cannot catch a translation that is merely bad.
- **An article's two editions are a build invariant**: `lib/content.ts` throws at module load if either is
  missing.
- **Both editions are prerendered**, each with its own head, canonical and OG (the anchor). The layer's
  first slice pinned the prerender to English; that clause, and every consequence that hung off it, was
  retired on 2026-07-26 when the anchor shipped as that slice's successor.
- **`LocaleProvider` is a LANGUAGE context, explicitly NOT the forbidden visual `ThemeProvider`.** The
  visual theme is fixed ([ADR-0008](./0008-brutalist-mono-identity.md)) and `apps/fed/CLAUDE.md`'s "no
  `ThemeProvider`" rule is about it. This context is a deliberate, carved exception, recorded so a later
  reader does not misread it as drift.

### Rejected options that are still live

No in-repo test refuses these, so the reasoning stays.

- **An i18n library** (react-i18next, react-intl, lingui) — a new dependency class and bundle weight for
  pluralization and interpolation machinery that is unearned at exactly two locales.
- **A key-first `{ pt, en }` object for prose** — interleaving two languages in one document makes both
  unreadable to edit; a file per locale under the same compile-time contract is the different granularity
  prose needs.
- **Reading only `navigator.language`**, the first entry of the declared list — it serves English to a
  reader who declared Portuguese third, which is the ordinary machine of a Brazilian engineer whose OS,
  IDE and browser are set to English, this site's modal reader.
- **Letting detection override the path** — three things rest on the path rule (the prerender, the
  self-canonical and `hreflang` reciprocity, and the sharer's contract), so overriding it would make
  `canonical`, `og:locale` and `<html lang>` lie about the served content.
- **A copy of the detection rule per call site** — fixing one alone makes the site contradict itself out
  loud, serving Portuguese while offering English on top of it. There is one implementation, and
  divergence is no longer expressible.
- **Locale negotiation in a CloudFront Function reading `Accept-Language`**, the earlier sketch in
  `docs/redesign/redesign-plan.md` — it puts request-time locale compute at the edge, which the anchor and
  ADR-0002 rule out. `docs/redesign/` is the pre-build design record, deliberately not updated; read it as
  history.

### Consequences still being paid

- Hand-rolled, so no ICU pluralization or interpolation niceties; zero new dependency class and a minimal
  bundle in exchange.
- Two files per prose surface can drift; the parity guards catch staleness and fallback rendering, not a
  bad translation.
- **The E2E harness could not express a multi-language reader**: `test.use({ locale })` takes a single
  string, so the configuration #661 fixed (en first, pt third) was unrepresentable in it, and a green suite
  proved nothing about it. `page.addInitScript` is the seam that can express it.
- **The defect was invisible to the one person who inspects the site closely**: the owner's own stored
  `pt` override answers at step 2 before step 4 is consulted. A persisted override on a tester's machine
  hides every step below it.

### What this replaced: the pt-BR-only UI

**Folded 2026-11-22 (#456, the eleventh slice) from the reversed record this layer superseded**, 0011,
decided 2026-07-22 and superseded 2026-07-23. The full record is in git history:
`git log --diff-filter=D -- 'docs/adr/0011-*'`.

**What it was.** A single-language **pt-BR UI** with no i18n framework: inline pt-BR strings, a `pt-BR`
date locale, and a bilingual phase planned but deliberately not built. Text published on the forge stayed
English; the site's UI was pt-BR because it is content, not a forge publication.

**Why it was decided then.** The audience and content were pt-BR, and lean by design said not to build an
i18n framework before it earned its cost. Building both languages from the start was rejected as
significant cost for a reach goal that was not yet the priority, and an English UI as serving neither the
content nor the audience.

**Why it was reversed.** The record named its own successor: the deferred phase would resolve the pt-BR UI
around English profile data. The cross-surface CV sync made that inconsistency the blocking problem, and
the layer above is that phase, built one day later.

**Still being paid.** The split it made explicit survives in a changed form: everything published on the
forge is English, and everything the reader reads on the site is in both languages. The migration it
predicted — string extraction and a locale layer, not a configuration flip — is the layer above.

## Localized article slugs

**Absorbed 2026-11-22 (#456, the eleventh slice) from the record that held it, 0037, decided 2026-07-26
and clarified 2026-07-27 and 2026-09-20 by the anchor's x-default amendment.** The decision is unchanged
and still binds. What arrived: the decision as it binds, the rejected options still live, and its
consequences, with the x-default clarification stated as it is now. What was left in git history: the
expired pre-launch premise of its migration note, kept here only as the reasoning it protects. The full
record is in git history: `git log --diff-filter=D -- 'docs/adr/0037-*'` names the commit that removed it,
and its parent holds the file.

### Context

The anchor made language an address but kept the **slug a shared fact**, authored once and prefixed per
locale. The launch article's slug was Portuguese (`meu-compromisso`), so its English edition resolved to
`/en/blog/meu-compromisso` — an English route carrying a Portuguese slug. The owner posts in English on
LinkedIn and must link a clean English-slug URL; a Portuguese slug on an English post, or a per-URL
redirect around it, is the inconsistency the presence strategy rejects. The slug has to be in the
language of its route.

### The decision, as it binds

**An article's `slug` is per locale; the article's identity is its filename key, which never appears in a
URL.**

- **Identity ≠ address.** The stable identity is the **filename base**, the grouping key for
  `buildEditions`, by convention the canonical English slug. Each edition carries its own `slug` in
  frontmatter: the `en` edition defaults from the key, `pt` overrides. `slug` is outside `FACT_KEYS`
  (date, tag and track stay shared). Both editions are still required.
- **Lookup** is `getPostBySlug(slug, locale)`, matching that locale's own edition slug, so there is no
  ambiguity.
- **The toggle maps the slug**: `setLocale` resolves an article route to the sibling edition's slug
  (`localizeArticlePath`), so `/en/blog/my-commitment` ⇄ `/pt/blog/meu-compromisso`, not a not-found.
- **`hreflang`, the sitemap and the prerender emit the per-locale slugs reciprocally.** An article's
  x-default is the **unprefixed** English slug, `/blog/<en-slug>`, the neutral address of the next section.
- **Anything keyed to an article that must survive a slug correction is keyed by the article KEY**, never
  by a slug — the OG card file is
  ([ADR-0005, *Per-article OG cards*](./0005-og-coverage-every-public-url.md#per-article-og-cards)).
- **Blog surface only.** `/me`, `/portfolio`, `/architecture`, `/ramp-up` and `/library` keep one slug
  prefixed per locale (the anchor). This decision is scoped to `src/content/blog/**`.
- **The migration** moved the launched article to `my-commitment.{en,pt}.md` (EN slug `my-commitment`, PT
  slug `meu-compromisso`) with **no redirect** for the retired `/en/blog/meu-compromisso`, because that URL
  never circulated. The reasoning is kept because the same question about a slug that HAS circulated has
  the opposite answer, which the back-compat contract and `previousSlugs`
  ([*Client-side routing and the public surfaces*](#client-side-routing-and-the-public-surfaces)) give it.

### Rejected options that are still live

No in-repo test refuses these, so the reasoning stays.

- **One shared slug plus a per-URL redirect** — a per-article special case in the routing table, and the
  article's identity on an English route stays a Portuguese slug. Do the routing change once, not a
  redirect per article per rename.
- **One shared English slug for both editions** — mirrors the inconsistency onto the pt-BR edition and
  forfeits pt-BR discovery on the slug itself, the imbalance the anchor exists to close.

### Consequences still being paid

- A slug-to-slug mapping is required in **three** places — the toggle, the `hreflang` alternates, and the
  prerender and sitemap enumeration — so blog routes lose the anchor's "one logical route prefixed twice"
  symmetry.
- Two permanent public URL contracts per article from this decision, and a third from the neutral address.
- Code-only: `iac/` and the CloudFront Function are untouched, with no `Accept-Language` logic at the edge.

## A neutral, self-canonical share URL per article

**Absorbed 2026-11-22 (#456, the eleventh slice) from the record that held it, 0052, decided 2026-09-20
on #660 and PR #667.** The decision is unchanged and still binds. What arrived: the owner's
specification, the decision as it binds with each of its clauses, the rejected options still live, the
per-clause enforcement table and the consequences. What was left in git history: the account of who
declined to decide the canonical question before it reached the owner, and the list of the anchor's clauses
it struck in place, since those clauses now read as amended above. The full record is in git history:
`git log --diff-filter=D -- 'docs/adr/0052-*'` names the commit that removed it, and its parent holds the
file. Deciders: the owner — the specification
([#660 comment](https://github.com/tedeuxx/tadeumendonca-io/issues/660#issuecomment-5743437953)) and the
canonical ruling
([#660 comment](https://github.com/tedeuxx/tadeumendonca-io/issues/660#issuecomment-5749824051)).

### Context

**The owner published a LinkedIn post in Portuguese carrying an `/en/` link, opened it, and read the
article in English.** His words: *«o link que vc tem compartilhado no linkedin nao é o slug nao
regionalizado idioma. entao quando abro ele carrega em ingles para mim ao inves de portugues.»* ·
*«isso é um erro»*.
[ADR-0005, *Distribution to LinkedIn and X*](./0005-og-coverage-every-public-url.md#distribution-to-linkedin-and-x)'s
2026-09-20 amendment reversed the convention — a post carries the locale-neutral URL — and recorded that
the rule was correct and inert, because the neutral URL was a soft-404 answering `200` with the landing's
card (`iac/frontend.tf` maps 404 to `/index.html` with 200, and the build snapshotted nothing there). This
section is what makes that convention usable.

**One address must serve two consumers differently**, the owner's specification and the whole feature:

| who requests the neutral URL | what it gets |
|---|---|
| a scraper — LinkedIn, X, a crawler | the **English preview**: `og:` tags and the English OG card. One stable card per article. |
| a human | the site's **automatic locale resolution**, landing them in their own language. |

His acceptance case: *«eu entraria pelo link nao regionalizado que li o preview em ingles mas clicaria no
link e espero ler em portugues.»* Nothing in the request distinguishes the two consumers.

### The decision, as it binds

**Every published article has one locale-neutral share URL, `/blog/<en-slug>`. It is prerendered, it is
SELF-canonical, and it is that article's advertised `x-default`.** `/blog/<en-slug>` is a real entry in the
route enumeration and a real document in `dist/`; the snapshot browser renders the **article** there, and
every other visitor's browser executes the page and is redirected into its own edition.

- **The split is by JAVASCRIPT EXECUTION, not by request-time inspection**, and that is the load-bearing
  property. A scraper fetches and parses; it does not execute the redirect. A human's browser does. The
  same bytes serve both, and nothing guesses which one is asking — user-agent sniffing at the edge would be
  a maintained list of strings that is wrong the week after it is written.
- **Keyed on the CURRENT ENGLISH SLUG, not on the article's identity key** — refuted against live content
  rather than reasoned. The article whose key is `the-problem-stopped-changing` carries
  `slug: from-cloud-to-ai-same-badge` in its English frontmatter
  (`grep -rn 'slug:' apps/fed/src/content/blog/*.en.md`), so a key-keyed scheme would have published, as
  the permanent share address of a live article, an address the retired-slug intercept exists to retire. An
  English-slug rename moves the advertised address; the intercept reaches the neutral path and **stays
  neutral**, redirecting the old neutral URL to the new one.
- **SELF-canonical, the owner's ruling.** The alternative — canonicalising at the prefixed English URL —
  advertises a page as `x-default` while telling a search engine the address is not the real one; a crawler
  resolving that against us drops the neutral URL, the one every future post carries. A recorded duplicate
  is better than a contradictory signal on the address the convention depends on.
- **`x-default` moves for ARTICLES ONLY.** The `pt` and `en` alternates and their own canonicals do not
  move. The four static routes keep the anchor's 2026-07-27 trade unchanged, and their bare paths are still
  redirect-only and never advertised. The anchor's invariant — *a URL may be advertised only if the build
  prerenders it* — is **satisfied, not traded away**: the bare article URL may be advertised because the
  build snapshots it.
- **The prerender opt-out is the anchor's "the prerender is not a visitor" invariant's SECOND consumer, not
  a new exception.** At `/blog/<en-slug>` the app renders the locale redirect, a `<Navigate>` that leaves
  before any head hook runs, so listing the path for the prerender alone would capture the `/en/…` document
  instead. `NeutralArticleRoute` reads `window.__PRERENDER__` and renders the article in place. **The build
  FAILS LOUDLY rather than shipping a wrong canonical**: inverting the opt-out kills `build:static` with
  `page.waitForFunction: Timeout 15000ms exceeded` from the neutral loop (confirmed by mutation at the merge
  gate), so the failure mode is a red build, not a silently wrong document at the most-shared address.
- **The draft generator is part of the decision.** `shareUrlFor()` in
  `apps/fed/scripts/gen-distribution.mjs` resolves against the neutral set; it emitted `/en/blog/<en-slug>`
  by construction before. Shipping the route without it would have satisfied the precondition in the
  routing and defeated it in the tooling that scaffolds every post. A held article still has no share URL.

**What enforces this, per clause — and one seam nothing covers:**

| clause | what holds it |
|---|---|
| the neutral URL is advertised only if prerendered | **`apps/fed/scripts/routes.test.mjs`** — membership, from the same enumeration both consumers read |
| the neutral set matches the English article set | **`routes.test.mjs`**, three arms; neutering the enumeration at source turns them red |
| the generator emits the neutral URL | **`gen-distribution.test.mjs`** — every emitted URL is a member of the real `neutralArticleRoutes()` output |
| the served document is self-canonical | **`e2e/per-locale.spec.ts`** — `canonical == requested URL` on the served document, with a **nonsense-slug control**, because a nonexistent path also answers 200 |
| the snapshot is actually WRITTEN | **only the E2E arm.** The unit layer compares two enumerations and never reads the filesystem — deleting the neutral loop from `prerender.mjs` left `routes.test.mjs` green |
| the opt-out stays correct | **the build itself** — inverting it times out `build:static` |
| the share CONVENTION is followed in an actual post | **nobody.** No layer observes a draft, a post or a published URL — the same honest limit [ADR-0005, *Distribution to LinkedIn and X*](./0005-og-coverage-every-public-url.md#distribution-to-linkedin-and-x) records |

**One advisory carried rather than fixed:** the prerender summary line counts the enumeration's length
rather than what it wrote, so under the one mutation the unit layer is blind to it prints *"+ N neutral
share URLs"* having written none. Named so the next reader of that log knows what it counts.

### What this section does NOT decide

- **The locale resolver.** `#661` owns it (*The locale layer* above). *"A pt-BR reader lands in
  Portuguese"* is false for a returning reader, correctly — the persisted override and the edge hint sit
  above the browser's languages — so no assertion may claim it.
- **The title seam** — an English card headline against a Portuguese headline on arrival is a ruler
  question, tracked as a `content` item in `tedeuxx/tadeumendonca-skills`.
- **Whether the pinned link was costing readers** — a hypothesis on `#660`, with what would test it; this
  decision does not depend on it.
- **Anything about the four static routes.** Their x-default is the anchor's.

### Rejected options that are still live

No in-repo test refuses these, so the reasoning stays.

- **An edge 302 from the neutral URL to the reader's edition** — a redirect is obeyed by whoever follows
  it, and an unfurler follows redirects, so LinkedIn would pin whichever edition its own headers chose and
  the one-stable-card property is gone. A redirect is the one mechanism that cannot tell the two consumers
  apart, and it puts negotiation at the edge, which the anchor rejected and
  [ADR-0002, *Content and OG resolved at build time*](./0002-fully-static-spa-no-backend.md#content-and-og-resolved-at-build-time)
  rules out.
- **Leaving the convention inert and sharing `/en/` links** — the defect the owner reported, and a rule
  every post is written against that the site cannot honour.
- **A neutral snapshot for EVERY route** — the anchor's own rejected option, whose reason was discharged
  for articles only; the four static routes have no share convention, no per-locale slug problem and a
  working prefixed x-default, so widening would spend the invariant's budget on routes nobody shares.
- **Canonicalising the neutral URL at the prefixed English one** — the contradictory signal above.

### Consequences still being paid

**Good:** the convention becomes usable and the reported defect cannot recur from a generated link; the
invariant gains a second consumer, generated from the same enumeration the prerender walks and the sitemap
advertises; the most-shared address survives a rename; GA's `locale` dimension on social traffic stops
being constant, which is worse than noisy because a constant reads as a finding.

**Bad, and stated as bad:**

- **The same English text at two self-canonical addresses** — `/blog/<en-slug>` and `/en/blog/<en-slug>`,
  duplicate content by construction. How a real crawler resolves two self-canonical addresses that name
  each other through `x-default` is unmeasurable from here, and the owner accepted that explicitly.
- **A third permanent public URL contract per article**, pinned by scrapers and indexed by search
  engines; retiring it later is not a revert.
- **A retired English slug's neutral address is not prerendered**, so an unfurler fetching it pins the
  home card while a human is redirected correctly — the pre-existing shape for prefixed retired slugs, now
  inherited by the advertised address class.
- **The neutral card is always English**, so a Portuguese reader's preview and arrival differ in language.
- **The prerendered route count grows by one per published article**, each with an OG lookup — the build
  cost [ADR-0005](./0005-og-coverage-every-public-url.md) anticipates.
- **Two live social posts still carry `/en/` links.** Changing a URL inside a published post is the
  owner's act, per post; none is obliged.

## Links
- **Implements** Issue [#162](https://github.com/tedeuxx/tadeumendonca-io/issues/162).
- **Absorbed by #456 (2026-11-22, the eleventh slice):** the routing and public-surfaces decision (formerly
  record 0010), the locale layer (0032), localized article slugs (0037) and the neutral share URL (0052);
  and folded the reversed pt-BR-only UI record (0011) into *The locale layer*. Each section above says
  where it came from and how to recover the original from git history; the decision index lists each
  number under *Records that left the library*.
- **Section added 2026-11-01** (Issue [#669](https://github.com/tedeuxx/tadeumendonca-io/issues/669),
  **`accepted` 2026-11-01**, the owner's own merge of
  [PR #803](https://github.com/tedeuxx/tadeumendonca-io/pull/803),
  [recorded on #669](https://github.com/tedeuxx/tadeumendonca-io/issues/669#issuecomment-6566368759)) —
  *The edge exposes a locale hint, never a locale decision*: the no-edge driver is narrowed to *the edge
  never resolves a locale*; a viewer-response function exposes a three-valued locale hint, and resolution
  stays client-side. Consumed by [#788](https://github.com/tedeuxx/tadeumendonca-io/issues/788).
- **Amended 2026-08-05** (Issue [#166](https://github.com/tedeuxx/tadeumendonca-io/issues/166)) — the
  "NOT dual localized slugs" clause is **reaffirmed, not revised**. Separates the two benefits argued
  under one name (language-pinning, shipped via the prefix · slug readability, delivered only by a pair),
  records the four openings that did not make that separation, and names the accepted cost that a static
  pair is booby-trapped rather than absent.
- **Amended by** Issue [#200](https://github.com/tedeuxx/tadeumendonca-io/issues/200) — x-default pointed at
  bare, unprefixed URLs the build does not prerender; five of six answered 200 with the home page's OG. The
  fix pins x-default to the prefixed English canonical for the static routes and adds the membership +
  own-canonical gates; the root, and since 2026-09-20 each article's neutral address, are the exceptions,
  each a prerendered document. Related: [ADR-0005](./0005-og-coverage-every-public-url.md) (OG pinned on
  first fetch), [ADR-0005, *Distribution to LinkedIn and X*](./0005-og-coverage-every-public-url.md#distribution-to-linkedin-and-x)'s
  2026-07-27 amendment (the same hazard, guarded at one consumer).
- **Amended by** Issue [#172](https://github.com/tedeuxx/tadeumendonca-io/issues/172) — a dismissible
  **offer** (never a redirect) proposes the visitor's locale, persisting through the same `locale` key as
  the toggle, with a second key (`locale-suggestion-dismissed`); see the 2026-08-02 amendments inline above
  for what dismissing writes. Exposed the general rule that **the prerender is not a visitor**.
- **Consistent with [ADR-0002](./0002-fully-static-spa-no-backend.md#content-and-og-resolved-at-build-time)** — per-locale prerender is more
  build-time render, still no SSR/edge; the client-side bare-root redirect is why no Accept-Language edge
  logic is needed.
- **Extends [ADR-0005](./0005-og-coverage-every-public-url.md)** — OG/SEO completeness now spans both locales
  + x-default; the route-count doubling is the accepted build cost ADR-0005 anticipates. Its section
  [*Distribution to LinkedIn and X*](./0005-og-coverage-every-public-url.md#distribution-to-linkedin-and-x)
  states the share convention the neutral address makes usable; its section
  [*Per-article OG cards*](./0005-og-coverage-every-public-url.md#per-article-og-cards) keys a card by the
  article key because the slug is per locale.
- **Consistent with [ADR-0024](./0024-profile-canonical-cv-cross-surface.md)** — English stays the canonical
  edition; x-default = English; the CV PDF still prints from the English edition (route string `/en/me`).
- **Touches the downloadable-CV decision** (now [ADR-0024](./0024-profile-canonical-cv-cross-surface.md)'s *The downloadable edition*; record 0034 until #456) — the CV-PDF source route string moves
  `/me` → `/en/me`; a matching one-line note was added to that record.
- **`iac/` untouched by the addressing** ([ADR-0013](./0013-s3-cloudfront-hosting.md)) — the URL-rewrite
  function is locale-agnostic and the prefixes are static object paths; the edge locale hint is the one
  function this capability added there.
- Driven through [ADR-0053](./0053-this-library-records-presence-and-site-architecture-one-document-per-capability.md#lean-by-design--the-keystone-every-record-is-read-through)
  (lean by design); the redirects and routes are guarded by E2E per
  [ADR-0003, *Complete functional regression*](./0003-trunk-based-single-environment.md#complete-functional-regression).
