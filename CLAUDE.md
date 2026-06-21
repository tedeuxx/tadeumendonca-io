# tadeumendonca-pwa

**Monorepo da plataforma tadeumendonca.io — o workspace ativo E o produto em si.** Todo o desenvolvimento
(frontend, BFF, infra do app) acontece **aqui, in-place**. `-api`/`-fed` arquivados.

## Propósito na plataforma (por que existe — NÃO é portfólio)
tadeumendonca.io é o **artefato de prova de engenharia** do dono — um **produto real** que ele projeta,
constrói e opera, para se reposicionar de "Architect (AWS Professional Services / consultoria)" para
**Senior Software Engineer** em product companies. O site **não é portfólio estático**: a stack e as
decisões arquiteturais **são parte do argumento**. **Este repo é o produto que os visitantes veem**, e
entrega 3 fases:
1. **CV digital interativo** (`/profile`) — referência canônica da experiência (mais rico que PDF; alinhado palavra-a-palavra com LinkedIn + CV Canva).
2. **Feed** (`/`) — análises técnicas, decisões de sistema, raciocínio de engenharia em público.
3. **Blog / artigos longos** (`/blog`) — deep dives, trade-offs explícitos, padrões de distributed systems / AWS.

**Implicações operacionais (são REGRA, não enfeite):**
- **Decisões defensáveis + trade-offs documentados** — o código é público e é o pitch; toda escolha precisa de um porquê articulável.
- **Sem over-engineering** — o serviço/abstração mais simples que resolve. Mas **não é playground**: é produto que precisa funcionar (qualidade real, não protótipo).
- Princípios fixos da plataforma: **cloud-native** (sem servidor próprio), **IaC-first** (zero ClickOps), **scale-to-zero / custo controlado**, **observabilidade desde o dia 1** (CloudWatch + X-Ray), **CI/CD desde o commit 1** (GitHub Actions).

## Estrutura
- **`apps/fed/`** — SPA pública (React + Vite + PWA offline-first). Guia próprio em `apps/fed/CLAUDE.md`.
- **`apps/bff/`** — Backend-for-Frontend (Hono + Lambda + DynamoDB). Guia próprio em `apps/bff/CLAUDE.md`.
- **`iac/`** — Terraform da **infra do app** (Cognito, SES, API GW, S3, CloudFront, lambdas, EventBridge
  digest…). State em Terraform Cloud (`tadeumendonca-pwa-{staging,production}`), execução **Local**.

## Repos irmãos (ativos)
- **`tadeumendonca-iac`** — só **infra compartilhada** (WAF regional). Toca lá só se for cross-workload.
- **`tadeumendonca-skills`** — biblioteca de skills do Claude (plugin + marketplace).

## Fluxo (GitFlow)
- Branch a partir de **`develop`** → PR (0 approvals) → merge → **deploy automático em staging**.
- `develop` é o default. **`main` ainda NÃO existe** — criar quando houver linha de produção (main = prod com aprovação do Environment `production`).
- **Versão única do monorepo** (SemVer numérico, `VERSION` na raiz; `version-develop` bumpa patch no push pra develop; `version-main` lê label `semver:` no merge pra main). Tags `vX.Y.Z`.
- **CI:** `fed-ci`/`bff-ci` (lint+typecheck+test ≥85%+SonarCloud, com `dorny/paths-filter`); `infra-plan` (checkov+plan). **Deploys:** `fed-deploy`/`bff-deploy`/`infra-apply`. **Claude App:** `@claude` + auto-review.

## Decisões fixas (NÃO reverter sem discussão)
- **Monorepo** com **versão única**. SSM como **config bus** entre workloads (DAG acíclico, sem `terraform_remote_state`).
- **Auth social-only via Google** (Cognito hosted-UI PKCE; sem signup nativo). UI gating é **cosmético** — o BFF re-checa o grupo server-side.
- **snake_case** ponta-a-ponta (DB/JSON/TS, sem camada de mapeamento). **REST**, ids opacos (slug/hashid). **pt-BR** em toda a UI.
- **fed:** Tailwind próprio, **sem shadcn**; tema único (identidade BVB: preto/grafite/ouro); **PWA offline-first**.
- **bff:** Hono + Lambda em **Pattern B** (o código vai via pipeline `update-function-code`; o Terraform usa `ignore_source_code_hash` — um `apply` NÃO reverte o código deployado); DynamoDB por entidade.
- **Secrets:** OIDC role ARNs = **environment secrets per-env** (`AWS_INFRA/BFF/FED_OIDC_ROLE_ARN`); tooling tokens (`TFC/SONAR/CLAUDE_CODE_OAUTH/VERSION_BUMP`) = **repository** (ver skill `/workflow/github-actions`).

## ⚠️ Destrutivo / exige confirmação explícita
- **Merge em `develop`** → deploy automático em **staging** (app) e, se tocar `iac/`, `infra-apply` = **infra AWS real**. Confirme o `plan`.
- **Merge em `main`** → **produção** (com aprovação do Environment).
- `terraform apply`/`destroy`; deletar dados (DynamoDB/S3); mexer em Cognito/SES/DNS — irreversível, confirmar.
- **IaC é pipeline-only** — `apply`/`destroy` só no CI. Local é read-only (`fmt`/`validate`/`plan` de inspeção).

## Convenções (detalhe nos guias dos apps)
Estados de UI explícitos (loading/empty/error); contratos espelhados api↔fed (hoje duplicados — ver Stage B
abaixo); datas com locale `pt-BR`.

## Status atual (ponto-no-tempo — 2026-06-21)
- **Staging vivo e migrado** (app + infra + auth). Produção do `-pwa` ainda **greenfield** (não levantada).
- **Pendente — Stage B (a dedup, motivação nº1 da migração):** extrair a lógica duplicada api↔fed pra um
  **`packages/shared`** com **npm workspaces** (o root `package.json` ainda não tem `workspaces`, não há
  `packages/`). Hoje `extractUrls`/unfurl e tipos (Post/Article/FeedItem) seguem duplicados em
  `apps/bff/src/modules/unfurl/` **e** `apps/fed/src/hooks/useUnfurl.ts`.
- **Pendente:** criar o branch **`main`** + levantar produção.
- **Roadmap (plano aprovado):** Phases F,0,1,2,3 concluídas; próximo = **Phase 4** (editor Medium-like:
  body HTML sanitizado + TipTap + imagens inline via pipeline de assets + Giphy via proxy do BFF) →
  Phase 5 (automação de conteúdo + sindicação no LinkedIn).
