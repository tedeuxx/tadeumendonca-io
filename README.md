# tadeumendonca-pwa

Monorepo for [tadeumendonca.io](https://tadeumendonca.io) — the platform's application workspace **and** the
product itself: an installable, offline-first PWA backed by a serverless BFF, all developed here in-place.

This is **not a static portfolio**. tadeumendonca.io is a real, operated product whose stack and architectural
decisions are part of the engineering argument, delivered in three surfaces:

1. **Interactive digital CV** (`/profile`) — canonical reference of the owner's experience.
2. **Feed** (`/`) — technical analyses, system decisions, engineering reasoning in public.
3. **Blog / long-form articles** (`/blog`) — deep dives with explicit trade-offs.

## Stack

- **Frontend** (`apps/fed`): React 18 + Vite + TypeScript, Tailwind v3 (no shadcn), React Query + Zustand,
  installable offline-first **PWA**. UI is pt-BR.
- **BFF** (`apps/bff`): Hono on AWS Lambda (node22/arm64), `@hono/zod-openapi` (contract generated from code),
  DynamoDB + S3 + SES, AWS Lambda Powertools (logs/metrics/tracing).
- **Infra** (`iac`): Terraform for the application infrastructure (Cognito, SES, API Gateway, S3, CloudFront,
  Lambdas, EventBridge digest). State in Terraform Cloud, **local** execution; `apply`/`destroy` are
  **pipeline-only**.
- **Auth**: AWS Cognito (social-only via Google, hosted-UI PKCE). UI gating is cosmetic — the BFF re-checks the
  `admin` group server-side.

## Architecture

Fully serverless and cost-controlled (scale-to-zero): the SPA talks **only** to the BFF via API Gateway;
the BFF runs **non-VPC** and reaches AWS through public service endpoints scoped by IAM. **snake_case
end-to-end** (DB/JSON/TS, no mapping layer); REST with opaque ids. **SSM is the config bus** between
workloads. Least-privilege per-job/per-env OIDC roles are the primary isolation boundary (staging and
production share one AWS account, separated by tags, names and Terraform workspaces).

## Structure

```
apps/
  fed/    # public SPA (React + Vite + PWA, offline-first)
  bff/    # Backend-for-Frontend (Hono + Lambda + DynamoDB)
iac/      # Terraform for the app infra (Cognito, SES, API GW, S3, CloudFront, …)
VERSION   # single monorepo version (numeric SemVer)
```

## Workflow (GitFlow)

- **`develop`** is the default + integration line. Feature/fix branches cut from `develop` → PR → merge →
  **automatic staging deploy**.
- **`main`** = production (gated by the `production` Environment's required reviewer). *Not stood up yet.*
- **Environment = git branch** (`develop` → staging, `main` → production). Single monorepo version (root
  `VERSION`, tags `vX.Y.Z`).

## CI (`.github/workflows/`)

`fed-ci` / `bff-ci` (lint + typecheck + test ≥85% coverage + SonarCloud, gated by path filters);
`infra-plan` (checkov + plan). Deploys: `fed-deploy` / `bff-deploy` / `infra-apply`.

## Related repos

- [`tadeumendonca-iac`](https://github.com/tedeuxx/tadeumendonca-iac) — shared infrastructure only (regional WAF)
- [`tadeumendonca-skills`](https://github.com/tedeuxx/tadeumendonca-skills) — Claude Code skills library (plugin + marketplace), consumed here
- [`tadeumendonca-io-aws-landing-zone`](https://github.com/tedeuxx/tadeumendonca-io-aws-landing-zone) — AWS account foundation
