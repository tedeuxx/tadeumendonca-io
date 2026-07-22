# Product ADRs — tadeumendonca.io

Architecture Decision Records for the **product** — the current stack and architectural vision of the
site. Taken together, these ADRs *are* the architecture documentation: every load-bearing decision, and
the reversed ones kept as `superseded` history.

Practice, format and lifecycle: the plugin's [`/workflow/adr`](https://github.com/tedeuxx/tadeumendonca-skills)
(MADR, light significance gate, supersede-never-delete). Methodology decisions (the dev-loop machine)
live in the plugin's own library, not here.

**Reading order:** [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md) is the keystone — *lean by
design, calibrated to strategy* — and every other ADR is read through it.

## Live decisions

| ADR | Title | Status |
|---|---|---|
| [0001](./0001-lean-by-design-calibrated-to-strategy.md) | Lean by design — calibrated to the strategic priority | accepted |
| [0002](./0002-fully-static-spa-no-backend.md) | Fully static SPA, no backend | accepted |
| [0003](./0003-trunk-based-single-environment.md) | Trunk-based delivery, single environment | accepted |
| 0004 | Content as markdown-in-repo + build-time prerender (OG/SEO) | *pending* |
| 0005 | React + Vite + TypeScript | *pending* |
| 0006 | Tailwind, no shadcn — own tokens + components | *pending* |
| 0007 | Brutalist mono identity (colors, radius-0, grid) | *pending* |
| 0008 | Self-hosted fonts (Space Grotesk + JetBrains Mono) | *pending* |
| 0009 | Client-side routing + landing/CV split + back-compat redirects | *pending* |
| 0010 | UI in pt-BR; i18n deferred | *pending* |
| 0011 | snake_case content/data, no mapping layer | *pending* |
| 0012 | S3 + CloudFront (PriceClass_100) + CloudFront Function URL-rewrite | *pending* |
| 0013 | Terraform + Terraform Cloud, pipeline-only apply/destroy | *pending* |
| 0014 | GitHub OIDC deploy roles — immutable subject, least-privilege | *pending* |
| 0015 | Custom email via iCloud (MX/DKIM/SPF) | *pending* |
| 0016 | No WAF, no CMK, SSM String-only config bus | *pending* |
| 0017 | CI gates (build-test + infra-plan), E2E on the PR, coverage ≥85% | *pending* |
| 0018 | SonarCloud quality gate | *pending* |
| 0019 | Numeric SemVer, auto-bump + release on merge | *pending* |
| 0020 | Observability = GA + client error surface + prerender smoke | *pending* |
| 0021 | `profile.ts` as canonical structured CV; cross-surface coherence (LinkedIn, Canva) | *pending* |

## Superseded (the backend era — reverse-engineered as history)

| ADR | Title | Superseded by |
|---|---|---|
| 0022 | Backend-ful platform (BFF/Lambda · DynamoDB · Cognito · SES · Lambda@Edge) | 0002 |
| 0023 | GitFlow, staging + production two-environment | 0003 |
| 0024 | Offline-first PWA | 0002 |
| 0025 | Monorepo `tadeumendonca-pwa` consolidation | the `-io` rename + static pivot |
| 0026 | Shared regional WAF | 0016 |

New ADRs: copy the plugin's `template.md` → `NNNN-kebab-title.md`. A reversed decision becomes
`superseded by ADR-XXXX` and links forward — never deleted.
