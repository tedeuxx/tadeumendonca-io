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

## Links
- Driven by ADR-0002, ADR-0005 · the redirects and routes are guarded by E2E (ADR-0019).
