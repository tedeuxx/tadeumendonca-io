# 0010. Client-side routing, landing/CV split, back-compat redirects

- **Status:** accepted
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Driven by:** [ADR-0002](./0002-fully-static-spa-no-backend.md), [ADR-0005](./0005-og-coverage-every-public-url.md)

## Context & problem
The SPA needs a routing model and an information architecture. Two specific decisions fall here: what
lives at `/` (the landing), and how URLs that existed under the previous design keep working when shared
links and `og:image` deep-links point at them.

## Decision drivers
- ADR-0002: client-side routing (no server to route); each real route is prerendered (ADR-0005).
- The strategic priority is content/portfolio *presence* — the home should sell the content, not the CV.
- Shared/indexed old URLs must not 404.

## Considered options
1. **react-router v6, landing/CV split, explicit back-compat redirects** (chosen) — `/` is a content-first
   **landing** (hero + articles + portfolio shortlist + contact); the **CV moves to `/cv`**; `/portfolio`
   and `/blog/:slug` are their own routes. Retired paths redirect: `/profile → /cv`, `/blog` and
   `/articles → /#artigos`, `/articles/:slug` still renders the article, and `*` → `/`. *Trade-off:*
   redirects are permanent maintenance — they can't be dropped without breaking shared links.
2. **CV at `/` (the previous design)** — *Why not:* the strategy leads with content/portfolio, not the
   personal CV; the home should be the shop window, with the CV one click away.
3. **No back-compat redirects** — *Why not:* every previously-shared or indexed deep-link would 404,
   destroying accumulated presence — the opposite of the goal.

## Decision outcome
Chosen: **react-router v6; `/` is the content landing, `/cv` is the CV; retired paths redirect.** The
redirects are a permanent contract with URLs already in the world.

## Consequences
**Good**
- The home sells the content/portfolio (the strategic priority); the CV is still one click away.
- Shared and indexed old URLs keep resolving — no lost presence.

