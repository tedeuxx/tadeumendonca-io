# Product ADRs — tadeumendonca.io

Architecture Decision Records for the **product** — the current stack and architectural vision of the
site. Taken together, these ADRs *are* the architecture documentation: every load-bearing decision, and
the reversed ones kept as **History** (superseded).

Practice, format and lifecycle: the plugin's `/workflow/adr` (MADR, light significance gate,
supersede-never-delete). Methodology decisions (the dev-loop machine) live in the plugin's own library.

**Numbering:** append-only in authoring order. The reading groups below are presentation; a decision's
number is fixed once its file exists. A superseded ADR carries the forward link to the ADR that replaced
it (the replacement does not depend on the superseded one's number).

**Reading order:** [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md) is the keystone — *lean by
design, calibrated to strategy* — and every other ADR is read through it.

## Foundations
| ADR | Title | Status |
|---|---|---|
| [0001](./0001-lean-by-design-calibrated-to-strategy.md) | Lean by design — calibrated to the strategic priority | accepted |
| [0002](./0002-fully-static-spa-no-backend.md) | Fully static SPA, no backend | accepted |
| [0003](./0003-trunk-based-single-environment.md) | Trunk-based delivery, single environment | accepted |

## Content, SEO & OG
| ADR | Title | Status |
|---|---|---|
| [0004](./0004-build-time-render-not-ssr-or-edge.md) | Content and OG resolved at build time — not SSR/edge | accepted |
| [0005](./0005-og-coverage-every-public-url.md) | Every public URL is SEO- and OG-complete | accepted |

## Frontend
| ADR | Title | Status |
|---|---|---|
| [0006](./0006-react-vite-typescript.md) | React + Vite + TypeScript | accepted |
| [0007](./0007-tailwind-no-shadcn-own-components.md) | Tailwind, no shadcn — own tokens + components | accepted |
| [0008](./0008-brutalist-mono-identity.md) | Brutalist mono identity (colors, radius-0, visible grid) | accepted |
| [0009](./0009-self-hosted-fonts.md) | Self-hosted fonts (Space Grotesk + JetBrains Mono) | accepted |
| [0010](./0010-routing-landing-cv-split-redirects.md) | Client-side routing + landing/CV split + back-compat redirects | accepted |
| [0011](./0011-ui-ptbr-i18n-deferred.md) | UI in pt-BR; i18n deferred | accepted |
| [0012](./0012-snake-case-content-no-mapping.md) | snake_case content/data, no mapping layer | accepted |

## Infrastructure
| ADR | Title | Status |
|---|---|---|
| [0013](./0013-s3-cloudfront-hosting.md) | S3 + CloudFront (PriceClass_100) + CloudFront Function URL-rewrite | accepted |
| [0014](./0014-terraform-cloud-pipeline-only.md) | Terraform + Terraform Cloud, pipeline-only apply/destroy | accepted |
| [0015](./0015-oidc-immutable-subject-least-privilege.md) | GitHub OIDC deploy roles — immutable subject, least-privilege | accepted |
| [0016](./0016-custom-email-via-icloud.md) | Custom email via iCloud (MX/DKIM/SPF) | accepted |
| [0017](./0017-no-waf-no-cmk-ssm-string-only.md) | No WAF, no CMK, SSM String-only config bus | accepted |

## SDLC, quality & security
| ADR | Title | Status |
|---|---|---|
| [0018](./0018-ci-gates-e2e-on-pr-coverage.md) | CI gates (build-test + infra-plan) — E2E on the PR, unit coverage ≥85% | accepted |
| [0019](./0019-complete-functional-regression.md) | Complete automated functional regression (E2E now; API when a backend exists) | accepted |
| [0020](./0020-sonarcloud-quality-gate.md) | SonarCloud quality gate (SAST + coverage + smells), blocking | accepted |
| [0021](./0021-application-security-posture.md) | Security posture — minimal by no-backend; Sonar SAST + package-vulnerability scanning | accepted |
| [0022](./0022-numeric-semver-auto-release.md) | Numeric SemVer, auto-bump + release on merge | accepted |
| [0023](./0023-observability-static-site.md) | Observability = GA + client error surface + prerender smoke | accepted |

## Presence / cross-surface
| ADR | Title | Status |
|---|---|---|
| [0024](./0024-profile-canonical-cv-cross-surface.md) | `profile.ts` as canonical structured CV; cross-surface coherence (LinkedIn, Canva) | accepted |

## History (superseded — reverse-engineered, kept not deleted)
| ADR | Title | Superseded by |
|---|---|---|
| [0025](./0025-superseded-backend-platform.md) | Backend-ful platform (BFF/Lambda · DynamoDB · Cognito · SES · Lambda@Edge) | 0002 |
| [0026](./0026-superseded-lambda-edge-og.md) | Lambda@Edge OG renderer | 0004 |
| [0027](./0027-superseded-backend-link-unfurl.md) | Backend link-unfurl / OG preview cards | 0004 |
| [0028](./0028-superseded-gitflow-two-env.md) | GitFlow, staging + production two-environment | 0003 |
| [0029](./0029-superseded-offline-first-pwa.md) | Offline-first PWA | 0002 |
| [0030](./0030-superseded-monorepo-pwa.md) | Monorepo `tadeumendonca-pwa` consolidation | the `-io` rename + static pivot |
| [0031](./0031-superseded-shared-regional-waf.md) | Shared regional WAF | 0017 |

## Known gaps (honest — surfaced by the reverse-engineering, tracked as follow-up Issues)
- ~~**No `sitemap.xml` / `robots.txt`** (ADR-0005)~~ — **RESOLVED** ([#51](https://github.com/tedeuxx/tadeumendonca-io/issues/51)): build emits `sitemap.xml` + ships `robots.txt`; on-page SEO and discovery are both complete.
- **No package-vulnerability scanning** (ADR-0021) — Sonar SAST is live; Dependabot / `npm audit` is not. → [#52](https://github.com/tedeuxx/tadeumendonca-io/issues/52)

New ADRs: copy the plugin's `template.md` → `NNNN-kebab-title.md`, next number in sequence. A reversed
decision becomes `superseded by ADR-XXXX` and links forward — never deleted.
