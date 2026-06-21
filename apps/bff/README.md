# apps/bff

Backend-for-Frontend for [tadeumendonca.io](https://tadeumendonca.io) — a single **Hono on AWS Lambda** REST
API, fronted by API Gateway. Part of the [`tadeumendonca-pwa`](../../README.md) monorepo (sibling: `apps/fed`,
the PWA).

## Stack

- **Runtime**: Node.js 22 / arm64 on AWS Lambda (bundled with esbuild)
- **Framework**: Hono + `@hono/zod-openapi` (typed routes + OpenAPI contract generated from code)
- **Database**: AWS DynamoDB (`@aws-sdk/lib-dynamodb`, per-entity tables)
- **Storage / mail**: AWS S3, AWS SES
- **Auth**: AWS Cognito (JWT authorizer at API Gateway + server-side `admin` group check)
- **Observability**: AWS Lambda Powertools (logger / tracer / metrics)
- **Tests**: Vitest (`vitest run --coverage`, gate ≥85%)
- **IaC**: see [`iac`](../../iac)

## Architecture

A **single BFF Lambda** — API Gateway forwards everything to it. Public reads (feed, post/article, profile)
are open; **admin** writes pass through the Cognito authorizer **and** a server-side `admin` group check
(`requireGroup`). The UI is never the source of truth for authorization. The **OpenAPI contract is generated
from code** (`npm run gen-openapi`) and republished on deploy. There is also an **og-edge** Lambda@Edge
(us-east-1) bundled separately.

## Modules (`src/modules/<domain>/`)

Each module = `routes.ts` (zod-openapi routes) + `repository.ts` (DynamoDB access):

`posts` (feed) · `articles` (blog) · `comments` · `reactions` (public emoji) · `subscriptions` +
`notifications` (SES/SNS digest, fan-out fail-open) · `unfurl` (link previews, SSRF-guarded) · `og-image`
(satori → SVG → PNG in S3) · `prerender` (bots/SEO) · `profile` (CV) · `shortlinks` (`/p/<code>`).

## Conventions

- **snake_case everywhere** — DynamoDB fields, TS interfaces, request/response JSON. No mapping layer.
- **Errors are thrown, never returned** — `throw new AppError/NotFoundError/UnauthorizedError`; the
  middleware converts to HTTP. Don't return 4xx manually.
- **REST**: kebab-case paths/params; **opaque** resource ids (nanoid/slug), never sequential.
- Link previews are resolved from the post body at save time (server-authoritative); every external fetch
  goes through `safeFetch` with an SSRF guard.

## Configuration

Runtime config is read from **environment variables** injected by the IaC (table/bucket names, etc.) — mostly
non-sensitive resource names. Sensitive third-party credentials are **never** put in env: the IaC injects only
the **secret ARN** and the BFF fetches the value from **AWS Secrets Manager** at runtime (cached for the
container lifetime; see `src/shared/secrets.ts`):

| Env var | Purpose | Source |
| --- | --- | --- |
| `GIPHY_SECRET_ARN` | ARN of the Giphy key for blog-editor GIF search (server-side proxy — the key never reaches the browser) | Secrets Manager `tadeumendonca/<env>/giphy-api-key` |

To register the out-of-band secrets, see
[`tadeumendonca-iac` → Prerequisites](https://github.com/tedeuxx/tadeumendonca-iac#prerequisites--out-of-band-secrets).

## Commands

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest run --coverage — gate ≥85%
npm run build       # esbuild → BFF bundle (+ og-edge)
npm run gen-openapi # regenerate the contract from code
npm run seed        # seed data (tsx scripts/seed.ts)
```

## Workflow

GitFlow: branch from `develop`; PR required (0 approvals). Merge to `develop` → **automatic staging deploy**
(Lambda code update + contract republish). `main` → production (with approval). CI runs lint + typecheck +
test + SonarCloud quality gate. See the [monorepo README](../../README.md) for the full picture.
