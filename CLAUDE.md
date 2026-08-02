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
> as the x-default entry). That's content, not GitHub publication. **No exceptions** — `src/data/catalog.ts`
> was the last one (it served Portuguese on `/en/portfolio` until #235) and now carries the same
> leaf-bilingual type as everything else, so a missing translation is a compile error.

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
   a capability. `/me` is the full edition; `/cv.pdf` is the two-page recruiter edition printed from it at
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
  work implementing an already-approved spec, **and the whole `product` backlog including
  reader-facing copy**) or **escalates the boundary class to the owner** — which since 2026-07-30 is
  three things and no longer includes reader-facing content: **`iac/`** and anything that threatens
  the site's continuity, **a change to the dev-loop's own rules** (this section, the ⚠️ section, an
  ADR that decides how work is decided), and **publishing an article** (the `content` backlog — the
  owner's voice). Contract/schema still escalates as `iac/`-adjacent. **An ADR amendment that *decides*
  something is safe class** (owner, 2026-07-31) — ADR-0003's 2026-07-29 table said otherwise and that
  clause is struck; the only ADRs that still escalate are the ones covered by the second item above,
  which decide *how work is decided*. *Significance beats in-pattern:* when the class is
  unclear, it is boundary. **The reviewer never merges an expansion of its own authority** — a change to
  this guide's merge rules is boundary by construction, whatever the diff looks like.
  A green CI is **not** a substitute for the review — CI proves nothing broke, the reviewer judges
  whether the change is right.
- **How a ratification is proven, and what no longer needs one** — the rule lives in
  **[ADR-0003](./docs/adr/0003-trunk-based-single-environment.md)'s 2026-07-29 amendment**, not here, so it
  is inside the decision record where the next sweep can audit it. In short: the owner ratifies by
  **commenting on the PR** and the reviewer **verifies that comment itself** (`gh pr view --json comments`
  — author, OWNER association, and that it post-dates the head); a relay is a notification, never the
  authority (#217). And **record correction is safe class** — a change that only makes the record match
  decisions already ratified, asserting nothing beyond a pointer to the ADR that superseded it, the
  reviewer merges. A discharge that asserts a new **fact** or reinterprets **scope** is still boundary.
  Read the amendment before classifying; the table there is the operative text.
- **Single environment** (the `tadeumendonca-io` TFC workspace); the public
  site serves at the **apex** `tadeumendonca.io`.
- **Single version** (numeric SemVer, root `VERSION`): the deploy's **`release`** job auto-bumps the patch
  on every push to `main`, tags `vX.Y.Z`, publishes a Release. The `bump:` commit is loop-guarded. It is
  the deploy's *first* job rather than a workflow of its own because `VERSION` is a **build input** — the
  bundle's footer renders it, so the bump has to precede the build that ships.

## Structure
- **`apps/fed/`** — the static SPA (React + Vite + Tailwind, no PWA). Own guide in `apps/fed/CLAUDE.md`.
- **`iac/`** — Terraform for the frontend infra (S3, CloudFront + URL-rewrite function, email, OIDC roles)
  plus the account cost budget. State in Terraform Cloud, **Local** execution; `apply`/`destroy` are
  **pipeline-only**. Note `iac/cloudfront-functions/` holds **application logic in JS**, unit-gated by
  the **`app`** workflow rather than only by `iac` — gate ownership is by what a file IS, not its
  directory (ADR-0018 amendment). It is filtered by **both**: `app` proves the rewrite logic, `iac` proves
  the edge is running it, since `frontend.tf` reads that file and an edit to it is a Terraform diff.
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
- **The vocabulary for the practice is fixed, and it lives in `.brand/positioning.md`** — read it before
  writing copy that names the practice (owner decision, #245). The hierarchy, and which term is
  authoritative in which slot, is recorded there with the rest of the positioning and is **not** repeated
  here.

  **`agent-driven` is retired from reader-facing site copy** — the one part of that decision that is a
  repo fact rather than a positioning one. It survives in historical records (an ADR, the redesign comp)
  and those are not rewritten: supersede, never rewrite.

## ⚠️ Destructive / requires explicit confirmation
- **Merge to `main` that touches `iac/`** → the deploy's **`terraform-apply`** job = **real AWS infra**.
  Confirm the `plan`.
- **Publishing an ARTICLE** — the `content` backlog. Boundary because it is the owner's *voice*: what
  the piece argues, in whose words, is not a thing an agent supplies. This is the one content class
  that still routes to the owner, and the label is the boundary (owner decision, 2026-07-30).

  **Everything in the `product` backlog is safe class, including what a reader sees.** Prose on a
  page, the CV, portfolio copy, UI strings, OG cards, alt text — the reviewer merges them. The owner
  validates the product as a whole and adjusts afterwards; a correction costs a merge and an
  invalidation, and that cost is theirs to accept, which they did.

  **This supersedes the previous rule** — *"if a diff changes words or images a reader or a crawler
  will see, it is boundary"* — which stood from #233 until 2026-07-30. Where the boundary sits changed;
  **how any list in this guide fails did not.** That argument is restated in full inside ADR-0003's
  2026-07-30 amendment rather than left as a pointer, because it governs every enumeration here and
  outlives the rule it was written for. Supersede, never rewrite — including the reasoning.

  **The one residue, stated so it is a known cost rather than an oversight:** OG scrapers (LinkedIn,
  X, WhatsApp) pin the card they first fetch, so a wrong unfurl on an already-shared post is not
  fixed by the next merge — it stays wrong *on that post* and right everywhere after. The owner was
  shown this and accepted it. It is a bounded, per-post cost, not a threat to the site.

  **`brand-guardian` and `editor` are still dispatched on reader-facing diffs — by the reviewer's own
  instructions, not by any check.** Nothing mechanical enforces it, and the owner is no longer a second
  backstop behind them, so a lens that is not dispatched now fails silently. Narrowing what reaches the
  owner does not narrow what gets reviewed — those lenses catch calques, positioning drift and
  cross-surface contradiction, which is exactly the class the owner is *not* well placed to catch by
  reading the finished page. They advise the reviewer; they no longer wake the owner.

  The `reader-facing` label on the `product` queue is now an **ordering and lens** signal — which
  reviewers to dispatch — not a gate.
- `terraform apply`/`destroy`; changing DNS / CloudFront / S3 — confirm.
- **IaC is pipeline-only** — `apply`/`destroy` run in CI only. Local is read-only (`fmt`/`validate`/inspection `plan`).

## CI (`.github/workflows/`)
**The full map — diagrams, per-job path filters, and the reasons behind each — lives in
[`.github/workflows/README.md`](./.github/workflows/README.md). Read it before changing a workflow.**
It is kept next to the YAML deliberately: GitHub renders it when you open that directory, which is
where the questions get asked.

**Four workflows, each named after the top-level directory it gates.** Jobs are named after the command
they run; a job running a pipeline is named after the script.

- **`app`** (`apps/**`) — `npm-ci` → `npm-audit` · `eslint` · `tsc` · `vitest` · `build-static` →
  `playwright` · `sonarqube-scan`, behind a terminal **`build-test`** aggregator (that name is fixed by
  branch protection). Dependency audit blocks on high/critical prod advisories (ADR-0021); coverage ≥85%;
  SonarCloud's gate blocks.
- **`iac`** (`iac/**`) — credential-free `checkov` and `terraform-fmt` in parallel, then
  **`terraform-plan`** (init + validate + plan), the **only** job holding an AWS token. The cut is
  credentials, not commands.
- **`github`** (`.github/**`) — **`actionlint`** + shellcheck. Its own file on purpose: living inside
  `app` would mean a syntax error in `app` stops the linter that exists to catch it.
- **`deploy`** (push to `main`, skipping its own `bump:` commits) — `release` (bump + tag + Release) →
  `gate` → `terraform-apply` / `deploy-app` → `e2e` against the live apex. `release` must precede the
  build because `VERSION` is a build input; `terraform-apply` must precede `deploy-app` because the app
  resolves its bucket and distribution from SSM parameters Terraform creates.

**Two filter facts that look like mistakes and are not.** `iac/cloudfront-functions/**` is in **both**
the `app` and `iac` filters — it is JS with behaviour *and* a Terraform diff, and the two gates prove
different things (ADR-0018 amendment). And `VERSION` is in the **PR** gate's filter but deliberately
**not** in the deploy gate's: the deploy diffs `<last tag>..HEAD`, and HEAD *is* the bump commit, whose
whole content is that file — including it would make the filter match everything, always.

**Every PR workflow runs on every PR and filters inside the job.** A workflow-level `paths:` filter can
never be a required check: on a non-matching PR it never reports and sits pending. Each ends with a
`::notice::` naming which of three cases happened — *nothing matched, so nothing was verified* · *a step
failed, so the rest never ran* · *the gate ran, here is the list*. A check that matched nothing must not
read like one that passed.

**The post-deploy `e2e` is not a gate.** It runs after the publish and cannot revert anything. A red one
means the site is broken and someone has to act.

- **`claude`**: `@claude` on-demand (Claude App). The MR review gate is the dev-loop's `critical-reviewer` subagent (in-loop, against the Definition of Done) — the App-based auto-review (`claude-code-review.yml`) was retired as redundant.
