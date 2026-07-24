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

Its body is **markdown-in-repo** (`src/content/rampup.md`) rendered through the shared `<Markdown>`,
which is what makes the surface cheap — it inherits the article pipeline, including the YouTube
click-to-load facade, so the page embeds video while still shipping **zero third-party frames until the
reader asks** (verified in the prerendered HTML, not only in tests).

Consistent with this ADR's accepted cost above: the route was added to `scripts/routes.mjs`, the single
enumeration both the prerender and the sitemap read, so it is snapshotted and advertised together or
not at all. The E2E canonical-route list was updated in the same slice — its drift guard caught the
omission, which is the guard working as designed.

**Authoring language: OPEN — the page ships English-only as an explicit, temporary exception.**
An earlier draft of this amendment justified that by citing
[ADR-0032](./0032-i18n-locale-layer-english-baseline.md). **That citation was wrong**, and it is
recorded here rather than quietly corrected: ADR-0032's out-of-scope line reads *"blog article i18n —
long-form **pt-BR** articles stay pt-BR"*, and the site's only long-form piece is written in
Portuguese. ADR-0032 therefore defers translating pt→en — the opposite direction — and decides
**nothing** about the authoring language of a new long-form surface. Presenting a new decision as an
inherited one is exactly the drift the ADR practice exists to prevent.

The honest statement of the current state: this page is authored in English while its **chrome
localizes**, which produces a real incoherence — a pt visitor is served a Portuguese `metaDescription`
promising the page, and lands on an English body. That runs against ADR-0032's own decision driver
(*"a pt-BR visitor should still get the site in their language"*) and against the bilingual-content
direction set when the CV was made bilingual (see the amendment on
[ADR-0024](./0024-profile-canonical-cv-cross-surface.md)).

It is shipped this way deliberately and with the cost named, not because a prior ADR authorized it.
Resolving it — translate the body, or drop the surface to English-only chrome and all — is an owner
decision, and it belongs with the article-parity slice where the same question is already open.

## Links
- Driven by ADR-0002, ADR-0005 · the redirects and routes are guarded by E2E (ADR-0019) · amended above
  for `/ramp-up`, within the same enumeration contract.
