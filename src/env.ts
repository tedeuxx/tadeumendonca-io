// Build-time config from VITE_* (injected by the fed deploy from SSM — /frontend/environment-config).
// Defaults to staging so `vite dev` works without a build env.
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'https://api.staging.tadeumendonca.io',
  // Cognito (Phase 2 auth) — pool/client/hosted-UI domain. Redirect URLs derive from
  // window.location.origin at runtime, so they match whichever host serves the SPA.
  cognito: {
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID ?? 'us-east-1_7NhhMepZr',
    clientId: import.meta.env.VITE_COGNITO_CLIENT_ID ?? '71n9jen5uuu4c89deuokfacrca',
    domain: import.meta.env.VITE_COGNITO_DOMAIN ?? 'auth.staging.tadeumendonca.io',
  },
};
