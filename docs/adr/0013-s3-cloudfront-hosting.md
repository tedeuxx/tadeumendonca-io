# 0013. S3 + CloudFront hosting with a URL-rewrite function

- **Status:** accepted
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Driven by:** [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md), [ADR-0002](./0002-fully-static-spa-no-backend.md)

## Context & problem
A fully static site (ADR-0002) is a set of objects that need hosting with HTTPS, a global CDN, and
**clean URLs** — the prerendered routes live at `dist/<route>/index.html`, but visitors and crawlers
request `/cv`, `/portfolio`, `/blog/:slug` without the `/index.html` suffix. Something must map the
directory route to its prerendered file.

## Decision drivers
- ADR-0001: near-zero cost, own the AWS/Terraform engineering (the argument is the code).
- HTTPS + global edge caching for a content site meant to be shared.
- Clean URLs for the prerendered routes.

## Considered options
1. **S3 origin + CloudFront + a CloudFront Function** (chosen) — objects in S3; CloudFront
   (`PriceClass_100`, NA+EU edges, the cheapest tier) serves them over HTTPS; a viewer-request
   **CloudFront Function** (`spa_rewrite`) rewrites directory routes to their prerendered
   `index.html`. *Trade-off:* more to provision (distribution, function, cache headers, invalidation)
   than a managed host.
2. **S3 static website hosting alone** — *Why not:* no HTTPS, no CDN, no edge rewrite; not viable for a
   shared, SEO-facing site.
3. **A managed platform (Vercel/Netlify)** — simpler DX. *Why not:* a third-party runtime dependency and
   less control, and it forfeits the AWS/Terraform engineering that is part of the proof (ADR-0001).

## Decision outcome
Chosen: **S3 + CloudFront (`PriceClass_100`) + a viewer-request CloudFront Function** for clean URLs. A
CloudFront Function (not Lambda@Edge) does the rewrite — it is cheaper, runs at every edge, and is
sufficient for a pure string rewrite; the retired Lambda@Edge OG renderer (History) was the heavier tool
this replaces.

## Consequences
**Good**
- Cheap global CDN with HTTPS; scale-to-zero storage + edge cache.
- Clean URLs for every prerendered route via a tiny edge function.
- Full ownership in Terraform — the infra itself is part of the engineering argument.

**Bad / accepted costs**
- More to provision and operate than a managed host: the distribution, the function, split cache headers
  (immutable hashed assets vs no-cache `index.html`), and a **CloudFront invalidation on every deploy**.
- CloudFront config changes propagate slowly.

## Links
- Driven by ADR-0001, ADR-0002 · the deploy publishes to S3 + invalidates CloudFront (see the SDLC ADRs)
  · the CloudFront Function replaces the retired Lambda@Edge OG renderer (History index).
