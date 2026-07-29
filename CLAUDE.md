# tadeumendonca-io

**The owner's proof-of-engineering site — a fully static SPA served on S3 + CloudFront. No backend.**
This repo is the public presence for **tadeumendonca.io**: an interactive CV, a portfolio that links to a
curated **catalog** of automations / agentic tools, and a blog. It was formerly a backend-ful monorepo (a
Hono/Lambda BFF, Cognito, API Gateway, DynamoDB, SES); that backend was **retired** and the site is now static —
content ships **in the repo** — markdown for long-form, typed TypeScript for structured data — prerendered
at build time, in both locales, for OG/SEO.

> Convention: everything **published on GitHub** (this file, READMEs, descriptions, commit/PR text, issues) is
> written in **English**. The site's copy is **bilingual (pt-BR + en, ADR-0032)** — chrome, CV and
> long-form alike — and **both locales are prerendered**, each route snapshotted with its own head
> (ADR-0036 retired 0032's English-pinned prerender clause; only the bare `/` snapshot is still English,
> as the x-default entry). That's content, not GitHub publication.
> **One known exception, and it is a bug, not a policy:** `src/data/catalog.ts` is authored in Portuguese
> only, so `/en/portfolio` currently serves Portuguese copy (#235). The rule stands; the file does not
> follow it yet.

## Engineering principles (always-on floor — non-negotiable)
This repo consumes the **`tadeumendonca-skills`** plugin's principles layer (enabled in `.claude/settings.json`;
its `PreToolUse` permission-guard hook activates automatically). The spine is **agent-led verification,
human-residual**: the agent proves "done" with mechanical gates and real evidence; the human keeps the
irreversible/architectural judgment and the production go/no-go. The floor never bends to risk:
- **Plan-first** — design and align before coding; no solo architectural call.
- **Ask on the boundaries — and only there.** Architecture, content/positioning, anything irreversible
  or public-facing goes to the owner; **everything in-pattern is decided and merged autonomously**,
  through the `critical-reviewer`. Asking on in-pattern work is not caution, it is the loop failing to
  flow — the boundary is what the human's attention is *for*, and spending it elsewhere devalues it.
- **Thin vertical slices, WIP = 1** — each increment end-to-end and reviewable; **finish it through
  merge** before opening the next. A green PR left sitting is the queue forming. (Mechanical since
  skills#61: the plugin's `wip-guard` denies opening a second PR in a repo that already has one of
  yours; `session-wip` lists the open queue at session start.)
- **Quality is a gate** — lint/typecheck + tests (coverage ≥ 85%) + a green build + SonarCloud + the
  `critical-reviewer`, and **functional E2E** (Playwright) as the proof nothing already working broke.
  The reviewer is a **distinct** gate from CI, not a summary of it.
- **Observability is part of done** — the site is static, so this is Google Analytics + the client error
  surface + a build/prerender smoke (routes render, OG tags present in the served HTML) — not backend telemetry.
- **Security & resilience by-design** — least-privilege CI (per-job OIDC roles), no secrets in the repo, a
  minimal static attack surface (no server, no auth).
- **Rigor calibrated to blast-radius** — heavy where irreversible/public, product-speed where cheap to revert.

Depth lives in the plugin's `/principles/*` skills (`engineering-philosophy`, `verification-and-gates`,
`dev-loop`, `permissions-and-environments`); for deliberate validation of a non-trivial decision, invoke the
subagent that **owns** it — **`plan-reviewer`** for a plan/spec against the principles + the ADR library,
**`security`** for the permission floor and supply chain, **`product-manager`** for what to build next.
(There is no `principles-guide`; `plan-reviewer` superseded it and invoking the old name simply fails.)

**Trunk-based** (merge to `main` → deploy to the single environment); **IaC is pipeline-only**; local dev is
**static** (fully static SPA, no backend). The agent works the full inner loop unprompted (git-reversible /
staging-scoped) and is **denied the irreversible/public boundary** (push/merge to `main`, `terraform
apply`/`destroy`, direct cloud mutation, force-push, `rm -rf`, secret writes); **never
`--dangerously-skip-permissions`**.

