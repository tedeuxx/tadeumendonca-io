# tadeumendonca-pwa

**Monorepo of the tadeumendonca.io platform — the active app workspace AND the product itself.** All app
development (frontend, BFF, app infra) happens **here, in-place**. `-api`/`-fed` were archived then deleted
(their history is preserved here via `git subtree`).

> Convention: everything **published on GitHub** (this file, READMEs, descriptions, commit/PR text, issues)
> is written in **English**. The product UI is pt-BR; that's product content, not GitHub publication.

## Engineering principles (always-on floor — non-negotiable)
This repo consumes the **`tadeumendonca-skills`** plugin's principles layer (enabled in `.claude/settings.json`;
its `PreToolUse` permission-guard hook activates automatically). The spine is **agent-led verification,
human-residual**: the agent proves "done" with mechanical gates and real evidence; the human is left only the
irreversible/architectural judgment and the production go/no-go. The floor below **never bends to risk**:
- **Plan-first** — design and align before coding; no solo architectural call.
- **Ask on the boundaries** — architecture, contracts (API/schema/DynamoDB), anything irreversible or
  production-facing; decide autonomously on in-pattern implementation.
- **Thin vertical slices, WIP = 1** — each increment end-to-end and reviewable; finish one before the next.
- **Quality is a gate** — tests + coverage ≥ 85% + lint/typecheck + review, and **100% functional E2E + API
  regression** (every feature ships its own; the suite is the proof nothing already working broke).
- **Observability is part of done** — structured logs + metrics + tracing (CloudWatch + X-Ray) + post-deploy smoke.
- **Security & resilience by-design** — least-privilege, idempotency, fail-fast/open, retries, light threat-modeling.
- **Rigor calibrated to blast-radius** — heavy where irreversible/production, product-speed where cheap to revert;
  the floor above is what it never turns below.

**Trunk-based** (merge to `main` → deploy to the single environment); **IaC is pipeline-only**; local dev is
**static** (the site is a fully static SPA — no backend). The agent
works the full inner loop unprompted (git-reversible / staging-scoped) and is **denied the irreversible/production
boundary** (push/merge to `main`, `terraform apply`/`destroy`, direct cloud mutation, force-push, `rm -rf`, secret
writes); **never `--dangerously-skip-permissions`**. Depth lives in the plugin's `/principles/*` skills
(`engineering-philosophy`, `verification-and-gates`, `dev-loop`, `permissions-and-environments`); for deliberate
validation of a non-trivial decision, invoke the **`principles-guide`** subagent.

## Purpose in the platform (why it exists — NOT a portfolio)
tadeumendonca.io is the owner's **proof-of-engineering product** — a **real product** he designs, builds and
operates, to reposition from "Architect (AWS Professional Services / consulting)" to **Senior Software
Engineer** at product companies. The site is **not a static portfolio**: the stack and the architectural
decisions **are part of the argument**. **This repo is the product visitors see**, delivering 3 phases:
1. **Interactive digital CV** (`/profile`) — canonical reference of the owner's experience (richer than a PDF; aligned word-for-word with LinkedIn + the Canva CV).
2. **Feed** (`/`) — technical analyses, system decisions, engineering reasoning in public.
3. **Blog / long-form articles** (`/blog`) — deep dives, explicit trade-offs, distributed-systems / AWS patterns.

