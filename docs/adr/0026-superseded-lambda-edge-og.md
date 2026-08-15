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

## Amendment, 2026-08-15 — `:18`'s "with nothing running" is scoped by this document, and it travelled without the scope

`:18` reads *"build-time prerender delivers the same served HTML with nothing running."* **In place it
is true and it is not corrected here**, because it is scoped twice inside its own document: by `:21`
(*"No request-time compute **for OG**"*) and by `:25` (*"the URL-rewrite that remains is a lightweight
CloudFront Function (ADR-0013)"*). Nothing about this record's reasoning changes.

**What happened is that the clause was quoted onto a surface that carries neither qualifier.**
`/architecture:184` lifted it, where it read as a claim about request-time compute in general — which
is false, since the `spa-rewrite` CloudFront Function runs on every request for a page. The page was
corrected in [#452](https://github.com/tedeuxx/tadeumendonca-io/pull/452); this note exists because
`/architecture:186` points a reader straight at **this file**, so a reader following the page's own
citation would otherwise land on the bare clause with the scope four and eight lines away.

**The scoped statement lives in one place, not two:** ADR-0004's 2026-08-15 amendment — *build-time
prerender removed request-time **rendering**, not request-time **compute***. This record points there
rather than repeating it, because ADR-0004 is the live record that holds the decision and this one is
superseded.
