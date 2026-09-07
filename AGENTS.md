# tadeumendonca-io — the harness-neutral brief

**This file is the whole brief for any agent harness that reads `AGENTS.md`.** It is not a
compatibility copy and it is not generated. Where your harness reads a root brief under a different
name, that other file exists in this repository too and is longer; **this one is not derived from it**,
and the two are authored side by side under the same rule rather than one being transformed into the
other.

## The budget, and whose it is

**Keep this file under 50,000 characters.** That number is **one consumer's measured floor, not a
standard**: Kiro `1.0.437` loads `AGENTS.md` as always-on steering and truncates it at 50,000
characters, announcing the loss only on a debug channel. **Every other harness's budget is unmeasured.**
The measurement is a read of the shipped bundle's control flow on a machine where that tool has never
authenticated; it has not been confirmed against a live session.

## What this repository is

**The owner's proof-of-engineering site — a fully static single-page application served from object
storage behind a CDN. There is no backend**: no API, no database, no authentication, no serverless
compute. It was a backend-bearing monorepo once; that half was retired.

It is the public presence for the apex domain: an interactive CV, a portfolio linking to a curated
catalog of public repositories, a reading shelf, and long-form writing. **Content ships in the
repository** — markdown for long-form, typed source for structured data — and every route is
prerendered at build time, in both locales, so social and search metadata land in the served HTML.

**The argument is the code it links to.** Decisions are defensible with documented trade-offs, because
the repository is public and it *is* the pitch. No over-engineering; also not a playground — it has to
work.

## The floor — obligations, not descriptions of enforcement

**Every rule below is stated as something you must do, and each is true on a harness with no hooks at
all.** Where this platform also enforces one mechanically, that is a property of one harness and is
deliberately not written into the rule.

1. **No solo architectural decisions.** Architecture, contracts, positioning and anything irreversible
   or public-facing go to the owner. In-pattern implementation is yours to decide and report — asking
   on in-pattern work is the loop failing to flow, not caution.
2. **Never merge your own work, and never push to the trunk.** `main` is the only branch; work on a
   short-lived branch off it and open a merge request.
3. **Never rewrite published history.** No force-push to a shared branch, no destructive reset over
   work you did not create.
4. **Never write a secret into this repository or into a forge secret store.**
5. **Infrastructure mutation is pipeline-only.** Never run `terraform apply` or `terraform destroy`
   from a workstation. Local is read-only: format, validate, inspection plan. Destroying live
   infrastructure means removing it from configuration and merging. Changing DNS, the CDN
   distribution or the bucket needs explicit confirmation first.
6. **Never use a runtime flag that disables your harness's permission checks.**
7. **Never publish anything private.** See *The private layer* below — it is the sharpest rule here,
   because this repository is public and the mistake is not reversible.
8. **No client or employer references in public writing.** Abstract every war story to a generic
   principle.
9. **Scratch files go in your harness's own session scratchpad, never in a repository path.** Bodies
   for merge-request and issue text are written to a file and passed by file, never inlined into a
   shell argument.
10. **One work item at a time.** One branch, one open merge request, finished through merge.
11. **A review finding is named, never filed.** Only the owner opens work.
12. **Everything published on the forge is written in English** — this file, the README, commit and
    merge-request text, issues, decision records. **The site's own copy is bilingual**; that is
    content, not forge publication.
13. **Publish a measured number with the command that produced it, or do not publish the number.**
14. **Never hardcode a string the interface displays.** The site's chrome is bilingual, and every new
    interface string is added to the in-repository locale catalog **in both locales**. A string typed
    straight into a component is shipped untranslated to half the audience — measured here once, where
    one module typed as a plain string served the wrong language for three days because nothing
    objected. Long-form content is one file per locale rather than two languages in one document; a
    missing translation should fail the build, never render.

## Quality — what "done" requires

- Lint and type-check clean; unit coverage at or above the project threshold; a green build.
- **The end-to-end suite is the proof that nothing already working broke**, and it must functionally
  cover every implemented feature. A change that adds behaviour without its regression is not done.
- **Observability is part of done, in the shape this repository actually has**: analytics, the client
  error surface, and a build and prerender smoke — routes render, metadata is present in the served
  HTML. There is no server telemetry here because there is no server.
- **A green pipeline is not the review.** The pipeline proves nothing broke; the gate judges whether
  the change is right.

## The routes, and why the path is authoritative

Public URLs carry a locale prefix. **The path decides the language** — a prefixed URL renders that
edition regardless of the visitor's browser, which is what makes a shared link keep its language.
Unprefixed sub-paths exist only as a client-side redirect and are **never** advertised in the sitemap
or in alternate-language metadata. The bare root is the one deliberate exception: it is prerendered,
it is in the sitemap, and it is the advertised default entry for a crawler with no scripting.

**`apps/fed/scripts/routes.mjs` is the build-time source of truth for the route set. Read it before
assuming a route exists.** Do not maintain a route list anywhere else — a second list is a list that
rots.

