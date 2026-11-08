# 0036. Language is addressable — symmetric per-locale URL prefixes, per-locale prerender, hreflang + OG-per-locale

- **Status:** accepted
- **Capability:** `locale-and-routing`
- **Date:** 2026-07-26
- **Deciders:** the owner
- **Supersedes / superseded by:** — (completes and retires interim clauses of [ADR-0032](./0032-i18n-locale-layer-english-baseline.md); resolves [ADR-0010](./0010-routing-landing-cv-split-redirects.md)'s deferred "localized URL prefixes" question)
- **Driven by:** Issue [#162](https://github.com/tedeuxx/tadeumendonca-io/issues/162), and consistent-with [ADR-0002](./0002-fully-static-spa-no-backend.md#content-and-og-resolved-at-build-time), [ADR-0005](./0005-og-coverage-every-public-url.md), [ADR-0024](./0024-profile-canonical-cv-cross-surface.md), [ADR-0032](./0032-i18n-locale-layer-english-baseline.md) (and the downloadable-CV decision, record 0034 until #456 absorbed it into ADR-0024)

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
  [ADR-0032](./0032-i18n-locale-layer-english-baseline.md)): canonicality is a statement about which edition
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
  (`navigator.language` → `pt`/`en`, honoring the persisted toggle, fallback `en` per ADR-0032; since #661
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
  the discovery half [ADR-0032](./0032-i18n-locale-layer-english-baseline.md) deferred. A shared pt-BR URL
  unfurls in pt-BR.
- **The OG/SEO-completeness contract ([ADR-0005](./0005-og-coverage-every-public-url.md)) now holds across
  both locales + x-default**, with correct `hreflang` telling search engines the editions are the same page
  in two languages (no duplicate-content penalty; the right edition surfaces per searcher).
- **The static, no-edge story is intact** ([ADR-0002](./0002-fully-static-spa-no-backend.md#content-and-og-resolved-at-build-time)) — locale
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

**What changed.** ~~`hreflang="x-default"` now points at the **prefixed English canonical** for every route —
`/en/me`, `/en/portfolio`, `/en/ramp-up`, `/en/architecture`, `/en/blog/<en-slug>` — instead of the bare,
unprefixed path.~~ **→ the ARTICLE half of that enumeration is struck 2026-09-20 by
[ADR-0052](./0052-neutral-self-canonical-share-url-per-article.md) (issue #660); the four static routes are
untouched.** Struck rather than rewritten because this is the clause a reader takes the rule from, and it is
the clause that stopped being true. **The four static routes — `/en/me`, `/en/portfolio`, `/en/ramp-up`,
`/en/architecture` — still take the prefixed English canonical as x-default**, and this amendment's trade for
them is unchanged and still paid. **An ARTICLE's x-default is now the neutral, unprefixed `/blog/<en-slug>`.**
That is not the invariant being traded away, it is the invariant being *satisfied*: ADR-0052 makes the bare
article URL a snapshotted, self-canonical document, so it may be advertised **because** the build prerenders
it. **The root keeps its bare x-default** (`https://tadeumendonca.io/`), because the bare origin
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
[ADR-0005, *Distribution to LinkedIn and X*](./0005-og-coverage-every-public-url.md#distribution-to-linkedin-and-x)'s 2026-07-27 amendment had already named this
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

> **The rejection above was TAKEN for articles on 2026-09-20 — and its stated reason was discharged first,
> not overruled** ([ADR-0052](./0052-neutral-self-canonical-share-url-per-article.md), issue #660). Both halves
> of *"leaves the Portuguese reader in a dead end"* are gone: issue #204 made the unprefixed redirect
> slug-aware (`articlePathForLocale`), so the bare path resolves in **both** editions, and ADR-0052 keys the
> neutral address on the **current English slug** so there is a single string to snapshot. What that record
> chose is narrower than the option rejected here — **one neutral URL per ARTICLE, not a bare snapshot for
> every route** — so the four static routes still sit under the rejection as written. Read this paragraph as
> correct about the world it was written in, and as the reason ADR-0052 had to say what changed about that
> world before it could take the option.

**Trade-off (accepted).** ~~x-default **no longer advertises a locale-neutral entry point for sub-paths** — it
names the English edition explicitly. That is standard hreflang practice, and it is what
[ADR-0024](./0024-profile-canonical-cv-cross-surface.md)'s English-canonical decision already implies; but it
does mean the clean unprefixed URL is no longer surfaced to crawlers for anything but the root.~~
**→ the accepted cost is DISCHARGED for articles 2026-09-20 by
[ADR-0052](./0052-neutral-self-canonical-share-url-per-article.md) (issue #660)** — an article does advertise
a locale-neutral entry point again, and it is the address every social post carries. **It is still paid in
full by the four static routes**, which advertise the prefixed English canonical and nothing bare. The
English-canonical implication from ADR-0024 is untouched either way: the neutral article snapshot is served
in English.

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
> ~~**The decision this amendment records is unchanged.** Resolving is not advertising: the bare URL is still
> **not prerendered**, so it still answers a scraper with the home page's OG card, and it must **not** be
> re-added to hreflang or the sitemap. The invariant stands as written — *a URL may be advertised only if the
> build prerenders it*. What changed is that the bare form now works for a **human** who was sent one; it did
> not become an address the site publishes.~~
>
> **→ struck 2026-09-20 for ARTICLES by [ADR-0052](./0052-neutral-self-canonical-share-url-per-article.md)
> (issue #660), and this is the clause that most needed striking** — it is the one other documents quote as
> *"must not be re-added to hreflang or the sitemap"*, and it is now false of the article class. The bare
> article URL **is** prerendered, **is** in the sitemap, and **is** the advertised x-default. **The invariant
> itself did not move and is not weakened** — *a URL may be advertised only if the build prerenders it* is
> exactly what ADR-0052 satisfies, by making the address a document rather than by loosening the rule. For
> the four static routes this paragraph stands verbatim: `/me`, `/portfolio`, `/ramp-up`, `/architecture`
> resolve for a human, are still un-prerendered, and must still never be advertised.

**Clarification to [ADR-0037](./0037-localized-article-slugs.md).** Its line *"x-default = the English slug"*
~~is now unambiguous: the **prefixed** English slug, `/en/blog/<en-slug>`~~ **→ struck 2026-09-20 by
[ADR-0052](./0052-neutral-self-canonical-share-url-per-article.md) (issue #660): it is the **unprefixed**
English slug, `/blog/<en-slug>`.** Nothing about per-locale article slugs changes — the neutral address is
keyed on the current English slug, which is the same string ADR-0037 already governs.

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

1. [ADR-0010](./0010-routing-landing-cv-split-redirects.md)'s 2026-07-25 `/architecture` amendment —
   *"a new routing pattern — a bigger decision than adding a surface."*
2. This ADR's decision outcome — *"**NOT dual localized slugs.** … it is **not** decided here."*
3. [ADR-0037](./0037-localized-article-slugs.md)'s blog-only carve-out — *"non-article routes keep the
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

**Note where the record is deliberately not repeating itself.** ADR-0010 already recorded the dual-slug
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
[ADR-0052](./0052-neutral-self-canonical-share-url-per-article.md) rejected an edge redirect for that
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
  advertised URL ([ADR-0052](./0052-neutral-self-canonical-share-url-per-article.md)'s rejected edge
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

## Links
- **Implements** Issue [#162](https://github.com/tedeuxx/tadeumendonca-io/issues/162).
- **Section added 2026-11-01** (Issue [#669](https://github.com/tedeuxx/tadeumendonca-io/issues/669),
  ~~`proposed` until the owner ratifies [PR #803](https://github.com/tedeuxx/tadeumendonca-io/pull/803)~~
  **`accepted` 2026-11-01**, the owner's own merge of PR #803, [recorded on #669](https://github.com/tedeuxx/tadeumendonca-io/issues/669#issuecomment-6566368759)) —
  *The edge exposes a locale hint, never a locale decision*: the no-edge driver is narrowed to *the edge
  never resolves a locale*; a viewer-response function exposes a three-valued locale hint, and resolution
  stays client-side. Consumed by [#788](https://github.com/tedeuxx/tadeumendonca-io/issues/788).
- **Amended 2026-08-05** (Issue [#166](https://github.com/tedeuxx/tadeumendonca-io/issues/166)) — the
  "NOT dual localized slugs" clause is **reaffirmed, not revised**. Separates the two benefits argued
  under one name (language-pinning, shipped here via the prefix · slug readability, delivered only by a
  pair), records the four openings that did not make that separation, and names the accepted cost that a
  static pair is booby-trapped rather than absent. Related:
  [ADR-0010](./0010-routing-landing-cv-split-redirects.md) (whose per-surface rejection did not hold),
  [ADR-0037](./0037-localized-article-slugs.md) (the pair, for the blog only, where the readability
  benefit was weighed and accepted on its own merits).
- **Amended by** Issue [#200](https://github.com/tedeuxx/tadeumendonca-io/issues/200) — x-default pointed at
  bare, unprefixed URLs the build does not prerender; five of six answered 200 with the home page's OG. The
  fix pins x-default to the prefixed English canonical (root excepted) and adds the membership + own-canonical
  gates. Related: [ADR-0005](./0005-og-coverage-every-public-url.md) (OG pinned on first fetch),
  [ADR-0037](./0037-localized-article-slugs.md) (per-locale article slugs — the pt-BR dead end),
  [ADR-0005, *Distribution to LinkedIn and X*](./0005-og-coverage-every-public-url.md#distribution-to-linkedin-and-x)'s 2026-07-27 amendment (the same hazard, guarded
  at one consumer). **Read *"root excepted"* as *"root and articles excepted"* since 2026-09-20 —
  [ADR-0052](./0052-neutral-self-canonical-share-url-per-article.md) (issue #660) moves an article's
  x-default to the neutral `/blog/<en-slug>` by making that URL a prerendered document, so #200's membership
  gate is satisfied rather than relaxed.**
- **Amended by** Issue [#172](https://github.com/tedeuxx/tadeumendonca-io/issues/172) — the authoritative path
  left a reader no in-page way to their own edition; a dismissible **offer** (never a redirect) now proposes
  the visitor's locale, persisting through the same `locale` key as the toggle, with a second key
  (`locale-suggestion-dismissed`) recording only a decline — ~~only~~ *see the 2026-08-02 amendment inline
  above: dismissing writes `locale` too, because the button states a preference rather than declining one.*
  Exposed the general rule that **the prerender is
  not a visitor** — `window.__PRERENDER__`, not a post-mount flag, is what keeps visitor-dependent rendering
  out of the shipped HTML. Consistent with
  [ADR-0032](./0032-i18n-locale-layer-english-baseline.md) (the persisted toggle overriding detection) and
  [ADR-0002](./0002-fully-static-spa-no-backend.md#content-and-og-resolved-at-build-time) (still no edge negotiation).
- **Completes [ADR-0032](./0032-i18n-locale-layer-english-baseline.md)'s deferred Slice 2** — retires that
  ADR's "prerender baseline pinned to English" clause and its "single-locale-prerender accepted cost." Not a
  reversal: Slice 2 was always the named successor to the interim English-pinned baseline.
- **Resolves the deferred question in [ADR-0010](./0010-routing-landing-cv-split-redirects.md)** — its
  2026-07-25 amendment left "localized URL prefixes… a separate, unmade decision"; that decision is made here
  (prefixes yes, dual-slugs still deferred). ADR-0010 is amended with a forward-link to this ADR.
- **Consistent with [ADR-0002](./0002-fully-static-spa-no-backend.md#content-and-og-resolved-at-build-time)** — per-locale prerender is more
  build-time render, still no SSR/edge; the client-side bare-root redirect is why no Accept-Language edge
  logic is needed.
- **Extends [ADR-0005](./0005-og-coverage-every-public-url.md)** — OG/SEO completeness now spans both locales
  + x-default; the route-count doubling is the accepted build cost ADR-0005 anticipates.
- **Consistent with [ADR-0024](./0024-profile-canonical-cv-cross-surface.md)** — English stays the canonical
  edition; x-default = English; the CV PDF still prints from the English edition (route string `/en/me`).
- **Touches the downloadable-CV decision** (now [ADR-0024](./0024-profile-canonical-cv-cross-surface.md)'s *The downloadable edition*; record 0034 until #456) — the CV-PDF source route string moves
  `/me` → `/en/me`; a matching one-line note was added to that record.
- **`iac/` untouched** ([ADR-0013](./0013-s3-cloudfront-hosting.md)) — the CloudFront Function is
  locale-agnostic; the prefixes are static object paths.
