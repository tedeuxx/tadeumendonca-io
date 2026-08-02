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
  is *authoritative* (LinkedIn, `/cv.pdf`, the exported `profile` constant), independent of which edition
  a given visitor is served. x-default resolves to English. *(This named the Canva CV until #234 — it was
  retired 2026-07-28, ADR-0024's amendment.)*
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

## Amendment (2026-07-27) — x-default is the **prefixed English canonical** everywhere but the root; a URL may be advertised only if the build prerenders it
**The invariant, stated generally because it is the durable part of this amendment:**

> **A URL may be advertised — in `hreflang`, in the sitemap — only if the build prerenders it.**

The route module already guaranteed that for the `pt` and `en` alternates: they are generated from the same
`localizedRoutes()` enumeration the prerender consumes, so they cannot drift. **x-default was the one place
the invariant did not hold**, and it broke.

**What changed.** `hreflang="x-default"` now points at the **prefixed English canonical** for every route —
`/en/me`, `/en/portfolio`, `/en/ramp-up`, `/en/architecture`, `/en/blog/<en-slug>` — instead of the bare,
unprefixed path. **The root keeps its bare x-default** (`https://tadeumendonca.io/`), because the bare origin
is the one unprefixed URL the prerender genuinely snapshots (`dist/index.html`, the bare-root English snapshot
this ADR already decided). Changed in **both** implementations, which are duplicated by construction:
`apps/fed/scripts/routes.mjs` (feeds sitemap + prerender) and `apps/fed/src/hooks/useDocumentHead.ts`
(runtime `<link>` tags).

**Why the decision above left room for the bug.** This ADR fixed the **semantics** of x-default (*x-default =
English*) and, for the root, its target (*→ the English root*). It never stated the **form** x-default takes
for a non-root route. The implementation chose the bare path, and that looked entirely reasonable given this
ADR's own client-side redirect clause: an unprefixed path auto-detects and redirects, so a *human* landing on
`/me` does arrive in their locale. The gap is that a **scraper does not run the redirect** — and only
`localizedRoutes()` targets plus the bare root are prerendered, while `iac/frontend.tf` maps 403/404 to
`/index.html` with response code **200**. Measured with JS disabled against a real `build:static` + preview:
**five of the six advertised x-default URLs answered 200 carrying the HOME page's meta** (`og:title` =
`tadeumendonca.io`, canonical = `https://tadeumendonca.io/en`). Only `/` was correct — because it genuinely is
the home page. Per [ADR-0005](./0005-og-coverage-every-public-url.md) a scraper **pins** that card
permanently, and CLAUDE.md names OG pinning the least reversible thing in this repo. A soft-404 that answers
200 is worse than a 404: nothing fails, it just publishes the wrong page under five addresses.
[ADR-0038](./0038-content-distribution-linkedin-and-x.md)'s 2026-07-27 amendment had already named this
hazard for the article case, and made the draft generator refuse any URL absent from the prerendered list;
this amendment fixes the source rather than the one consumer that guarded against it.

**Option considered and rejected: prerender the bare URLs instead.** This is the more interesting half of the
decision. Emitting a bare snapshot for every route would satisfy the invariant literally and keep the "clean"
locale-neutral URL advertised. *Why not:* it fixes the scraper and **leaves the Portuguese reader in a dead
end.** The bare-path redirect preserves the sub-path, and article slugs are **per-locale**
([ADR-0037](./0037-localized-article-slugs.md)) — so a pt-BR reader following the advertised
`/blog/my-commitment` is redirected to `/pt/blog/my-commitment`, a route that does not exist, and falls
through to the blog listing. Measured: headings `["Blog"]` for pt-BR versus `["Blog", "My Commitment", …]`
for en-US. Prerendering the bare URL would have made that failure *quieter*, not gone. Pointing x-default at
the prefixed English canonical fixes both readers at once: the scraper reads the real English page, and the
pt-BR reader is never handed a path that cannot resolve in their locale.

**Trade-off (accepted).** x-default **no longer advertises a locale-neutral entry point for sub-paths** — it
names the English edition explicitly. That is standard hreflang practice, and it is what
[ADR-0024](./0024-profile-canonical-cv-cross-surface.md)'s English-canonical decision already implies; but it
does mean the clean unprefixed URL is no longer surfaced to crawlers for anything but the root.

