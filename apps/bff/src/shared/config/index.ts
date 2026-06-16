// Typed accessor over non-secret process.env (defaults only — no throw at import, so tests can load
// modules without the full env). Table names live in ../db/tables. Secrets (none for the data tier —
// pure IAM) would come from Secrets Manager (/backend/environment-config, /infrastructure/ssm).

const environment = process.env.ENVIRONMENT ?? 'staging';

export const config = {
  environment,
  logLevel: process.env.LOG_LEVEL ?? 'INFO',
  serviceName: process.env.POWERTOOLS_SERVICE_NAME ?? 'bff',
  // Exact SPA origin per env — the BFF echoes Access-Control-Allow-Origin on 2xx responses
  // (the gateway OpenAPI owns the OPTIONS preflight + error CORS — /infrastructure/api-gateway).
  spaOrigin: environment === 'production' ? 'https://tadeumendonca.io' : 'https://staging.tadeumendonca.io',
  // API origin (this BFF's public host) — og:image URLs point here so the first scrape triggers
  // on-demand generation; the og-image route then 302s to spaOrigin/og/* (CloudFront → S3 CDN).
  apiOrigin: environment === 'production' ? 'https://api.tadeumendonca.io' : 'https://api.staging.tadeumendonca.io',
  // ARN of the Giphy API key secret (Secrets Manager) — the BFF fetches the value at runtime for the
  // blog-editor GIF search proxy (/backend/secrets-management). Injected by IaC (api.tf GIPHY_SECRET_ARN).
  giphySecretArn: process.env.GIPHY_SECRET_ARN ?? '',
} as const;
