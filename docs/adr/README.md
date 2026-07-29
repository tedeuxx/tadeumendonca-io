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
| [0010](./0010-routing-landing-cv-split-redirects.md) | Client-side routing + landing/CV split + back-compat redirects | accepted · amended 2026-07-24 (CV route `/cv → /me`, "Perfil / Profile" label; `/cv`·`/profile` redirect) · amended 2026-07-25 (`/architecture`, a fifth public surface; single English slug, bilingual label + body) · updated 2026-07-26 (its deferred "localized URLs" question is now made in [0036](./0036-per-locale-urls-prerender-hreflang.md); its deferred dual-slug question is resolved for the blog surface in [0037](./0037-localized-article-slugs.md)) |
| [0012](./0012-snake-case-content-no-mapping.md) | snake_case content/data, no mapping layer | accepted |
| [0032](./0032-i18n-locale-layer-english-baseline.md) | i18n — light in-repo locale layer, native auto-detect + toggle, English-pinned crawlable baseline | accepted · Slice 2 completed by [0036](./0036-per-locale-urls-prerender-hreflang.md) (English-pinned prerender clause retired) |
| [0036](./0036-per-locale-urls-prerender-hreflang.md) | Language is addressable — symmetric `/pt` · `/en` URL prefixes, per-locale prerender, hreflang + OG-per-locale (x-default = English; no edge, `iac/` untouched) | accepted · blog-slug clause revised by [0037](./0037-localized-article-slugs.md) (localized article slugs; per-locale URLs/prerender/hreflang otherwise stand) · amended 2026-07-27 (x-default is the **prefixed** English canonical on every route but the root; invariant: a URL may be advertised only if the build prerenders it) · amended 2026-07-28 (the reader's own edition is **offered**, never redirected to — second key `locale-suggestion-dismissed`; invariant: the prerender is not a visitor) |
| [0035](./0035-static-repo-cards-in-longform.md) | Curated repos as static cards in long-form — lone-URL facade + leaf-bilingual field, no third-party fetch | accepted |
| [0037](./0037-localized-article-slugs.md) | Article slugs are localized — a locale-matched slug per edition (identity = filename key, not a URL; blog surface only; `iac/` untouched) | accepted · clarified 2026-07-27 by [0036](./0036-per-locale-urls-prerender-hreflang.md)'s amendment (its "x-default = the English slug" means the **prefixed** English slug) |

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
| [0018](./0018-ci-gates-e2e-on-pr-coverage.md) | CI gates (build-test + infra-plan + lint-workflows) — E2E on the PR, unit coverage ≥85% | accepted · amended 2026-07-23 (`lint-workflows`; why a filtered workflow cannot be required) · amended 2026-07-28 (gate ownership is by what a file IS, not its directory: a behaviour-bearing file under `iac/` is unit-gated by `build-test`) |
| [0019](./0019-complete-functional-regression.md) | Complete automated functional regression (E2E now; API when a backend exists) | accepted |
| [0020](./0020-sonarcloud-quality-gate.md) | SonarCloud quality gate (SAST + coverage + smells), blocking | accepted · amended 2026-07-28 (scope widened to `apps/fed/scripts` — the build tooling was outside the index entirely; `iac/` + workflows remain the open gap) |
| [0021](./0021-application-security-posture.md) | Security posture — minimal by no-backend; Sonar SAST + package-vulnerability scanning | accepted · amended 2026-07-27 (third lever: supply-chain execution control — `npm ci --ignore-scripts` in every CI install) |
| [0022](./0022-numeric-semver-auto-release.md) | Numeric SemVer, auto-bump + release on merge | accepted |
| [0023](./0023-observability-static-site.md) | Observability = GA + client error surface + prerender smoke | accepted · refined by [0033](./0033-ga4-consent-gated-analytics.md) (GA4, consent gate) |
| [0033](./0033-ga4-consent-gated-analytics.md) | GA4, consent-gated — hard opt-in gate, not Consent Mode v2 | accepted |

## Presence / cross-surface
| ADR | Title | Status |
|---|---|---|
| [0024](./0024-profile-canonical-cv-cross-surface.md) | `profile.ts` as canonical structured CV; cross-surface coherence (LinkedIn, catalog, X, newsletter) | accepted · amended 2026-07-28 (Canva CV **retired** — the site's `/me` + `/cv.pdf` are the only CV editions; teardown deferred by [0034](./0034-build-time-cv-pdf-static-artifact.md)) |
| [0034](./0034-build-time-cv-pdf-static-artifact.md) | Downloadable CV = build-time PDF printed from `/me` to a static asset | accepted · amended 2026-07-26 (PDF source route string `/me → /en/me` per [0036](./0036-per-locale-urls-prerender-hreflang.md)) |
| [0038](./0038-content-distribution-linkedin-and-x.md) | Published content is distributed to LinkedIn **and** X in the same batch — medium-adapted copy, canonical URL, mechanics private | accepted · amended 2026-07-27 (privacy clause narrowed: the draft **generator** is repo tooling because it resolves share URLs from the prerendered route list; only its output stays private) · the bare-x-default hazard its amendment describes was fixed at source 2026-07-27 by [0036](./0036-per-locale-urls-prerender-hreflang.md)'s amendment (#200) |

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
| [0011](./0011-ui-ptbr-i18n-deferred.md) | UI in pt-BR; i18n deferred | 0032 |

## Known gaps (honest — surfaced by the reverse-engineering, tracked as follow-up Issues)
- ~~**No `sitemap.xml` / `robots.txt`** (ADR-0005)~~ — **RESOLVED** ([#51](https://github.com/tedeuxx/tadeumendonca-io/issues/51)): build emits `sitemap.xml` + ships `robots.txt`; on-page SEO and discovery are both complete.
- ~~**No package-vulnerability scanning** (ADR-0021)~~ — **RESOLVED** ([#52](https://github.com/tedeuxx/tadeumendonca-io/issues/52)): blocking `audit-ci` gate in `build-test` (high/critical prod deps) + Dependabot; the AppSec floor is whole.

New ADRs: copy the plugin's `template.md` → `NNNN-kebab-title.md`, next number in sequence. A reversed
decision becomes `superseded by ADR-XXXX` and links forward — never deleted.
