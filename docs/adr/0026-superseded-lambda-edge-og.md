# 0026. Lambda@Edge OG renderer

- **Status:** superseded by [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md) (2026-07)
- **Date:** decided ~2026-06 · superseded 2026-07-22
- **Deciders:** the owner

## Context & problem (as it stood then)
A client-rendered SPA serves crawlers an empty shell. To put OG/meta into the served HTML, the platform ran
a **Lambda@Edge** function that rendered OG per request at the CloudFront edge.

## Why it was decided (then)
With a backend/edge tier already in place (ADR-0025), computing OG at the edge per request was a natural,
dynamic solution — it could reflect request-time state.

## Why it was superseded
Going fully static (ADR-0002) removed the edge tier, and the OG requirement is satisfiable **at build
time** (ADR-0004): prerender each route to static HTML with OG inlined. Edge compute is still request-time
compute to fund and operate; build-time prerender delivers the same served HTML with nothing running.

## Consequences of the reversal
- No request-time compute for OG; the static/near-zero-cost story holds (ADR-0004).
- Lost: request-time/dynamic OG. Accepted — the site's OG is static content, fine to freeze at build.

## Links
- Superseded by ADR-0004 · the URL-rewrite that remains is a lightweight CloudFront Function (ADR-0013),
  not Lambda@Edge.