## Purpose (why it exists)
tadeumendonca.io is the owner's **proof-of-engineering** public presence, backing a repositioning to
**AI Engineer** (agentic development / AI-native automations), anchored in SDLC + distributed-systems
experience. The site is the storefront; the **argument is the code it links to**.

**Public URLs carry a locale prefix** — `/pt/…` and `/en/…` (ADR-0036). The path is **authoritative**:
`/pt/me` renders the Portuguese edition regardless of the visitor's browser, which is what makes a shared
link keep its language. Sub-paths without a prefix (`/me`, `/portfolio`) exist only as a client-side
redirect to the reader's edition; they are **not** prerendered and must never be advertised in hreflang or
the sitemap. **The bare root `/` is the one exception, deliberately**: it *is* prerendered (the English
landing), *is* in the sitemap, and *is* the advertised `x-default` — it is the JS-less crawler's entry
point. `apps/fed/scripts/routes.mjs` is the build-time source of truth for the route set; read it before
assuming a route exists.

**Five public surfaces** — `STATIC_ROUTES` in `apps/fed/scripts/routes.mjs` is
`['/', '/me', '/portfolio', '/ramp-up', '/architecture']` — plus the article route, which is **not** in
that list:
1. **Landing** (`/`) — the storefront. It also **hosts the articles list** (`#artigos`), which is why there
   is no separate blog index (below).
2. **Interactive CV** (`/me`) — the canonical reference of the owner's experience, and now the **only** CV
   surface: the Canva CV was retired (ADR-0024 amendment) once `/cv.pdf` became a real artifact rather than
   a capability. `/me` is the full edition; `/cv.pdf` is the one-page recruiter edition printed from it at
   build time (ADR-0034). Both derive from `profile.ts` — nothing is maintained by re-typing. LinkedIn is
   the one CV-bearing surface still hand-maintained, so it is the one that can still drift.
3. **Portfolio** (`/portfolio`) — a curated **catalog** of public repos (automations, agents, MCP servers, AI-native tools) that back the positioning with real code. The bar a project must clear to be published is `docs/catalog-ready.md`.
4. **Ramp-up** (`/ramp-up`) — the open plan for the AI-Engineer transition. Markdown-in-repo, both locales.
5. **Architecture** (`/architecture`) — how the site is built, linking the ADRs and the two public repos.
   Markdown-in-repo, both locales.

**Blog** — long-form engineering writing with explicit trade-offs (distributed-systems / AI patterns) — is
**not a static route**. There is no `/blog` list page: it was retired, and `/blog` redirects to the
landing's `#artigos`. The only real article route is `/blog/:slug`, and the slug is **per-locale**
(ADR-0037), so the two editions of one article carry different URLs.

**Operating rules (not flavor):** defensible decisions with documented trade-offs (the code is public and IS
the pitch); **no over-engineering** (simplest thing that solves it), but **not a playground** (it must work);
**no client/employer references** in public writing (abstract any war-story to a generic principle).

## Architecture (static — read before changing infra)
A **fully static SPA** (React + Vite + TypeScript, no PWA) built to `dist/` and served from
**S3 + CloudFront**; a **CloudFront Function** (viewer-request) rewrites clean URLs. Content is **in the
repo**, in two shapes: **markdown** for long-form (articles, ramp-up, architecture — frontmatter +
react-markdown) and **typed TypeScript** for structured data (`src/data/profile.ts` is the CV,
`catalog.ts` the portfolio). The build **prerenders each route in both locales** (Playwright snapshot of
`vite preview`) so OG/SEO tags land in the served HTML, and prints `/cv.pdf` from `/en/me` in the same
pass. There is **no backend** — no API, no database, no auth, no Lambda.

**The prerender is not a visitor** (ADR-0036 amendment): it snapshots in a single en-US browser and that
HTML is served to everyone, so anything rendering off the **visitor** (language, storage, viewport) rather
than the **route** must opt out via `window.__PRERENDER__`. A post-mount flag does not do it — the
snapshot is taken from an already-hydrated page. The exemption is *"identical for every visitor"*, not
*"does not render"*.

