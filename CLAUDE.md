# tadeumendonca-pwa

**Monorepo da plataforma tadeumendonca.io — é o workspace ativo do app.** Todo o desenvolvimento
(frontend, BFF e a infra do próprio app) acontece **aqui, in-place**. Os antigos `-api` e `-fed`
foram **arquivados** (read-only) — não se mexe mais neles.

## Estrutura
- **`apps/fed/`** — SPA pública (React + Vite + PWA, offline-first). Guia próprio em `apps/fed/CLAUDE.md`.
- **`apps/bff/`** — Backend-for-Frontend (Hono + Lambda + DynamoDB). Guia próprio em `apps/bff/CLAUDE.md`.
- **`iac/`** — Terraform da **infra do app** (Cognito, SES, API GW, S3, CloudFront, lambdas, EventBridge
  digest…). State em Terraform Cloud (workspaces `tadeumendonca-pwa-{staging,production}`), execução
  **Local** (o GitHub Actions roda `plan`/`apply`).

## Repos irmãos (ativos)
- **`tadeumendonca-iac`** — **só infra compartilhada** (WAF regional/cloudfront). Toca lá só se for cross-workload.
- **`tadeumendonca-skills`** — biblioteca de skills do Claude (plugin + marketplace).

## Fluxo (GitFlow)
- Branch a partir de **`develop`** → PR (0 approvals) → merge → **deploy automático em staging**.
- `develop` é o default. **`main` ainda NÃO existe** — criar quando houver linha de produção (main = prod
  com aprovação do GitHub Environment `production`).
- **Versionamento:** SemVer **numérico único do monorepo** (`VERSION` na raiz). `version-develop` bumpa
  patch no push pra develop; `version-main` lê o label `semver:` no merge pra main. Tags `vX.Y.Z`. Os
  `package.json` dos apps NÃO são a versão de release.
- **CI:** `fed-ci` / `bff-ci` (lint + typecheck + test ≥85% + SonarCloud) com `dorny/paths-filter` (PR que
  não toca o app finaliza verde sem rodar toolchain); `infra-plan` (checkov + plan). **Deploys:**
  `fed-deploy` / `bff-deploy` / `infra-apply`. **Claude App:** `@claude` + auto-review.

## Convenções (detalhe nos guias dos apps)
- **snake_case** em dados/JSON (espelha o BFF, sem camada de mapeamento). **pt-BR** em toda a UI. REST,
  ids opacos (slug/hashid).
- **Secrets** seguem o padrão do skill `/workflow/github-actions`: OIDC role ARNs são **environment
  secrets per-env** (`AWS_INFRA/BFF/FED_OIDC_ROLE_ARN`, valor diferente por ambiente, role
  `github-actions-…-<env>`); tooling tokens (`TFC_API_TOKEN`, `SONAR_TOKEN`, `CLAUDE_CODE_OAUTH_TOKEN`,
  `VERSION_BUMP_TOKEN`) são **repository**.
- **IaC é pipeline-only** — `apply`/`destroy` só no CI (merge em develop auto-aplica staging; main aplica
  produção com aprovação). Local é read-only (`fmt`/`validate`/`plan` de inspeção).

## Status atual (ponto-no-tempo — 2026-06-21)
- **Staging vivo e migrado** (app + infra + auth Cognito social-only/Google). Produção do `-pwa` ainda
  **greenfield** (não levantada).
- **Pendente — Stage B (a dedup, motivação nº1 da migração):** extrair a lógica duplicada api↔fed pra um
  **`packages/shared`** com **npm workspaces** (o root `package.json` ainda não tem `workspaces`, não há
  `packages/`). Hoje `extractUrls`/unfurl e tipos (Post/Article/FeedItem) seguem duplicados em
  `apps/bff/src/modules/unfurl/` **e** `apps/fed/src/hooks/useUnfurl.ts`.
- **Pendente:** criar o branch **`main`** (linha de produção) e levantar o ambiente de produção.
- **Roadmap (plano aprovado):** Phases F,0,1,2,3 concluídas; próximo = **Phase 4** (editor Medium-like:
  body HTML sanitizado + TipTap + imagens inline via pipeline de assets + Giphy via proxy do BFF) →
  Phase 5 (automação de conteúdo + sindicação no LinkedIn).
