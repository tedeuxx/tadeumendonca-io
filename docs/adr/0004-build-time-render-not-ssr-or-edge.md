# 0004. Content and OG resolved at build time — not SSR or edge

- **Status:** accepted
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Supersedes / superseded by:** supersedes the Lambda@Edge OG renderer and the backend link-unfurl feature (recorded in the History index)
- **Driven by:** [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md), [ADR-0002](./0002-fully-static-spa-no-backend.md)

## Context & problem
A static SPA (ADR-0002) renders in the browser, so a bot or a link-unfurler that reads only the raw HTML
sees an empty shell — bad for SEO/OG. And the markdown content itself has to reach the page somehow. The
real fork is **where the content and its OG are resolved**: at **build time** (compiled in and
prerendered), or at **request time** (the markdown lives as objects in the bucket and is fetched live,
with OG injected per request). That second path is precisely what would make an edge/SSR runtime
necessary again — and this ADR settles which side we are on.

## Decision drivers
- ADR-0001/0002: no server, near-zero cost — request-time compute is exactly what was cut.
- SEO/OG only needs the tags to be *in the served HTML*, not freshly computed per request.
- A personal blog publishes at low cadence — instant, no-rebuild publishing is not a requirement.

## Considered options
1. **Build time — compile the markdown in and prerender** (chosen) — Vite bundles every `.md`
   (`import.meta.glob(..., { eager: true })`) at build; a Playwright pass snapshots each route to static
   `dist/<route>/index.html` with meta/OG inlined. Nothing runs at request time. *Trade-off:* publishing
   a new article is a **rebuild + redeploy** (a commit → merge → build → deploy), not a file drop.
2. **Runtime — markdown from the bucket, OG at the edge** — keep the `.md` as S3 objects fetched live
   (by the client, or by an edge function), and inject OG per request at **Lambda@Edge**. Publishing
   becomes "drop a file in the bucket", no rebuild. *Why not:* reintroduces **edge compute** (for OG and
   for unfurling) and its cost/ops — the exact request-time runtime ADR-0001/0002 removed — to buy a
   no-rebuild publish cadence the site does not need.

## Decision outcome
Chosen: **build time**. The markdown is compiled into the bundle and each route is prerendered to static
HTML; content and OG are resolved before anything is served. This is why **the site needs no Lambda@Edge
today** — the only thing that would bring edge back is choosing the runtime-from-bucket path (option 2),
which is the documented evolution route if a no-rebuild content cadence ever becomes worth its cost.

**The trade-off, made concrete by link unfurl:** unfurling an *arbitrary external* link needs a
request-time fetch of that link's remote OG — a server the site does not have. So the backend
link-preview feature was retired (History index); what survives is a **client-side embed for known providers**
(a YouTube URL in an article becomes a `VideoEmbed` facade by URL pattern — no server, no remote fetch).
The site's *own* pages get rich, prerendered OG; *external* links do not, deliberately.

## Consequences
**Good**
- SEO/OG in the served HTML with **nothing running** — the static, near-zero-cost story holds end to end,
  and no Lambda@Edge is needed.
- The prerender is a normal build step; the deploy stays a sync + invalidation.

**Bad / accepted costs**
- **Publishing an article is a rebuild + redeploy**, not a bucket drop — the accepted cost of compiling
  content in (fine for a low-cadence, content-as-code blog).
- OG/content are frozen at build — no per-request, per-viewer, or freshly-fetched-data OG.
- No request-time unfurl of external links; in-article rich media degrades to client-side embeds for a
  known-provider allowlist (YouTube today).
- The build owns a headless-browser prerender step (Playwright), a build-time dependency and cost.

## Links
- Driven by ADR-0001, ADR-0002 · supersedes the Lambda@Edge OG renderer and the backend link-unfurl feature
  · the surviving in-article embed is client-side (`VideoEmbed`).
