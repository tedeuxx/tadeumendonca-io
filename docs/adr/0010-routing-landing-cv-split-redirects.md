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

## Links
- Driven by ADR-0002, ADR-0005 · the redirects and routes are guarded by E2E (ADR-0019) · amended above
  for `/ramp-up`, within the same enumeration contract · amended again (2026-07-24) for the `/cv → /me`
  rename + "Perfil / Profile" label, using this ADR's own redirect pattern.
