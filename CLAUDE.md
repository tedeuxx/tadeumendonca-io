# tadeumendonca-io

**The owner's proof-of-engineering site — a fully static SPA served on S3 + CloudFront. No backend.**
This repo is the public presence for **tadeumendonca.io**: an interactive CV, a portfolio that links to a
curated **catalog** of automations / agentic tools, and a blog. It was formerly a backend-ful monorepo (a
Hono/Lambda BFF, Cognito, API Gateway, DynamoDB, SES); that backend was **retired** and the site is now static —
content ships as **markdown in the repo**, prerendered at build time for OG/SEO.

> Convention: everything **published on GitHub** (this file, READMEs, descriptions, commit/PR text, issues) is
> written in **English**. The site's UI copy is **bilingual (pt-BR + en, ADR-0032** — auto-detect + toggle,
> English prerender baseline); that's content, not GitHub publication.

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
**`principles-guide`** subagent.

**Trunk-based** (merge to `main` → deploy to the single environment); **IaC is pipeline-only**; local dev is
**static** (fully static SPA, no backend). The agent works the full inner loop unprompted (git-reversible /
staging-scoped) and is **denied the irreversible/public boundary** (push/merge to `main`, `terraform
apply`/`destroy`, direct cloud mutation, force-push, `rm -rf`, secret writes); **never
`--dangerously-skip-permissions`**.

## Purpose (why it exists)
tadeumendonca.io is the owner's **proof-of-engineering** public presence, backing a repositioning to
**AI Engineer** (agentic development / AI-native automations), anchored in SDLC + distributed-systems
experience. The site is the storefront; the **argument is the code it links to**. Three surfaces:
1. **Interactive CV** (`/`) — canonical reference of the owner's experience (richer than a PDF; aligned with LinkedIn + the Canva CV).
2. **Portfolio** (`/portfolio`) — a curated **catalog** of public repos (automations, agents, MCP servers, AI-native tools) that back the positioning with real code. The bar a project must clear to be published is `docs/catalog-ready.md`.
3. **Blog** (`/blog`) — long-form engineering writing with explicit trade-offs (distributed-systems / AI patterns).

**Operating rules (not flavor):** defensible decisions with documented trade-offs (the code is public and IS
the pitch); **no over-engineering** (simplest thing that solves it), but **not a playground** (it must work);
**no client/employer references** in public writing (abstract any war-story to a generic principle).

## Architecture (static — read before changing infra)
A **fully static SPA** (React + Vite + TypeScript, no PWA) built to `dist/` and served from
**S3 + CloudFront**; a **CloudFront Function** (viewer-request) rewrites clean URLs. Content (CV, articles) is
**markdown in the repo** (frontmatter + react-markdown), and the build **prerenders each route** (Playwright
snapshot of `vite preview`) so OG/SEO tags land in the served HTML. There is **no backend** — no API, no
database, no auth, no Lambda.

`iac/` provisions only the frontend: S3 (`storage.tf`), CloudFront + the URL-rewrite function (`frontend.tf`),
custom email via iCloud (MX/DKIM/SPF, `email.tf`), and the GitHub OIDC deploy roles (`iam.tf`). Cost is
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
- **The PR to `main` carries the entire gate.** There is no downstream tier to defer a check to, so
  `build-test` blocking on the PR is the whole verification story — a gate skipped there never runs.
- **`main` is the working branch, not a protected production mirror.** Never add tooling that blocks
  edits or commits by branch context; it would break every slice.

- **`main`** is the only branch. Feature/fix branches cut **from `main`** → PR (0 required approvals) → merge →
  **automatic deploy** to the single environment. The merge **is** the deploy, so it is the go/no-go —
  and **the `critical-reviewer` subagent is who holds it**, not a human prompt on every PR. Run it on
  **every** PR before merging, unprompted; it verifies the MR Definition of Done with real evidence and
  then either **approves-and-merges the safe class itself** (docs, dependency bumps, tests, in-pattern
  work implementing an already-approved spec) or **escalates the boundary class to the owner** (`iac/`,
  contract/schema, positioning or public copy, anything that creates or changes an ADR decision,
  anything irreversible). *Significance beats in-pattern:* when the class is unclear, it is boundary.
  A green CI is **not** a substitute for the review — CI proves nothing broke, the reviewer judges
  whether the change is right.
- **Single environment** (the `tadeumendonca-io` TFC workspace); the public
  site serves at the **apex** `tadeumendonca.io`.
- **Single version** (numeric SemVer, root `VERSION`): `version-main` auto-bumps patch on every push to `main`,
  tags `vX.Y.Z`, publishes a Release. The `bump:` commit is loop-guarded.

## Structure
- **`apps/fed/`** — the static SPA (React + Vite + Tailwind, no PWA). Own guide in `apps/fed/CLAUDE.md`.
- **`iac/`** — Terraform for the frontend infra (S3, CloudFront + URL-rewrite function, email, OIDC roles).
  State in Terraform Cloud, **Local** execution; `apply`/`destroy` are **pipeline-only**.
- **`.brand/`** — **gitignored, local-only, never published.** See below.

## Single workspace for the public presence
This repo is the **one place** the owner's professional presence is maintained from — the site is one
surface among several (LinkedIn, the Canva CV, the GitHub catalog, the newsletter). The positioning,
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
  (A merge that touches only `apps/fed` deploys static objects and is reversible by the next merge — it
  is the `critical-reviewer`'s call per the branching section above, not a standing human prompt.)
- **Merge to `main` that changes positioning or public-facing copy** — the words are the product here;
  the reviewer escalates these rather than merging them.
- `terraform apply`/`destroy`; changing DNS / CloudFront / S3 — confirm.
- **IaC is pipeline-only** — `apply`/`destroy` run in CI only. Local is read-only (`fmt`/`validate`/inspection `plan`).

## CI (`.github/workflows/`)
- **`build-test`** (PR): lint + typecheck + test ≥85% + build + E2E + SonarCloud, path-filtered to `apps/fed`.
- **`infra-plan`** (PR): checkov + `fmt`/`validate`/`plan`, path-filtered to `iac/`.
- **`deploy`** / **`infra-apply`** (merge to `main`): deploy the static site / apply Terraform.
- **`version-main`**: numeric SemVer auto-bump + tag + Release (needs a valid `VERSION_BUMP_TOKEN`).
- **`claude`**: `@claude` on-demand (Claude App). The MR review gate is the dev-loop's `critical-reviewer` subagent (in-loop, against the Definition of Done) — the App-based auto-review (`claude-code-review.yml`) was retired as redundant.
