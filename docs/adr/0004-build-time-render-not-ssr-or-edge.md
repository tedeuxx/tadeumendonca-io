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

## Amendment, 2026-08-15 — what was removed is request-time RENDERING, not request-time COMPUTE

**The scoped statement, written once so it can be quoted without its context:** build-time prerender
removed request-time **rendering**. It did not remove request-time **compute**. A CloudFront Function
runs on **every request for a page**.

This record carries the unscoped form twice, and the two are not equally defensible:

- `:47` — *"SEO/OG in the served HTML with **nothing running**"* — is scoped on the next line by `:48`
  (*"and no Lambda@Edge is needed"*). Read in place it is true, and the reader who reads the bullet to
  its end is not misled.
- `:25` — *"Nothing runs at request time."* — inside the chosen option's description, is scoped by
  **nothing**. Read whole, it is the one clause in this document that is inaccurate rather than merely
  quotable-out-of-context.

**What actually runs, checked rather than asserted:** `iac/cloudfront-functions/spa-rewrite.js` is a
ten-line viewer-request CloudFront Function — `iac/frontend.tf`'s
`resource "aws_cloudfront_function" "spa_rewrite"`, whose `code` is
`file("${path.module}/cloudfront-functions/spa-rewrite.js")` — attached to the default cache behavior
by the same file's `default_cache_behavior`, whose `function_association` block carries a
`viewer-request` key set to `function_arn = aws_cloudfront_function.spa_rewrite.arn`. It rewrites a
directory-style route to its prerendered `index.html`.
Every request for a page passes through it. It is not new and was not introduced after this decision —
it is ADR-0013's, and ADR-0026`:25` already named it as *"the URL-rewrite that remains."* The
`/assets/*` behavior carries no function association, which is why the accurate claim is "every request
for a page" rather than "every request."
*(Pointers and one count, both corrected under #446: this paragraph cited `iac/frontend.tf:21-28` and
`:73-77` until that change moved the first of them — both now quote the clause instead, per the
documentation standard's "Cite the clause, not the line" — and it said `/assets/*` **behaviors**, plural,
which #446 reduced to one by removing the narrower `/assets/<prefix>/*` behavior. Neither claim is
otherwise changed.)*

**The decision is unchanged, and neither `:25` nor `:47` is edited in place.** Supersede-never-rewrite:
the sentences stand as they were reasoned, and this amendment scopes them. Nothing about the chosen
option moves — the near-zero-cost and no-ops-burden consequences hold, because a CloudFront Function is
priced per invocation and has nothing to operate. The **ops-burden** claims elsewhere in this platform
(*"nothing to keep running at 3am"*) are a different claim and remain true.

**Why it is recorded at all, and what was weighed against recording it.** `product-lead` argued no
amendment was owed: read whole, `:47`/`:48` and ADR-0026`:21`/`:25` each scope themselves, so an
amendment would record a correction to something that is not wrong. That argument holds for the two
clauses it examined and is the reason this amendment does not call them false — but it does not reach
`:25`, which no adjacent line scopes. The second half of the case is evidence, not prediction: the
clause was in fact lifted onto `/architecture:184` without its qualifiers, where it read as a claim
about request-time compute in general. Corrected on that page in
[#452](https://github.com/tedeuxx/tadeumendonca-io/pull/452); recorded here because `/architecture:186`
points a reader straight at ADR-0026, and correcting the page while leaving the record bare re-arms the
same quotation.

**Links:** ADR-0013 (the hosting decision that owns the function) · ADR-0026's 2026-08-15 amendment,
which points here rather than repeating this.