**The prerender is not a visitor.** It snapshots in a single browser and that HTML is served to
everyone, so anything rendering off the *visitor* — language preference, stored state, viewport —
rather than off the *route* must opt out of the snapshot. A post-mount check does not do it: the
snapshot is taken from an already-hydrated page.

## Structure

- **`apps/fed/`** — the single-page application: the components, the typed data under
  `apps/fed/src/data/` (the CV, the portfolio catalog and the reading shelf are typed source, not
  markdown), the route generator in `apps/fed/scripts/`, and the end-to-end suite in `apps/fed/e2e/`.
  **This directory carries no nested `AGENTS.md`, deliberately, and that absence is the whole of the
  claim.** A per-directory guide for it *does* exist — under the other root-brief filename, which the
  harness reading this file does not resolve at any depth — and its material is absorbed into this
  file rather than pointed at. A second brief under *this* filename would be a second thing to keep
  honest, and the duplicated pair in this workspace was measured drifting 118 lines in three weeks.
  Read this file, then read the source.
- **`iac/`** — the infrastructure as code: object storage, the CDN and its edge rewrite function,
  custom email records, the pipeline's identity roles, and an account-level cost budget scoped
  deliberately wider than this project so it catches spend this repository did not create. State lives
  in a managed remote backend; apply and destroy are pipeline-only.
- **`docs/adr/`** — the decision library, and **the architecture documentation**. This file is the
  map; those records are the territory. **Read the relevant record before changing anything it
  decides.** Also `docs/catalog-ready.md`, the bar a project must clear before it is published in the
  portfolio.
- **`.github/workflows/README.md`** — the full pipeline map, kept next to the pipeline definitions
  because that is where the questions get asked. **Read it before changing a workflow.**
- **`VERSION`** — numeric SemVer, no pre-release suffix. The deploy bumps the patch on every merge to
  the trunk and publishes a release; it is the deploy's first step because the version is a build
  input.

## The private layer

This repository is **the one place the owner's professional presence is maintained from**, and the site
is one surface among several. The positioning, the copy canonically published on each surface, and the
playbook that keeps them in sync live in a **private, version-control-ignored directory at the
repository root**, named in the ignore file. It is never published.

Rules that follow, and they are absolute:

- **Read the positioning source before writing any public-facing copy** — site content, READMEs,
  profile text, CV text. Never write positioning copy from memory; it drifts.
- **Never commit, quote, paraphrase or otherwise move anything out of that directory into a public
  surface** — not into this repository, not into an issue, not into a merge request, not into a
  comment.
- **A positioning change propagates to every surface in one batch**, and the record of what each
  surface carries is updated to match what actually shipped.
- **Writes to external public surfaces are ask-first.** Show the proposal and wait.

## Fixed decisions — do not reverse without discussion

- **Static site, no backend.** Content is in the repository and prerendered.
- **The application owns its styling system directly**; no component-library dependency; a single
  theme; no progressive-web-app shell.
- **The visual identity is a set of deliberate constraints, not defaults — confirm before changing any
  of them.** One fixed theme and **no light/dark toggle**; a near-black, warm off-white and exactly
  **one** accent colour; a display face and a monospace face for labels, data and metadata,
  self-hosted rather than fetched; and **zero border-radius, no shadow, no gradient**, enforced in the
  styling scale itself so a leftover rounded or shadowed utility renders square and flat. There is one
  carved exception, a round portrait, reachable only through its own named utility and deliberately not
  through the general scale. Read these as decisions someone made and had reasons for: they are the
  reason the surface looks like one thing, and each is individually easy to erode by accident.
- **Pipeline identity is pinned to the repository's immutable subject**, never to its name — a rename
  silently breaks every trust relationship otherwise.
- **The vocabulary for the practice is fixed and lives in the private positioning source.** Read it
  before writing copy that names the practice.
- **No client or employer references in public writing.**

## Requires explicit confirmation before you act

- **A merge that touches `iac/`** — the deploy applies it against real infrastructure. Confirm the
  plan first.
- **Publishing an article.** It is the owner's *voice*: what the piece argues, in whose words, is not
  something an agent supplies.
- **Anything that threatens the site's continuity**, and any change to the rules by which work is
  decided.

**One residue, stated so it is a known cost rather than a surprise:** social scrapers pin the preview
card they first fetch, so a wrong unfurl on an already-shared post is not repaired by the next merge.
It stays wrong on that post and right everywhere after. This is bounded and accepted.

## What is checked, and what no check can say

A gate asserts that this file is **tracked**, **under the character budget with headroom**, **free of a
declared set of tokens specific to one harness**, and that **every repository-relative path it names
exists**.

**What no check can assert: that this brief is TRUE, or that it is neutral rather than merely free of
the tokens on a list.** A sentence that is portable in vocabulary and false in substance passes every
arm. Neutrality is held by whoever writes and reviews this file.

## What this file deliberately does not carry

- **The harness-specific installation and configuration steps.** They are in `README.md` and in this
  repository's other root brief.
- **The invocation syntax for a typed command.** Reach a guide by its path and read it.
- **Counts.** Every enumerated number ages. Where you need one, derive it.
