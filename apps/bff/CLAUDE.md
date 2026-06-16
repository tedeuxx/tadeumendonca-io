# tadeumendonca-api

BFF de **tadeumendonca.io** — **Hono no AWS Lambda** (REST API), fronteado pelo API Gateway.
Parte do platform `tadeumendonca` (repos irmãos: `-fed` = SPA, `-iac` = infra, `-skills` = guias).

## Stack
- **Hono + `@hono/zod-openapi`** (rotas tipadas + contrato OpenAPI gerado do código).
- **AWS Lambda** node22/arm64, bundle via **esbuild**. **DynamoDB** (`@aws-sdk/lib-dynamodb`), **S3**, **SES**.
- **AWS Lambda Powertools** (logger/tracer/metrics). Testes: **Vitest** (`vitest run --coverage`, gate ≥85%).
- Há também o **og-edge** (Lambda@Edge, us-east-1) — bundle separado.

## Arquitetura
- É **um único BFF Lambda**: o API Gateway encaminha só pra ele. Leituras públicas (feed, post/artigo, perfil) abertas; escritas **admin** passam pelo **Cognito authorizer** (no API GW) **e** por um check de grupo `admin` no servidor (`requireGroup`). A UI nunca é a fonte de verdade de autorização.
- **Contrato OpenAPI é gerado do código** (`npm run gen-openapi`) e republicado no deploy (`put-rest-api` + `create-deployment`).

## Módulos (`src/modules/<domínio>/`)
Cada módulo = `routes.ts` (rotas zod-openapi) + `repository.ts` (acesso DynamoDB).
`posts` (feed) · `articles` (blog) · `comments` · `reactions` (emoji, público, localStorage no client) · `subscriptions` + `notifications` (SES/SNS, fan-out fail-open) · `unfurl` (preview de links) · `og-image` (satori→SVG→PNG no S3) · `prerender` (bots/SEO) · `profile` (CV) · `shortlinks` (`/p/<code>`).

## Convenções (NÃO-óbvias)
- **snake_case em tudo** — campos do DynamoDB, interfaces TS, e JSON de request/response. **Sem camada de mapeamento.**
- **Erros são lançados, nunca retornados** — `throw new AppError/NotFoundError/UnauthorizedError`, o middleware converte em HTTP. Não retornar 4xx manualmente.
- **REST**: paths/params em kebab-case; ids de recurso **opacos** (nanoid/slug), nunca sequenciais.
- Ids gerados no servidor; o `gsi_pk` esparso (índice do feed) é derivado de `published`, **nunca aceito do client**.
- **Unfurl**: previews são resolvidos do **corpo do post** ao salvar (`resolveBodyPreviews`), server-authoritative. Todo fetch externo passa pelo **`safeFetch` com guarda SSRF**. YouTube/Spotify via oEmbed com fallback.

## Comandos
```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest run --coverage — gate ≥85% (lines/funcs/branches/stmts)
npm run build       # esbuild → bundle do BFF (+ og-edge)
npm run gen-openapi # regenera o contrato a partir do código
npm run seed        # popular dados (tsx scripts/seed.ts)
```

## Workflow (ver platform)
- **GitFlow**: branch a partir de `develop`; PR obrigatório (0 approvals). Merge em `develop` → **deploy automático em staging** (update do Lambda + republicação do contrato). `main` → produção (com aprovação).
- CI (`ci.yml`): lint + typecheck + test + **SonarCloud quality gate** (check `build-test` obrigatório). SemVer numérico automático.