**Operating implications (RULES, not flavor):** defensible decisions with documented trade-offs (the code is
public and IS the pitch); **no over-engineering** (simplest thing that solves it) but **not a playground**
(it's a product that must work); fixed principles — **cloud-native**, **IaC-first** (zero ClickOps),
**scale-to-zero / cost-controlled**, **observability from day 1** (CloudWatch + X-Ray), **CI/CD from commit 1**.

## Architectural decisions, requirements & trade-offs (the rationale — read before changing infra)
Two requirements are in tension; every decision below resolves them.
- **R1 — run a REAL product on a personal budget:** scale-to-zero, cost-controlled, no always-on spend.
- **R2 — keep a DEFENSIBLE security posture:** security is part of the engineering argument; access control is non-negotiable.

**Traded AWAY for cost (R1 — deliberate, acceptable, documented):**
- **No private networking.** The BFF runs **non-VPC**; there are **no NAT Gateways, no private subnets, no
  VPC endpoints**. NAT (~$32/mo per env + data processing) was the single largest line item — dropping it
  roughly halved per-env cost. *Acceptable because* the BFF is stateless and reaches AWS only via public
  service endpoints scoped by IAM; nothing sensitive sits on a network we'd need to isolate. *Revisit only*
  if a VPC-only resource (RDS/ElastiCache) is ever introduced.
- **No account-level environment isolation.** Staging and production share **ONE AWS account**, separated by
  `Environment`/`Project` tags, per-env resource names (`*-staging`/`*-production`), and per-env Terraform
  workspaces — **not** separate AWS Organizations accounts. *Acceptable because* multi-account adds real
  overhead/cost not justified for a solo product. *The weaker cross-env blast-radius isolation is deliberately
  compensated by R2 below.*

**Invested in DESPITE cost (R2 — NOT cut; it compensates for what R1 gave up):**
- **Least-privilege CI roles — the IAM role boundary IS our isolation.** Because there is no account boundary
  between envs, IAM is the primary isolation mechanism, so it is **not optional**:
  - **Per-job least privilege:** distinct OIDC roles — the iac runner may create/delete anything; **bff-deploy**
    may only update its Lambda code; **fed-deploy** may only sync its bucket + invalidate CloudFront. A bug or
    compromise in one pipeline cannot touch another's resources.
  - **Per-env roles:** `github-actions-…-{staging,production}` are distinct — a leaked staging OIDC token can't
    assume the production role, and the prod role is released only after the `production` Environment's
    required-reviewer approval. This restores the env isolation the single-account choice gave up.
- **WAF** (shared regional baseline, in `-iac`), **Cognito threat protection** (PLUS tier, ~$0.05/MAU —
  accepted over the free ESSENTIALS tier), and the **production approval gate** are kept as the defensible posture.

**Other cost-shaped choices (R1):** fully serverless (Lambda + **DynamoDB on-demand** + S3/CloudFront static)
so cost tracks traffic and is ~zero when idle; **CloudFront `PriceClass_100`** (NA+EU edges only);
**Lambda@Edge only for bots** (humans pass through, minimizing the pricier L@E invocations); **OG images
generated once, cached in S3**; **EventBridge cron** for the newsletter digest (pay-on-fire); **Terraform
Cloud free tier + Local execution** (no paid TFC runners); **AWS Support on Basic** (free — flag before any
paid plan reappears).

## Branching strategy (this repo: trunk-based)
- **`main`** is the only branch. Feature/fix branches cut **from `main`** → PR (0 approvals) → merge →
  **automatic deploy** to the single environment (no manual gate).
- **Single deployed environment** (`tadeumendonca-pwa-staging` workspace, kept as-is internally); the public
  site serves at the **apex** `tadeumendonca.io`.
- **Single monorepo version** (numeric SemVer, root `VERSION`): `version-main` **auto-bumps patch** on every
  push to `main`, tags `vX.Y.Z`, publishes a Release. The `bump:` commit is loop-guarded. Apps' own
  `package.json` versions are NOT the release version.
- `-iac` uses the **same** trunk-based model. **`-skills` uses a different model** (plugin release-cut — see
  its CLAUDE.md): there `main` is the published release consumers track, not a deploy target.

## Structure
- **`apps/fed/`** — public SPA (React + Vite + PWA, offline-first). Own guide in `apps/fed/CLAUDE.md`.
- **`apps/bff/`** — Backend-for-Frontend (Hono + Lambda + DynamoDB). Own guide in `apps/bff/CLAUDE.md`.
- **`iac/`** — Terraform for the **app infra** (Cognito, SES, API GW, S3, CloudFront, lambdas, EventBridge
  digest…). State in Terraform Cloud (`tadeumendonca-pwa-{staging,production}`), **Local** execution.

## Sibling repos (active)
- **`tadeumendonca-iac`** — **shared infra only** (regional WAF). Touch it only for cross-workload concerns.
- **`tadeumendonca-skills`** — Claude Code skills library (plugin + marketplace), consumed by this repo + `-iac`.

## Fixed decisions (do NOT revert without discussion)
- **Monorepo** with a **single version**. **SSM as the config bus** between workloads (acyclic DAG, no `terraform_remote_state`).
- **Social-only auth via Google** (Cognito hosted-UI PKCE; no native signup). UI gating is **cosmetic** — the BFF re-checks the group server-side.
- **snake_case** end-to-end (DB/JSON/TS, no mapping layer). **REST**, opaque ids (slug/hashid). **Product UI in pt-BR** (no i18n framework).
- **fed:** own Tailwind, **no shadcn**; single theme (BVB identity: black/graphite/gold); **offline-first PWA**.
- **bff:** Hono + Lambda in **Pattern B** (code ships via the pipeline's `update-function-code`; Terraform uses `ignore_source_code_hash`, so an `apply` does NOT revert deployed code); per-entity DynamoDB tables.
- **Secrets:** OIDC role ARNs = **environment secrets per-env**; tooling tokens = **repository** (see `/workflow/github-actions`).

## ⚠️ Destructive / requires explicit confirmation
- **Merge to `main`** → automatic deploy (app) and, if it touches `iac/`, `infra-apply` = **real AWS infra**. Confirm the `plan`.
- `terraform apply`/`destroy`; changing DNS/CloudFront/S3 — irreversible, confirm.
- **IaC is pipeline-only** — `apply`/`destroy` run in CI only. Local is read-only (`fmt`/`validate`/inspection `plan`).

## CI (`.github/workflows/`)
`fed-ci`/`bff-ci` (lint + typecheck + test ≥85% + SonarCloud, gated by `dorny/paths-filter`); `infra-plan`
(checkov + plan). Deploys: `fed-deploy`/`bff-deploy`/`infra-apply`. Claude App: `@claude` + auto-review.

## Current status (point-in-time — 2026-06-21)
- **Staging live and migrated** (app + infra + auth). `-pwa` production is still **greenfield** (not stood up).
- **Pending — Stage B (the dedup, the #1 motivation for the migration):** extract the duplicated api↔fed logic
  into a **`packages/shared`** with **npm workspaces** (root `package.json` has no `workspaces` yet, no
  `packages/`). `extractUrls`/unfurl and the shared types (Post/Article/FeedItem) are still duplicated in
  `apps/bff/src/modules/unfurl/` AND `apps/fed/src/hooks/useUnfurl.ts`.
- **Pending:** create the **`main`** branch + stand up production.
- **Roadmap (approved plan):** Phases F,0,1,2,3 done; next = **Phase 4** (Medium-like editor: sanitized HTML
  body + TipTap + inline images via the assets pipeline + Giphy via a BFF proxy) → Phase 5 (content automation
  + LinkedIn syndication).
