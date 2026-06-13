import { defineConfig, devices } from '@playwright/test';

// E2E config (/frontend/playwright) — MULTI-ENVIRONMENT. The base URL comes from PLAYWRIGHT_BASE_URL,
// or from E2E_ENV (local | staging | production) mapped below. The SAME specs run anywhere: locally
// against a `vite preview`, or against either AWS environment (`npm run e2e:staging`).
const ENV = process.env.E2E_ENV ?? 'staging';
const URLS: Record<string, string> = {
  local: 'http://localhost:4173', // vite preview
  staging: 'https://staging.tadeumendonca.io',
  production: 'https://tadeumendonca.io',
};
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? URLS[ENV] ?? URLS.staging;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL, trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
