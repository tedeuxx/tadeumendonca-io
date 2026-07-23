# 0005. Every public URL is SEO- and OG-complete

- **Status:** accepted
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Supersedes / superseded by:** —
- **Driven by:** [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md), [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md)

## Context & problem
The site's strategic job is **presence** (ADR-0001) — content and portfolio meant to be *found* and
*shared*. **SEO (search crawlers) and OG (social unfurlers) are the same problem here:** both read the
**served HTML** and neither reliably runs JS, so both need complete meta in the HTML that ships. When a
site URL is dropped into LinkedIn/WhatsApp/Slack it must unfurl richly, and when a crawler indexes it, it
must see title/description/canonical/structured data — or the presence is wasted. A client-only SPA
serves both an empty shell. So the site must decide **how completely** it exposes SEO/OG meta for its own
URLs.

## Decision drivers
- Shareability *is* presence — a URL that unfurls well is the point (ADR-0001).
- Crawlers and unfurlers read the **served HTML** and do not reliably run JS.
- The mechanism to produce it already exists: build-time prerender (ADR-0004).

## Considered options
1. **Full coverage — every public route is OG/crawler-complete** (chosen) — each route is prerendered
   with per-route `og:title`/`description`, a canonical URL, a default OG image (`gen-og`), and JSON-LD
   `Person` on the CV. Any shared site URL unfurls richly. *Trade-off:* every public route must be
   prerendered, so build cost scales with the number of routes.
2. **Index-only OG (SPA default)** — meta only on `/`. *Why not:* every deep-linked article, the CV, and
   the portfolio would unfurl blank when shared — the common case for a content site — directly
   undercutting presence.
3. **Client-side meta injection only (react-helmet, no prerender)** — set tags in the browser. *Why not:*
   crawlers/unfurlers don't run JS reliably, so the tags aren't there when it counts.

## Decision outcome
Chosen: **full OG/crawler coverage on every public route**. This is the *policy* that ADR-0004's
build-time prerender exists to satisfy — the prerender must snapshot **every** public route (`/`, `/cv`,
`/portfolio`, each `/blog/:slug`) with complete meta in the served HTML. It is the inverse of the
external-link unfurl we gave up (ADR-0004): we cannot unfurl *other* people's URLs, but we make *ours*
maximally unfurlable.

## Consequences
**Good**
- Every shared site URL — article, CV, portfolio — produces a rich preview; presence carries.
- Crawler-complete HTML means the SEO story holds without a server.

**Bad / accepted costs**
- Every public route must be prerendered; build time and the prerender's coverage list grow with the
  route count (a missed route silently ships blank — the build/prerender smoke guards this).
- OG/meta values are build-frozen (inherited from ADR-0004).
- **Known SEO gap:** the site has **no `sitemap.xml` and no `robots.txt`** today. On-page SEO (meta,
  canonical, JSON-LD, crawler-readable HTML) is complete; crawl-directives and discovery aids are not.
  Marginal at ~5 routes, but a real gap — filed as a follow-up, not silently claimed as covered.

## Links
- Driven by ADR-0001 (presence) · implemented by ADR-0004 (build-time prerender) · guarded by the prerender-smoke check · open follow-up: `sitemap.xml` + `robots.txt`.
