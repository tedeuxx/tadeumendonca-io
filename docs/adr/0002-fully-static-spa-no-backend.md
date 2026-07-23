# 0002. Fully static SPA, no backend

- **Status:** accepted
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Supersedes / superseded by:** supersedes the backend-era architecture (recorded in the History index)
- **Driven by:** [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)

## Context & problem
Applying ADR-0001 (lean by design) to the concrete stack: what does the site actually *need* a server
for? The content (CV, articles, catalog) is authored by one person and changes rarely. There is no user
data, no session, no per-request logic — nothing a visitor sends back. The earlier BFF existed to serve
a dynamic, authenticated, backend-ful product that the strategy no longer pursues.

## Decision drivers
- ADR-0001: cut anything the content/portfolio presence doesn't require.
- The content is inherently static and lives in the repo.
- SEO/OG needs the meta tags in the served HTML (a bot concern), not a running renderer.

## Considered options
1. **Fully static SPA — no API, auth, or database** (chosen) — React/Vite bundle + content, served as
   static objects. *Trade-off:* no server-side capability at all; dynamic features would need new infra.
2. **Keep a thin BFF for OG/SEO and future dynamic bits** — *Why not:* re-introduces always-on compute
   and its cost/ops for a problem solvable at build time (see ADR-0004, prerender). Contradicts ADR-0001.

## Decision outcome
Chosen: **fully static**. No backend — no API, no database, no auth, no server-side rendering at runtime.
The SPA renders client-side; SEO/OG is solved at **build time** (ADR-0004). This is the single largest
application of ADR-0001 and the reason the whole backend tier (BFF, DynamoDB, Cognito, SES, Lambda@Edge)
was retired.

## Consequences
**Good**
- Nothing to run: the site is static objects on a CDN, scale-to-zero, near-zero cost, minimal attack
  surface (no server, no auth).
- Simplest possible operational story — deploy is a sync + invalidation.

**Bad / accepted costs**
- Zero server-side capability. Auth, dynamic/user data, an API, or server telemetry require re-adding
  infrastructure (per ADR-0001's gradual-evolution path).
- Some SEO/interaction concerns move to build time or the client, constraining how they're solved
  (ADR-0004, ADR-0020).

## Links
- Driven by ADR-0001 · enabled by ADR-0004 (build-time prerender for OG/SEO) · supersedes the backend-era architecture (History index)
  (the backend-era architecture).
