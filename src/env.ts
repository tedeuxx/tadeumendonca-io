// Build-time config from VITE_* (injected by the fed deploy from SSM — /frontend/environment-config).
// Defaults to staging so `vite dev` works without a build env.
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'https://api.staging.tadeumendonca.io',
};