`iac/` is **frontend infra plus one account-wide guardrail**: S3 (`storage.tf`), CloudFront + the
URL-rewrite function (`frontend.tf`), custom email via iCloud (MX/DKIM/SPF, `email.tf`), the GitHub OIDC
deploy roles (`iam.tf`), and an **account-level cost budget** (`budget.tf`) — deliberately *not* scoped to
this project's tags, so it catches spend this repo did not create. Plus the usual Terraform scaffolding
(`data.tf`, `locals.tf`, `outputs.tf`, `variables.tf`, `versions.tf`, `providers.tf`, `env/`). Cost is
**near-zero / scale-to-zero** (static objects on CloudFront `PriceClass_100`; no always-on compute). The
security surface is minimal (no server, no auth); the CI OIDC roles are least-privilege and pinned to the
repo's **immutable OIDC subject** (`repo:<org>@<org_id>/<repo>@<repo_id>:*` — see `iam.tf` `local.github_oidc_sub`).
The shared regional WAF was retired (nothing to protect on a static bucket behind CloudFront).

## Branching (trunk-based)
**Loop model: `trunk-single-env`.** This is the declaration the principles layer reads — see
`/principles/dev-loop`, which documents two models. Everything below follows from it, and the
`gitflow-multi-env` half of those skills (integration branch, staging→production promotion,
staging-backed local dev) **does not apply here**. If a principles skill and this file disagree, this
file wins.

