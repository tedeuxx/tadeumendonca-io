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
} as const;
