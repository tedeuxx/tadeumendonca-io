# 0038. Published content is distributed to LinkedIn **and** X, in the same batch

- **Status:** accepted
- **Date:** 2026-07-26
- **Deciders:** the owner
- **Driven by:** [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md), [ADR-0024](./0024-profile-canonical-cv-cross-surface.md), [ADR-0005](./0005-og-coverage-every-public-url.md)

## Context & problem
The site is the storefront, but nobody arrives at a static site by accident — **publishing an article and
distributing it are two different acts**, and until now only the first was decided. The launch article
("My Commitment") was announced on LinkedIn, and X was reached only as an afterthought, by hand, after the
fact.

That is the failure mode ADR-0024 already names for the CV, appearing here as *reach* rather than as
*facts*: a surface announced in isolation makes the presence look intermittent on every other surface.
X was mapped as a signal/contact layer, which is why it was easy to skip — but a presence that is
consistent on one network and sporadic on another reads as sporadic. **Consistency is the mechanism**
(see the site's operating rules), and consistency that depends on remembering is not a mechanism.

## Decision drivers
- Distribution is part of "published", not a follow-up chore — an article nobody is told about did not ship.
- The two networks are **different media**, not mirrors: LinkedIn rewards the long form, X rewards a
  thread. Same argument, different shape.
- Cadence is weekends-only; a standard that costs a remembered decision each time will be skipped.
- The canonical URL must be the thing shared, because the OG card is the first impression and it is
  **pinned by the scraper on first fetch** (ADR-0005) — a shortener spends that impression on a domain
  that isn't the site.

## Considered options
1. **Both surfaces, same batch, medium-adapted copy** (chosen) — one publication event fans out to
   LinkedIn (long form) and X (thread), both ending at the canonical article URL. *Trade-off:* every
   publication now costs two drafts instead of one, and the batch is only as fast as its slowest surface.
2. **LinkedIn only, X for ad-hoc signal** — *Why not:* this is the status quo that produced the gap. It
   also concedes the audience where agentic-development discussion actually happens.
3. **Identical copy syndicated to both** — *Why not:* a 1200-character LinkedIn post truncated into X reads
   as automation, and automation-shaped presence undercuts the "written by a peer" claim the content makes.
4. **Automate the fan-out (scheduler / API)** — *Why not:* not now. It buys convenience at the cost of an
   integration, credentials to hold, and a class of unattended public writes — against the lean posture
   (ADR-0001) and against the ask-first rule for external surfaces. Revisit if cadence ever justifies it.

## Decision outcome
Chosen: **a publication is not done until it exists on both LinkedIn and X.** Both carry the same
positioning and the same canonical link; the copy is adapted to the medium, not re-argued. If one surface
cannot be published, the publication is **incomplete and tracked**, not silently half-done.

The **obligation** is recorded here. The **mechanics** — per-surface checklists, ~~tooling~~, the copy
itself — are private working material outside this repo, exactly as ADR-0024 established for the CV sync.
**Narrowed by the amendment (2026-07-27): "tooling" was too broad — derivation tooling that must share the
site's own source of truth lives in the repo; its output does not.**

## Consequences
**Good**
- Reach stops depending on remembering. The standard is the default, so skipping is now a deliberate act.
- X is promoted from signal layer to distribution surface, aligned with where the target audience is.
- Both surfaces point at the canonical URL, so the OG card and the analytics attribution stay the site's.

**Bad / accepted costs**
- **Two drafts per publication.** Medium-adapted copy is the whole point, and it is the whole cost —
  this is real per-article work in a weekends-only cadence.
- **Still manual, therefore still skippable.** This ADR makes the omission visible, not impossible;
  no gate enforces it. That is deliberate (option 4), and it is the honest limit of this decision.
- **Public writes remain ask-first**, so distribution can't run unattended even when the copy is ready.
- **Partial publication is a real state.** A LinkedIn post live while X is not is the incoherence this
  ADR exists to prevent, in miniature — it must be closed, not tolerated.

## Amendment (2026-07-27) — the draft **generator** is repo tooling; only its **output** is private
A distribution **draft kit** ships in this repo: `apps/fed/scripts/gen-distribution.mjs` (plus its unit
tests and the `gen-distribution` npm script). It scaffolds the LinkedIn long-form section and the X thread
section for each article from the English frontmatter, and writes them to the **gitignored**
`.brand/distribution/<key>.md`. It **posts nothing, holds no credential, and adds no CI gate** — it is
standalone and deliberately not wired into `build` / `build:static`.

**Why the decision above was too broad.** It lumped "tooling" in with the copy as private working
material. Gitignoring the drafts satisfies "the copy itself"; it does not make the generator private, and
the generator is tooling, in the public repo, by name. So the clause is narrowed rather than quietly
ignored:

- **Private:** the copy, and the per-surface checklists that describe how the owner actually posts.
  Pre-publication copy in a public repo would let anyone read tomorrow's post today, which is why the
  output directory is gitignored and never committed.
- **In the repo:** derivation tooling that must share the **site's own source of truth**.

**Why that distinction is load-bearing, not a convenience.** The generator's whole reason to exist is
that it resolves the share URL by **lookup in `scripts/routes.mjs`'s `localizedRoutes()`** — the same
module the prerender and the sitemap consume. A private fork of that derivation would drift from the
site's real routes, reintroducing exactly the risk ADR-0037's per-locale slugs created. Concretely: at the
time this was written `alternatesFor()` advertised a **bare x-default article URL** (`/blog/<en-slug>`)
that the prerender does **not** snapshot, so a scraper sent there got 200 carrying the HOME page's OG card
— pinned permanently (ADR-0005; CLAUDE.md names OG pinning the least reversible thing in this repo).
*(That source defect was fixed the same day by the [ADR-0036 amendment](./0036-per-locale-urls-prerender-hreflang.md)
/ issue #200; hreflang now advertises only prerendered URLs. This generator's guarantee never depended on
it — it constrains what the generator emits, whatever the alternate set contains.)* The generator therefore
**refuses to emit any URL that is not a member of the prerendered route list**, and that guarantee is only
possible because it imports the real routes module. Tooling that must not drift from the code lives with
the code.

*Trade-off (accepted):* the existence and the shape of the distribution mechanism become public — a reader
can see that drafts are generated and what skeleton they start from. That is the cost of the guarantee;
what stays private is what is actually sensitive (the unpublished words), and the alternative — a private
copy of the route derivation — trades a visible skeleton for an invisible, un-gated way to publish a URL
no scraper can read.

**What this does not change.**
- **Automated posting stays rejected.** Option 4 stands in full; nothing here schedules, authenticates, or
  writes to an external surface.
- **The obligation is unchanged** — a publication is still not done until it exists on both surfaces.
- **Still manual, therefore still skippable.** No gate enforces the fan-out. The draft kit lowers the cost
  the "Bad / accepted costs" section named (two drafts per publication); it does **not** close that hole.
- **ADR-0024's parallel clause is unaffected.** The CV sync process stays private working material; this
  narrowing is scoped to distribution drafts only.

## Links
- Cross-surface coherence obligation for the CV: [ADR-0024](./0024-profile-canonical-cv-cross-surface.md) ·
  OG card pinned on first fetch: [ADR-0005](./0005-og-coverage-every-public-url.md) ·
  per-locale canonical article URLs: [ADR-0037](./0037-localized-article-slugs.md) ·
  tracked in issue #186 · the draft-kit amendment delivered by issue #178 · the distribution **copy** and
  per-surface checklists remain private (kept outside this repo).