Two consequences worth stating outright, because they are what the other model gets wrong:
- **The PR to `main` carries the gate.** There is no downstream *environment* to defer a check to, so a
  check skipped on the PR is a check that never runs — with **one deliberate exception**: assertions that
  are **unsatisfiable before the deploy exists** (today, that the CloudFront Function is attached and
  accepted at the edge — #216). Those live in the post-deploy smoke and **skip** elsewhere rather than
  going red for a harness reason. The test is not "is it convenient to defer" but "can this be true
  before merge at all"; if it can, it belongs on the PR.
- **`main` is the working branch, not a protected production mirror.** Never add tooling that blocks
  edits or commits by branch context; it would break every slice.

- **`main`** is the only branch. Feature/fix branches cut **from `main`** → PR (0 required approvals) → merge →
  **automatic deploy** to the single environment. The merge **is** the deploy, so it is the go/no-go —
  and **the `critical-reviewer` subagent is who holds it**, not a human prompt on every PR. Run it on
  **every** PR before merging, unprompted; it verifies the MR Definition of Done with real evidence and
  then either **approves-and-merges the safe class itself** (docs, dependency bumps, tests, in-pattern
  work implementing an already-approved spec) or **escalates the boundary class to the owner** (`iac/`,
  contract/schema, reader-facing content — see the ⚠️ section for the rule, which is by what the file
  IS, not by a path list — anything that creates or
  changes an ADR decision, anything irreversible). *Significance beats in-pattern:* when the class is
  unclear, it is boundary. **The reviewer never merges an expansion of its own authority** — a change to
  this guide's merge rules is boundary by construction, whatever the diff looks like.
  A green CI is **not** a substitute for the review — CI proves nothing broke, the reviewer judges
  whether the change is right.
- **Single environment** (the `tadeumendonca-io` TFC workspace); the public
  site serves at the **apex** `tadeumendonca.io`.
- **Single version** (numeric SemVer, root `VERSION`): `version-main` auto-bumps patch on every push to `main`,
  tags `vX.Y.Z`, publishes a Release. The `bump:` commit is loop-guarded.

## Structure
- **`apps/fed/`** — the static SPA (React + Vite + Tailwind, no PWA). Own guide in `apps/fed/CLAUDE.md`.
- **`iac/`** — Terraform for the frontend infra (S3, CloudFront + URL-rewrite function, email, OIDC roles)
  plus the account cost budget. State in Terraform Cloud, **Local** execution; `apply`/`destroy` are
  **pipeline-only**. Note `iac/cloudfront-functions/` holds **application logic in JS**, unit-gated by
  `build-test` rather than by `infra-plan` — gate ownership is by what a file IS, not its directory
  (ADR-0018 amendment).
- **`docs/`** — **`docs/adr/`** is the decision library (38 records; `docs/adr/README.md` is the index and
  the reading order). Also `docs/catalog-ready.md` — the bar a project must clear to be published in the
  portfolio — and `docs/iac-deploy-policy.{md,json}`. **Read the relevant ADR before changing anything it
  decides**; the ADRs *are* the architecture documentation, this file is the map.
- **`.brand/`** — **gitignored, local-only, never published.** See below.

## Single workspace for the public presence
This repo is the **one place** the owner's professional presence is maintained from — the site is one
surface among several (LinkedIn, the GitHub catalog, X, the newsletter). The positioning,
the copy canonically published on each surface, and the playbook that keeps them in sync live in
**`.brand/`**, which is **gitignored and never published** (this repo is public).

Working rules that follow from that:
- **Read `.brand/positioning.md` + `.brand/surfaces.md` before writing any public-facing copy** —
  site content, READMEs, profile bios, CV text. Do not write positioning copy from memory; it drifts.
- **Never publish anything from `.brand/`** — no commits, PRs, issues, or quotes into public surfaces.
- **A positioning change propagates to every surface in one batch**, per the sync playbook, and
  `.brand/surfaces.md` is updated to match what actually shipped.
- **Writes to external public surfaces are ask-first** — show the diff/proposal and get an ok.
- MCP servers for this workflow are registered in **local scope** (`claude mcp add -s local …`),
  never in a committed `.mcp.json`.

## Fixed decisions (do NOT revert without discussion)
- **Static site**, no backend. Content is **markdown in the repo**, prerendered for OG/SEO.
- **fed:** own Tailwind, **no shadcn**; single theme (**brutalist mono**: near-black `#0A0A0A` / off-white
  `#F5F4EF` + one accent, safety orange `#FF5A00`; radius 0, no shadow, no gradient); **no PWA**.
- **CI OIDC roles** pinned to the **immutable OIDC subject**; role ARNs are **environment secrets**, tooling
  tokens are **repository** secrets (see `/workflow/github-actions`).
- **No client/employer references** in public writing.

## ⚠️ Destructive / requires explicit confirmation
- **Merge to `main` that touches `iac/`** → `infra-apply` = **real AWS infra**. Confirm the `plan`.
- **Merge to `main` that changes reader-facing CONTENT** — boundary **by what the file IS, not by its
  directory, and not by a list**. The copy lives inside `apps/fed`, so "it's only `apps/fed`" is not a
  safety argument. The words are the product, **and they are the least reversible thing here** —
  CloudFront caches, and OG scrapers (LinkedIn, X, WhatsApp) pin the card they first fetch, so a bad
  unfurl outlives the next merge.

  **The rule, which is what you apply:** *if a diff changes **words or images** a reader or a crawler will
  see, it is boundary* — whatever file they live in, whether prose, a data field, a meta tag, alt text, an
  OG card, a credential badge, or `robots.txt`. "Words" alone would have excluded the OG images the list
  already names.

  **Today that means** — an aid, deliberately **not** the definition: `src/content/**` (articles,
  ramp-up, architecture) · `src/data/profile.ts` (the CV) · `src/data/catalog.ts` (portfolio copy —
  taglines, descriptions, the "proof" lines) · `src/data/repoCards.ts` (ADR-0035) ·
  `src/i18n/messages.ts` (UI copy) · **`src/lib/site.ts`** (`DEFAULT_DESCRIPTION_*`, `OG_IMAGE_ALT` — the
  meta/OG description on **every** page, in both locales) · `src/components/contactChannels.ts` (the
  public e-mail and the prefilled WhatsApp message) · `public/og-*` · `index.html`'s meta.

  **Why a rule and not just the list:** an enumeration **fails open** — anything unlisted reads as safe
  class and merges without the owner. Two proofs, both found while writing this section (#233):
  `catalog.ts` was missing, so an edit to the portfolio's published copy classified as safe. And
  `index.html` was listed while `src/lib/site.ts` was not — `index.html`'s own comment says *"keep in sync
  with `DEFAULT_DESCRIPTION` in `src/lib/site.ts`"*, so **the list named the derived copy and missed the
  authoritative one**. A list will always lag; the rule already covers whatever comes next.

  **Could a check enforce this? No — and that is the point** (#233 asked; this is the answer). A test
  could assert every *listed* path still exists, catching a rename. It cannot catch the failure that
  actually happens, which is **omission**: no check knows about a file nobody thought to list. The
  enforcement has to live in how the rule is *phrased*, which is why it is phrased to fail closed. The
  same holds for the rest of this guide — the route set and workflow names are machine-comparable, but
  a guide is prose about intent, and the drift that matters is a claim that quietly stopped being true,
  not a literal that stopped resolving. **This file is audited by reading it against the code, and the
  moment to do that is when an ADR is amended** — which is where every one of #233's ten discrepancies
  came from.

  *App code and config* under `apps/fed` (components, hooks, tests, build scripts) is safe class — right
  up to the point where a component contains a literal string a reader sees, at which point that diff is
  boundary and the file's directory is irrelevant.
- `terraform apply`/`destroy`; changing DNS / CloudFront / S3 — confirm.
- **IaC is pipeline-only** — `apply`/`destroy` run in CI only. Local is read-only (`fmt`/`validate`/inspection `plan`).

## CI (`.github/workflows/`)
- **`build-test`** (PR **and push to `main`**): dependency audit (ADR-0021 — high/critical prod advisories
  block) → lint → typecheck → test ≥85% → `build:static` → E2E → SonarCloud. Filtered to `apps/fed/**`,
  `packages/shared/**`, **`iac/cloudfront-functions/**`** and its own workflow file. That third path is
  load-bearing, not a stray: the CloudFront rewrite function is JS with behaviour, so it is unit-gated
  here rather than by `infra-plan` (ADR-0018 amendment). "Path-filtered to `apps/fed`" would read as if an
  `iac/` change never reaches this gate — it does.
- **`infra-plan`** (PR): checkov + `fmt`/`validate`/`plan`, path-filtered to `iac/`.
- **`lint-workflows`** (PR): `actionlint` + `shellcheck` over `.github/workflows/**` — the gate that
  did not exist, so a workflow change reported PASS having verified nothing (#79). Note the shape:
  every one of these runs on **every** PR and filters **inside** the job. A workflow-level `paths:`
  filter cannot be a required check — it never reports on a non-matching PR and sits pending — so a
  filtered workflow is permanently advisory. Each ends with a `::notice::` naming which of **three**
  cases happened — *nothing matched, so nothing was verified* · *a step failed, so the rest never ran* ·
  *the gate ran, with the list*. A check that matched nothing must not read like one that passed, and a
  notice that prints the full list after a failure is the same overstatement on the red path.
- **`deploy`** (merge to `main`, paths under `apps/fed`): publishes the static site, then runs a
  **post-deploy E2E smoke against the live apex**. Post-deploy assertions are the *one* exception noted
  under *Branching* above — they are unsatisfiable before the deploy exists.
- **`infra-apply`** (merge to `main`, paths under `iac/`): applies Terraform, waits for the CloudFront
  distribution to finish deploying, then runs **`e2e/edge-rewrite.spec.ts`** — the only check proving the
  CloudFront Function is actually **attached, current, and accepted by the JS 2.0 runtime** (#216).
  It lives **here and not in `deploy`** (#237): this is the workflow that changes the function, and the two
  workflows have **different concurrency groups and no ordering**, so asserting from `deploy` would race
  the apply and — CloudFront taking minutes to propagate — almost certainly report green having measured
  the *previous* function. The wait is not optional for the same reason, one workflow in.
  Its Playwright setup sits **before** the apply, per #195: a red must mean the edge is broken, and an apt
  flake after infrastructure has already been mutated is the ambiguity that rule exists to remove.
- **`version-main`**: numeric SemVer auto-bump + tag + Release (needs a valid `VERSION_BUMP_TOKEN`).
- **`claude`**: `@claude` on-demand (Claude App). The MR review gate is the dev-loop's `critical-reviewer` subagent (in-loop, against the Definition of Done) — the App-based auto-review (`claude-code-review.yml`) was retired as redundant.
