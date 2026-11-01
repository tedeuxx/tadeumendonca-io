# 0023. Observability scoped to a static site

- **Status:** accepted
- **Capability:** `delivery-and-gates`
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
- **Amended 2026-07-29 (#237):** post-deploy assertion is no longer *only* the deploy workflow's smoke.
  `infra-apply` now carries the edge-rewrite assertion (`e2e/edge-rewrite.spec.ts`, #216), because it is
  the workflow that changes the CloudFront Function — `deploy` is path-filtered to `apps/fed` and never
  fired on that change, and asserting from `deploy` would race the apply. The general form: **a
  post-deploy assertion belongs to the workflow that performs the change it observes**, not to whichever
  workflow already had a browser.

## Amendment, 2026-11-01 (#640) — the site now publishes a description of its own telemetry

This record scoped observability to what a static site can produce **for its owner**: usage, client
errors, a render smoke. It said nothing about publishing any of it, because nothing was published. Since
[ADR-0054](./0054-analytics-schema-page-derived-from-the-emitting-code-off-the-menu.md), `/analytics`
describes the GA4 half to readers, in both editions: each event the browser emits, its parameters, and
what it can and cannot establish. The decision, its rejected options (a page of GA4 figures among them)
and its costs are recorded there; this amendment only points at it.

**Nothing decided above changes**: the same things are observed, with the same tools. Two consequences
for this record:

- **The analytics half now has a public reader.** What it observes is described outside the repository,
  so a change to the event schema is also a change to a published page. The fidelity test that holds
  the two together covers event and parameter **names** only; the page's prose is held by review.
- **The accepted cost *"usage numbers are a floor, not exact"* is now a published claim**, and its cause
  is wider than this record states. Ad-blockers and privacy tools are one half; the hard consent gate of
  [ADR-0033](./0033-ga4-consent-gated-analytics.md) is the other, and it is the one the page names: a
  reader who declines is never counted.
