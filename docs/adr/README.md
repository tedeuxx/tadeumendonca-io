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
| 0006 | React + Vite + TypeScript | pending |
| 0007 | Tailwind, no shadcn — own tokens + components | pending |
| 0008 | Brutalist mono identity (colors, radius-0, visible grid) | pending |
| 0009 | Self-hosted fonts (Space Grotesk + JetBrains Mono) | pending |
| 0010 | Client-side routing + landing/CV split + back-compat redirects | pending |
| 0011 | UI in pt-BR; i18n deferred | pending |
| 0012 | snake_case content/data, no mapping layer | pending |

## Infrastructure
| ADR | Title | Status |
|---|---|---|
| 0013 | S3 + CloudFront (PriceClass_100) + CloudFront Function URL-rewrite | pending |
| 0014 | Terraform + Terraform Cloud, pipeline-only apply/destroy | pending |
| 0015 | GitHub OIDC deploy roles — immutable subject, least-privilege | pending |
| 0016 | Custom email via iCloud (MX/DKIM/SPF) | pending |
| 0017 | No WAF, no CMK, SSM String-only config bus | pending |

## SDLC, quality & security
| ADR | Title | Status |
|---|---|---|
| 0018 | CI gates (build-test + infra-plan) — E2E on the PR, unit coverage ≥85% | pending |
| 0019 | Complete automated functional regression (E2E now; API when a backend exists) | pending |
| 0020 | SonarCloud quality gate (SAST + coverage + smells), blocking | pending |
| 0021 | Security posture — minimal by no-backend; Sonar SAST + package-vulnerability scanning | pending |
| 0022 | Numeric SemVer, auto-bump + release on merge | pending |
| 0023 | Observability = GA + client error surface + prerender smoke | pending |

## Presence / cross-surface
| ADR | Title | Status |
|---|---|---|
| 0024 | `profile.ts` as canonical structured CV; cross-surface coherence (LinkedIn, Canva) | pending |

## History (superseded — reverse-engineered, kept not deleted)
| ADR | Title | Superseded by |
|---|---|---|
| 0025 | Backend-ful platform (BFF/Lambda · DynamoDB · Cognito · SES · Lambda@Edge) | 0002 |
| 0026 | Lambda@Edge OG renderer | 0004 |
| 0027 | Backend link-unfurl / OG preview cards | 0004 |
| 0028 | GitFlow, staging + production two-environment | 0003 |
| 0029 | Offline-first PWA | 0002 |
| 0030 | Monorepo `tadeumendonca-pwa` consolidation | the `-io` rename + static pivot |
| 0031 | Shared regional WAF | 0017 |

## Known gaps (honest — surfaced by the reverse-engineering, to become follow-up Issues)
- **No `sitemap.xml` / `robots.txt`** (ADR-0005) — on-page SEO is complete; crawl-directives/discovery are not.
- **No package-vulnerability scanning** (ADR-0021) — Sonar SAST is live; Dependabot / `npm audit` is not.

New ADRs: copy the plugin's `template.md` → `NNNN-kebab-title.md`, next number in sequence. A reversed
decision becomes `superseded by ADR-XXXX` and links forward — never deleted.