**Bad / accepted costs**
- The redirect set is permanent maintenance and is itself covered by E2E journeys (so a routing change
  can't silently break a back-compat link).
- Client-side routing means the prerender must enumerate every real route (ADR-0005) — a missed route
  ships blank.

## Amendment (2026-07-23) — `/ramp-up`, a fourth public surface
`/ramp-up` joins `/`, `/cv` and `/portfolio` as a real route with a nav entry: the owner's plan for
moving into AI Engineering, published in the open — the reasoning, the roadmap, and the sources.

It is a **page, not an article**, and the distinction is deliberate. An article is dated, finished, and
sits in a feed; this is a living document that gets edited as the plan advances, so a `/blog/:slug`
entry would misrepresent it as a point-in-time piece and bury it in reverse-chronological order. It
earns a nav slot for the same reason `/portfolio` does: it is a standing part of the argument, not an
entry in a stream.

Its body is **markdown-in-repo** (`src/content/rampup.pt.md` · `rampup.en.md`) rendered through the shared `<Markdown>`,
which is what makes the surface cheap — it inherits the article pipeline, including the YouTube
click-to-load facade, so the page embeds video while still shipping **zero third-party frames until the
reader asks** (verified in the prerendered HTML, not only in tests).

Consistent with this ADR's accepted cost above: the route was added to `scripts/routes.mjs`, the single
enumeration both the prerender and the sitemap read, so it is snapshotted and advertised together or
not at all. The E2E canonical-route list was updated in the same slice — its drift guard caught the
omission, which is the guard working as designed.

**Bilingual, like everything else the reader reads.** The body is authored in both languages
(`rampup.pt.md` · `rampup.en.md`), so chrome and content are always in the same language.

Worth recording how this was decided, because the first draft got it wrong: it shipped English-only and
justified that by citing [ADR-0032](./0032-i18n-locale-layer-english-baseline.md). The citation did not
hold — ADR-0032's out-of-scope line is *"long-form **pt-BR** articles stay pt-BR"*, and the site's only
long-form piece is in Portuguese, so it deferred translating **pt→en**, the opposite direction, and
decided nothing about a new surface's authoring language. A new decision was being presented as an
inherited one, which is precisely the drift the ADR practice exists to catch. The owner then settled it
as policy — *everything in two languages* — and ADR-0032's deferral is superseded there.

## Amendment (2026-07-24) — the CV route is `/cv → /me`; the label is "Perfil / Profile"
The canonical CV/profile route is renamed **`/cv` → `/me`**, and the reader-facing nav label and document
title change from "CV" to **"Perfil" (pt) / "Profile" (en)**. This is the same decision this ADR already
owns — *what lives where, and how the old URL keeps working* — applied to the CV route itself, so it
belongs here, not in a new ADR.

**Why (positioning, the owner's call).** "CV" reads too marketing/recruiting for a reader-first
proof-of-engineering site; `/me` + "Profile / Perfil" is neutral and de-emphasizes the résumé framing.
**Only the framing and the route change** — the page's content (experience, education, certifications) is
untouched. This is a change to how the surface is *named and reached*, not to what it says.

**Back-compat, exactly the pattern this ADR established.** `/cv` **and** `/profile` now redirect to `/me`
via client-side `<Navigate … replace>` — the same mechanism the `/blog`·`/articles` redirects already use.
External links that are already in the world (LinkedIn, the email signature) keep resolving through the
redirect; the owner updates those to `/me` post-merge. Consistent with this ADR's accepted cost, the
redirects are **not** prerendered and **not** in the sitemap: `scripts/routes.mjs` — the single enumeration
both the prerender and sitemap read — lists **`/me`** as the real route and deliberately excludes the two
redirects. `/me` carries the canonical link + the `Person` JSON-LD that `/cv` used to.

**OG, unchanged for what is already shared.** Already-shared `/cv` cards are pinned by scrapers (frozen), so
they do not degrade — the old unfurl keeps working, it just points at a URL that now redirects. New shares
should use `/me`, which is the prerendered, canonical surface.

**Internal vocabulary vs. the reader-facing label — a deliberate split.** The page component is renamed
`CvPage → ProfilePage`, but the `CVSection` résumé-rendering component and the `cv.*` i18n section labels
are **left as-is**. "CV" is still the correct *internal* word for the machinery that renders a résumé; what
changed is the *label the reader sees*. Renaming the internal résumé vocabulary too would have been churn
without meaning — the decision is about reader framing, and it stops at the reader-facing boundary.

*Accepted cost:* two more permanent redirects to carry (`/cv`, `/profile` → `/me`), covered by the same E2E
back-compat journeys as the rest — so the redirect set is larger, but a routing change still cannot silently
break a shared link. The `/cv` references in the `/ramp-up` amendment above are left intact as the record of
what the route was when that amendment was written — supersede, never rewrite history.

## Amendment (2026-07-24) — pre-launch: the back-compat redirects are dropped (the premise didn't hold yet)
The redirect contract above rests on a premise stated as fact — *"URLs already in the world"* — that is
**not true yet**: the site is **pre-launch / not yet productive**. Nothing external points at `/cv`,
`/profile`, `/articles` or `/articles/:slug` — there are no shared or indexed deep-links, no scraper-pinned
OG cards for them, and the owner's LinkedIn links the **apex**, not `/cv`. Option 3 above ("no back-compat
redirects") was rejected because deep-links "would 404, destroying accumulated presence" — but pre-launch
there is no accumulated presence to protect. That rejection was right for a *launched* site and premature
for this one.

**Decision (owner, 2026-07-24):** drop the `/cv`, `/profile`, `/articles` and `/articles/:slug` redirects
now. Unmatched paths still fall through to the landing via `*`, so they do not dead-end (the surviving
"unknown path → landing" E2E test covers exactly this). The three E2E back-compat journeys that asserted
these specific redirects are removed — they tested behavior that no longer exists. **`/blog → /#artigos`
stays**: that is a live convenience for the current blog namespace, not back-compat for a retired path.

**This is a scope correction, not a reversal of the principle.** The back-compat *contract* still binds the
moment URLs enter the world. **Re-introduce it at launch:** before the site goes productive (first external
shares, OG scrapers, indexing), any path advertised externally must regain its redirect **and** its E2E
guard. Until then, carrying redirects for URLs that were never published is maintenance with no reader on
the other end. Supersedes the "permanent contract" framing in *Decision outcome* and the 2026-07-24
`/cv → /me` amendment's "two more permanent redirects" cost — **for the pre-launch window only.** History is
left intact (supersede, never rewrite): the prior amendments remain the record of what was decided when
URLs were expected imminently.

## Amendment (2026-07-25) — `/architecture`, a fifth public surface
`/architecture` joins `/`, `/me`, `/portfolio` and `/ramp-up` as a real route with a nav entry: a
reader-facing **blueprint of the site** — how it is built and how to replicate it from the public code.

It is a **page, not a landing section**, and the distinction is the same one `/ramp-up` earns. The
surface carries depth — a blueprint plus a "replicate it" guide — that a section folded into `/` could
not hold without burying it; it is a standing part of the argument (the site is the pitch, so *how the
site is built* is itself an exhibit), not a stripe on the landing.

Its body is **markdown-in-repo** (`content/architecture.pt.md` · `architecture.en.md`) rendered through
the shared `<Markdown>`, inheriting the same pipeline as the other content surfaces, so the route is
cheap and OG/prerender-complete like every other public URL (ADR-0005).

**One English slug, bilingual label and body — deliberately not a dual-slug pair.** The route is the
single slug `/architecture`, with a **bilingual nav label** ("Arquitetura" / "Architecture") and a
**bilingual body** authored in both languages (`architecture.pt.md` · `architecture.en.md`) under the
`Record<Locale, string>` compile-error contract and the same-links-same-order parity guard — so, as with
everything the reader reads, chrome and content are always in the same language. What was **not** chosen
is a dual `/arquitetura ↔ /architecture` localized-slug pair: the route enumeration here is
one-slug-per-route, and a dual-slug scheme would be a **new routing pattern** — a bigger decision than
adding a surface — so it is deferred, not adopted by default. Note this reaffirms the established
"everything the reader reads is in both languages" policy at the *body* level; it decides nothing about
localized *URLs*, which remains a separate, unmade decision.

> **Update (2026-07-26):** localized URL prefixes — the separate decision flagged here — are now made in
> [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md): **symmetric `/pt/…` · `/en/…` prefixes on the
> same English slug** (per-locale prerender + `hreflang` + OG-per-locale). Note the boundary ADR-0036 keeps:
> it adopts a *locale prefix on one slug*, **not** the dual localized-slug pair (`/pt/perfil ↔ /en/me`) this
> amendment set aside — that larger routing change stays deferred.
>
> **Update (2026-07-26):** the deferred **dual-slug** question is now **resolved for the blog surface** by
> [ADR-0037](./0037-localized-article-slugs.md): article routes (`/blog/:slug`) carry a **per-locale slug**
> (`/en/blog/my-commitment` ⇄ `/pt/blog/meu-compromisso`), with the filename key as the non-URL identity.
> Non-article routes (`/me`, `/portfolio`, `/architecture`, `/ramp-up`) still use the one-slug-prefixed-twice
> scheme of ADR-0036 — dual localized slugs there remain deferred.

Consistent with this ADR's accepted cost above: the route was added to `scripts/routes.mjs`, the single
enumeration both the prerender and the sitemap read, so it is snapshotted and advertised together or not
at all. The E2E canonical-route drift guard (`seo.spec.ts`) was updated in the same slice — the guard
working as designed.

**No back-compat redirect — nothing to preserve (pre-launch).** Consistent with this ADR's 2026-07-24
pre-launch amendment, no redirect is introduced: there is no `/arquitetura` (or any other) URL for this
surface in the world to keep resolving. If an alternate slug is ever advertised externally, revisit at
launch under that amendment's rule — a path that enters the world regains its redirect and its E2E guard.

**Orientation over restatement (ADR-0001).** The page is deliberately an *orientation layer*: it **links**
the ADR library, the two public repos, and `docs/catalog-ready.md` rather than re-stating them. The ADRs
are the single source of the architecture story; the page points at them, so it cannot drift from them —
if the reader wants the load-bearing "why", the link takes them to the record itself, not a paraphrase
that ages out of sync.

## Links
- Driven by ADR-0002, ADR-0005 · the redirects and routes are guarded by E2E (ADR-0019) · amended above
  for `/ramp-up`, within the same enumeration contract · amended (2026-07-24) for the `/cv → /me`
  rename + "Perfil / Profile" label, using this ADR's own redirect pattern · amended again (2026-07-24)
  to drop the back-compat redirects for the pre-launch window (premise "URLs already in the world" not yet
  true), to be re-introduced at launch · amended (2026-07-25) for `/architecture`, a fifth public surface
  (single English slug, bilingual label + body; orientation-over-restatement per ADR-0001; OG/prerender-
  complete per ADR-0005), within the same enumeration contract · the "localized URLs remain a separate,
  unmade decision" note in that amendment is **now made** in
  [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md) (symmetric `/pt` · `/en` prefixes on one slug;
  dual localized slugs still deferred).
