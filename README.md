# tadeumendonca-io

The public presence for [tadeumendonca.io](https://tadeumendonca.io) — a **fully static SPA** that serves as
the owner's proof-of-engineering: an interactive CV, a portfolio that links to a curated catalog of automations
and agentic tools, and a blog. It backs a repositioning to **AI Engineer** (agentic development / AI-native
automations), anchored in SDLC and distributed systems.

Three surfaces:

1. **Interactive CV** (`/`) — canonical reference of the owner's experience.
2. **Portfolio** (`/portfolio`) — a curated catalog of public repos (automations, agents, MCP servers, AI-native tools) that back the positioning with real code.
3. **Blog** (`/blog`) — long-form engineering writing with explicit trade-offs.

## Stack

- **Frontend** (`apps/fed`): React 18 + Vite + TypeScript, Tailwind v3 (no shadcn), **no PWA**. Content (CV, articles) is **markdown in the repo**; the build **prerenders each route** (Playwright)
  so OG/SEO tags land in the served HTML. UI copy is pt-BR.
- **Infra** (`iac`): Terraform for the frontend only — S3 + CloudFront (with a viewer-request URL-rewrite
  function), custom email via iCloud, and the GitHub OIDC deploy roles. State in Terraform Cloud, **local**
  execution; `apply`/`destroy` are **pipeline-only**.

There is **no backend** — no API, database, auth, or Lambda. Cost is near-zero / scale-to-zero (static objects
on CloudFront); the CI OIDC roles are least-privilege and pinned to the repo's immutable OIDC subject.

## Structure

```
apps/
  fed/    # the static SPA (React + Vite + Tailwind, no PWA)
iac/      # Terraform for the frontend infra (S3, CloudFront, email, OIDC roles)
VERSION   # single version (numeric SemVer)
```

## Workflow (trunk-based)

- **`main`** is the only branch. Feature/fix branches cut from `main` → PR → merge → **automatic deploy** to the
  single environment; the site serves at the apex `tadeumendonca.io`.
- Single version (root `VERSION`, tags `vX.Y.Z`); `version-main` auto-bumps patch on every push to `main`.

## CI (`.github/workflows/`)

`build-test` (lint + typecheck + test ≥85% + build + E2E + SonarCloud, path-filtered to `apps/fed`); `infra-plan`
(checkov + `plan`, path-filtered to `iac/`); `lint-workflows` (actionlint + shellcheck over
`.github/workflows/**`). Each runs on **every** PR and applies its path filter inside the job, then reports
whether it ran or skipped — a check that matched nothing must not read like one that passed.
Deploys: `deploy` / `infra-apply` on merge to `main`.

## Related repos

- [`tadeumendonca-skills`](https://github.com/tedeuxx/tadeumendonca-skills) — Claude Code skills library (plugin + marketplace), whose principles layer this repo consumes.
