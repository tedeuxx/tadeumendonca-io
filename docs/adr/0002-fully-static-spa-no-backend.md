# 0002. Fully static SPA, no backend

- **Status:** accepted · **amended 2026-11-01** (absorbs the rest of the `site-platform` capability,
  formerly records 0004, 0006 and 0012, as the sections *Content and OG resolved at build time*, *The
  frontend toolchain* and *Data keys as authored, no mapping layer*; every decision is unchanged, #456)
- **Capability:** `site-platform`
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Supersedes / superseded by:** supersedes the backend-era architecture (recorded in the History index)
- **Driven by:** [ADR-0053](./0053-this-library-records-presence-and-site-architecture-one-document-per-capability.md#lean-by-design--the-keystone-every-record-is-read-through) (lean by design)

**This document is the whole `site-platform` capability.** The first half is the platform decision
itself: no backend. The three sections after it are the decisions that make a site with no backend
work: where content and its OG are resolved, which toolchain builds it, and how its data is keyed. Each
section was a record of its own until #456 folded it here; each says where it came from.

## Context & problem
Applying ADR-0053 (lean by design) to the concrete stack: what does the site actually *need* a server
for? The content (CV, articles, catalog) is authored by one person and changes rarely. There is no user
data, no session, no per-request logic — nothing a visitor sends back. The earlier BFF existed to serve
a dynamic, authenticated, backend-ful product that the strategy no longer pursues.

## Decision drivers
- ADR-0053 (lean by design): cut anything the content/portfolio presence doesn't require.
- The content is inherently static and lives in the repo.
- SEO/OG needs the meta tags in the served HTML (a bot concern), not a running renderer.

## Considered options
1. **Fully static SPA — no API, auth, or database** (chosen) — React/Vite bundle + content, served as
   static objects. *Trade-off:* no server-side capability at all; dynamic features would need new infra.
2. **Keep a thin BFF for OG/SEO and future dynamic bits** — *Why not:* re-introduces always-on compute
   and its cost/ops for a problem solvable at build time (see *Content and OG resolved at build time*
   below, prerender). Contradicts ADR-0053 (lean by design).

## Decision outcome
Chosen: **fully static**. No backend — no API, no database, no auth, no server-side rendering at runtime.
The SPA renders client-side; SEO/OG is solved at **build time** (*Content and OG resolved at build time*
below). This is the single largest application of ADR-0053 (lean by design) and the reason the whole
backend tier (BFF, DynamoDB, Cognito, SES, Lambda@Edge) was retired.

## Consequences
**Good**
- Nothing to run: the site is static objects on a CDN, scale-to-zero, near-zero cost, minimal attack
  surface (no server, no auth).
- Simplest possible operational story — deploy is a sync + invalidation.

**Bad / accepted costs**
- Zero server-side capability. Auth, dynamic/user data, an API, or server telemetry require re-adding
  infrastructure (per the lean-by-design gradual-evolution path in ADR-0053).
- Some SEO/interaction concerns move to build time or the client, constraining how they're solved
  (*Content and OG resolved at build time* below, and ADR-0005).

## Content and OG resolved at build time

**Absorbed 2026-11-01 (#456) from the record that held it, 0004, decided 2026-07-22.** The decision is
unchanged and still binds, and so are its two amendments (2026-08-15 and 2026-08-25), which follow it as
subsections. The full record is in git history: `git log --diff-filter=D -- 'docs/adr/0004-*'`. It
supersedes the Lambda@Edge OG renderer and the backend link-unfurl feature (History index).

### Context

A static SPA (the decision above) renders in the browser, so a bot or a link-unfurler that reads only the
raw HTML sees an empty shell — bad for SEO/OG. And the markdown content itself has to reach the page
somehow. The real fork is **where the content and its OG are resolved**: at **build time** (compiled in
and prerendered), or at **request time** (the markdown lives as objects in the bucket and is fetched
live, with OG injected per request). That second path is precisely what would make an edge/SSR runtime
necessary again. The drivers: no server and near-zero cost (lean by design, and the decision above), so
request-time compute is exactly what was cut; SEO/OG only needs the tags to be *in the served HTML*, not
freshly computed per request; and a personal blog publishes at low cadence, so instant, no-rebuild
publishing is not a requirement.

### The decision, as it binds

**Build time.** Vite bundles every `.md` (`import.meta.glob(..., { eager: true })`) at build; a
Playwright pass snapshots each route to static `dist/<route>/index.html` with meta/OG inlined. The
markdown is compiled into the bundle and each route is prerendered to static HTML; content and OG are
resolved before anything is served. This is why **the site needs no Lambda@Edge today** — the only thing
that would bring edge back is choosing the runtime-from-bucket path (the rejected option below), which is
the documented evolution route if a no-rebuild content cadence ever becomes worth its cost.

**The trade-off, made concrete by link unfurl:** unfurling an *arbitrary external* link needs a
request-time fetch of that link's remote OG — a server the site does not have. So the backend
link-preview feature was retired (History index); what survives is a **client-side embed for known
providers** (a YouTube URL in an article becomes a `VideoEmbed` facade by URL pattern — no server, no
remote fetch). The site's *own* pages get rich, prerendered OG; *external* links do not, deliberately.

### Rejected options that are still live

No in-repo test refuses this, so the reasoning stays.

- **Runtime — markdown from the bucket, OG at the edge.** Keep the `.md` as S3 objects fetched live (by
  the client, or by an edge function), and inject OG per request at **Lambda@Edge**. Publishing becomes
  "drop a file in the bucket", no rebuild. *Why not:* it reintroduces **edge compute** (for OG and for
  unfurling) and its cost/ops — the exact request-time runtime that lean by design and the decision above
  removed — to buy a no-rebuild publish cadence the site does not need.

### Consequences still being paid

- SEO/OG in the served HTML with **nothing running** for rendering, and no Lambda@Edge is needed — the
  static, near-zero-cost story holds end to end. (The scope of *nothing running* is the first amendment
  below.)
- The prerender is a normal build step; the deploy stays a sync + invalidation.
- **Publishing an article is a rebuild + redeploy**, not a bucket drop — the accepted cost of compiling
  content in (fine for a low-cadence, content-as-code blog).
- OG/content are frozen at build — no per-request, per-viewer, or freshly-fetched-data OG.
- No request-time unfurl of external links; in-article rich media degrades to client-side embeds for a
  known-provider allowlist (YouTube today).
- The build owns a headless-browser prerender step (Playwright), a build-time dependency and cost.

### Amendment, 2026-08-15 — what was removed is request-time RENDERING, not request-time COMPUTE

**The scoped statement, written once so it can be quoted without its context:** build-time prerender
removed request-time **rendering**. It did not remove request-time **compute**. A CloudFront Function
runs on **every request for a page**.

The record this section came from carried the unscoped form twice, and the two were not equally
defensible. *"SEO/OG in the served HTML with **nothing running**"* was scoped on the next line by *"and
no Lambda@Edge is needed"*, so a reader who read the bullet to its end was not misled. *"Nothing runs at
request time."*, inside the chosen option's description, was scoped by **nothing**: read whole, it was
the one clause in the record that was inaccurate rather than merely quotable out of context. The fold
leaves that clause out of *The decision, as it binds* and keeps the first one with its scope.

**What actually runs, checked rather than asserted:** `iac/cloudfront-functions/spa-rewrite.js` is a
ten-line viewer-request CloudFront Function — `iac/frontend.tf`'s
`resource "aws_cloudfront_function" "spa_rewrite"`, whose `code` is
`file("${path.module}/cloudfront-functions/spa-rewrite.js")` — attached to the default cache behavior
by the same file's `default_cache_behavior`, whose `function_association` block carries a
`viewer-request` key set to `function_arn = aws_cloudfront_function.spa_rewrite.arn`. It rewrites a
directory-style route to its prerendered `index.html`. Every request for a page passes through it. It is
not new and was not introduced after this decision — it is ADR-0013's, and ADR-0026 already named it as
*"the URL-rewrite that remains."* The `/assets/*` behavior carries no function association, which is why
the accurate claim is "every request for a page" rather than "every request."

**The decision is unchanged.** Nothing about the chosen option moves — the near-zero-cost and
no-ops-burden consequences hold, because a CloudFront Function is priced per invocation and has nothing
to operate. The **ops-burden** claims elsewhere in this platform (*"nothing to keep running at 3am"*) are
a different claim and remain true.

**Why it was recorded at all.** `product-lead` argued no amendment was owed, because read whole the
scoped clause and ADR-0026's own wording each scope themselves. That holds for those two and is why this
amendment does not call them false — but it does not reach the unscoped clause, which no adjacent line
scoped. The evidence: the clause was lifted onto `/architecture` without its qualifiers, where it read as
a claim about request-time compute in general. Corrected on that page in
[#452](https://github.com/tedeuxx/tadeumendonca-io/pull/452); recorded here because the page points a
reader at ADR-0026, and correcting the page while leaving the record bare re-arms the same quotation.
ADR-0026's own 2026-08-15 amendment points here rather than repeating this.

### Amendment, 2026-08-25 — "each route is prerendered" is a claim about PUBLISHED routes

*The decision, as it binds* states that *"the markdown is compiled into the bundle and each route is
prerendered to static HTML"*. [ADR-0049](./0049-held-article-is-isolated-not-private.md) is the first
content deliberately **neither listed nor prerendered**, so the universal reading of that clause no
longer holds.

**The two halves are separable, and only the second is scoped.** Compilation is resolved by the Vite glob
at build time and is **unchanged** — a held article's markdown is still compiled into the bundle, and
that half is not incidental to ADR-0049, it *is* the exposure that record exists to state: a runtime
filter removes an article from every list the site renders and cannot remove its body from the bytes the
site ships. Prerendering becomes a **per-route** decision: a held article gets no static HTML, no
listing and no sitemap entry.

**This scopes the decision; it does not reverse it.** Build time is still where content and OG resolve,
the site still needs no Lambda@Edge, and the runtime-from-bucket option is still unchosen — a held
article's text lives in the bundle precisely *because* build time is still in force. What is narrowed is
the quantifier *each*, nothing else.

### Where it came from

Decided 2026-07-22; amended 2026-08-15 (#452) and 2026-08-25 (with ADR-0049). Code:
`apps/fed/scripts/` (the prerender), `iac/cloudfront-functions/spa-rewrite.js`. Absorbed here by #456.

## The frontend toolchain

**Absorbed 2026-11-01 (#456) from the record that held it, 0006, decided 2026-07-22.** The decision is
unchanged and still binds; everything arrived. `git log --diff-filter=D -- 'docs/adr/0006-*'` names the
commit that removed it.

### Context

The static site (the decision above) needs a frontend toolchain: a component model, a build tool, and a
language. The choice should serve a content-first SPA that is prerendered at build, and it should be a
stack the owner can defend as engineering (the repo is public and is the pitch). The drivers: a
client-rendered SPA, prerendered at build, so the toolchain must support a static build; type safety and
a fast dev/build loop; and a mainstream, defensible stack, not an exotic bet on a personal site.

### The decision, as it binds

**React + Vite + TypeScript.** React models the interactive CV/portfolio/blog; Vite builds the static
bundle, serves a fast dev loop, and hosts the build-time content glob (`import.meta.glob`) and the
prerender of *Content and OG resolved at build time* above; TypeScript types it end to end.

### Rejected options that are still live

No in-repo test refuses these, so the reasoning stays.

- **A static-site generator (Astro/Eleventy)** — lighter for content. *Why not:* the site is also an
  interactive CV/portfolio and an agent-built engineering artifact; a component SPA carries that better,
  and the prerender step already gives the SEO/OG a generator would.
- **Next.js** — *Why not:* its value is SSR/edge/server components — exactly what the decision above
  removed; running it purely static is using a fraction of it and carrying its weight.

### Consequences still being paid

- Fast dev loop and static build; `import.meta.glob` gives build-time content for free.
- Mainstream, well-understood, type-safe — defensible and low-risk.
- A SPA framework is more than a pure content site strictly needs; justified by the interactive surfaces
  and the engineering-artifact purpose.
- The bundle grows with features (a bundle-size concern the performance work watches).

## Data keys as authored, no mapping layer

**Absorbed 2026-11-01 (#456) from the record that held it, 0012, decided 2026-07-22 and amended
2026-07-30.** The decision is unchanged and still binds, with the casing split its amendment recorded.
The original snake_case-everywhere wording is superseded narrative and stays in git history:
`git log --diff-filter=D -- 'docs/adr/0012-*'`.

### Context

Content and data — markdown frontmatter, the profile/catalog data modules — need a field-naming
convention. JavaScript/TypeScript idiom is camelCase; data/serialization idiom is often snake_case. A
choice at the boundary determines whether a mapping layer is needed. The drivers: avoid layers that do
not earn their keep (lean by design) — a camel↔snake mapper is pure overhead if avoidable; and
consistency between frontmatter authored by hand and the typed data the app reads.

### The decision, as it binds

**No mapping layer: each module's types mirror its authored keys, and the app reads the data as
written.** That is the load-bearing half of the decision as it was taken on 2026-07-22, and it is
intact. The casing is **split**, and the split is recorded rather than re-decided (amendment of
2026-07-30):

| where | convention | evidence |
|---|---|---|
| blog frontmatter | **camelCase** | `src/lib/content.ts` — `FACT_KEYS` reads `linkedinUrl`, `hasVideo`, `ogImage` |
| `src/data/catalog.ts`, `repoCards.ts` | **camelCase** | `repoUrl`, `liveUrl` |
| `src/data/profile.ts` | **snake_case**, unchanged | `profile_id`, `start_date`, `print_highlight_index` |

**Follow the file you are in.** Normalising was weighed and not done, deliberately: converting
`profile.ts` to camelCase would touch the CV — the most reviewed data in the repo, and the source of
`/cv.pdf` — for a stylistic gain and no functional one; converting the frontmatter back would churn
published articles. The split costs one sentence of explanation; either migration costs a slice and
risks the CV.

### Rejected options that are still live

No in-repo test refuses this, so the reasoning stays.

- **camelCase everywhere plus a mapping layer at the content boundary.** A mapper to convert frontmatter
  keys is a layer with no payoff here; it is the over-engineering lean by design forbids.

The third option of 2026-07-22, *camelCase in frontmatter too*, was rejected then on the grounds that it
would churn the existing convention for no real gain. The churn happened anyway, without a decision,
when the static pivot rewrote the content pipeline: the new modules were authored in the idiom their
surrounding TypeScript uses, and `profile.ts`, the one module that predates the pivot, was never
touched. The rejection did not survive contact with a pipeline rewrite, which is why the casing is now
split.

### Consequences still being paid

- No transformation layer — the data is read exactly as authored; less code, fewer bugs at the boundary.
- Two casings in one codebase, split by module; lint is configured to tolerate snake_case at the data
  boundary.
- A convention can drift one module at a time, each step locally reasonable, while the record says
  otherwise. That is how the split happened; the amendment was found by the `critical-reviewer` on #261,
  which had just replaced a stale README claim with one that was true of the code and contradicted the
  record.

## Links
- Driven by ADR-0053 (lean by design) · supersedes the backend-era architecture (History index).
- Absorbed by #456 (2026-11-01): the build-time render (formerly record 0004), the frontend toolchain
  (0006) and the data-key convention (0012). Each section above says where it came from and how to
  recover the original from git history.
- Scoped by [ADR-0049](./0049-held-article-is-isolated-not-private.md) (a held article is compiled in but
  neither listed nor prerendered) · the CloudFront Function that runs per page request is ADR-0013's ·
  own-URL OG coverage is ADR-0005.
