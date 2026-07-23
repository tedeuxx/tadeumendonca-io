# 0023. Observability scoped to a static site

- **Status:** accepted
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Driven by:** [ADR-0002](./0002-fully-static-spa-no-backend.md)

## Context & problem
"Observability is part of done" — a change isn't finished until you can *see* it working where it runs.
But a static site (ADR-0002) has **no server** to emit logs, metrics or traces. So observability has to
be redefined for what a static site can actually produce, not borrowed from a backend playbook.

## Decision drivers
- ADR-0002: no server-side telemetry is possible — there is nothing running.
- Still need to confirm a deploy is healthy and see how the content is used.
- Low cost / no infra.

## Considered options
1. **Client + build observability** (chosen) — **Google Analytics** for usage/behavior; a **client-side
   error surface** for runtime JS errors; a **build/prerender smoke** (routes render, OG tags present in
   the served HTML) plus the **post-deploy E2E smoke** against the real CDN. *Trade-off:* everything is
   client- or build-side; there is no server view because there is no server.
2. **Backend telemetry (structured logs / metrics / tracing)** — *Why not:* there is no backend to emit
   them; this is the retired-platform playbook that no longer applies.
3. **Nothing** — *Why not:* then a broken deploy or a blank prerendered route ships unseen.

## Decision outcome
Chosen: **GA + client error surface + build/prerender smoke + post-deploy E2E smoke.** This is the
static-site instantiation of "observability is part of done" — it proves the site renders, its OG is in
the served HTML, and how it is used, all without a server.

## Consequences
**Good**
- Health and usage are visible with **nothing running** — matches the static, near-zero-cost model.
- The prerender smoke catches the specific failure a static SEO site fears: a route shipping blank OG.

**Bad / accepted costs**
- No server-side insight — because there is no server (not a gap, a property of ADR-0002).
- Analytics is client-side: ad-blockers and privacy tools mean usage numbers are a floor, not exact.

## Links
- Driven by ADR-0002 · the post-deploy smoke is the E2E run in the deploy workflow (ADR-0018 context) ·
  the prerender smoke guards ADR-0005's per-route OG coverage.