**What this costs a reader, stated rather than glossed.** The redirect clause is untouched, so a bare path
a reader *types or is sent* still auto-detects. But the **advertised** address changed, and for the four
static routes the old bare URL auto-detected *correctly* — a pt-BR reader following `/me` was redirected to
`/pt/me`. Following the new advertised `/en/me` they get English and stay there, because an explicit locale
prefix wins in `detectLocale`. So for `/me`, `/portfolio`, `/ramp-up`, `/architecture` this is a **downgrade
for the pt-BR reader**, traded for OG cards that are correct. For **articles** it is strictly better: the old
bare URL did not merely lose their locale, it dead-ended them on a route that does not exist.

The trade is defensible — a search engine serves the `pt` alternate to a pt reader rather than x-default, and
the front door (bare root) still auto-detects — but it is a real change in what a reader gets, not a
no-op, and the owner ratified it as such.

**Not fixed here, only un-advertised.** The bare-article dead end still exists for any URL already indexed or
already shared. This amendment stops publishing it; it does not make it resolve. Tracked as issue #204
(make the locale redirect slug-aware) — independent of this decision, since a bare URL would remain
un-prerendered and therefore still wrong for a scraper even once it resolves for a human.

> **Addendum (2026-07-27) — the deferral above is discharged.** Issue #204 shipped: the unprefixed redirect
> now maps the article slug to the reader's locale (`articlePathForLocale`), so a bare `/blog/<slug>` reaches
> the article in **both** editions instead of dead-ending a pt-BR reader on a route that does not exist.
>
> **The decision this amendment records is unchanged.** Resolving is not advertising: the bare URL is still
> **not prerendered**, so it still answers a scraper with the home page's OG card, and it must **not** be
> re-added to hreflang or the sitemap. The invariant stands as written — *a URL may be advertised only if the
> build prerenders it*. What changed is that the bare form now works for a **human** who was sent one; it did
> not become an address the site publishes.

**Clarification to [ADR-0037](./0037-localized-article-slugs.md).** Its line *"x-default = the English slug"*
is now unambiguous: the **prefixed** English slug, `/en/blog/<en-slug>`. Nothing about per-locale article
slugs changes.

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
[ADR-0004](./0004-build-time-render-not-ssr-or-edge.md)'s build-time-render mechanism for one component's sake.
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
[ADR-0004](./0004-build-time-render-not-ssr-or-edge.md)'s no-edge invariant holds.

## Links
- **Implements** Issue [#162](https://github.com/tedeuxx/tadeumendonca-io/issues/162).
- **Amended by** Issue [#200](https://github.com/tedeuxx/tadeumendonca-io/issues/200) — x-default pointed at
  bare, unprefixed URLs the build does not prerender; five of six answered 200 with the home page's OG. The
  fix pins x-default to the prefixed English canonical (root excepted) and adds the membership + own-canonical
  gates. Related: [ADR-0005](./0005-og-coverage-every-public-url.md) (OG pinned on first fetch),
  [ADR-0037](./0037-localized-article-slugs.md) (per-locale article slugs — the pt-BR dead end),
  [ADR-0038](./0038-content-distribution-linkedin-and-x.md)'s 2026-07-27 amendment (the same hazard, guarded
  at one consumer).
- **Amended by** Issue [#172](https://github.com/tedeuxx/tadeumendonca-io/issues/172) — the authoritative path
  left a reader no in-page way to their own edition; a dismissible **offer** (never a redirect) now proposes
  the visitor's locale, persisting through the same `locale` key as the toggle, with a second key
  (`locale-suggestion-dismissed`) recording only a decline — ~~only~~ *see the 2026-08-02 amendment inline
  above: dismissing writes `locale` too, because the button states a preference rather than declining one.*
  Exposed the general rule that **the prerender is
  not a visitor** — `window.__PRERENDER__`, not a post-mount flag, is what keeps visitor-dependent rendering
  out of the shipped HTML. Consistent with
  [ADR-0032](./0032-i18n-locale-layer-english-baseline.md) (the persisted toggle overriding detection) and
  [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md) (still no edge negotiation).
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
