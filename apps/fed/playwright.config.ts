import { defineConfig, devices } from '@playwright/test';

// E2E config (/frontend/playwright). The base URL comes from PLAYWRIGHT_BASE_URL, or from E2E_ENV
// (local | staging) mapped below. The SAME specs run anywhere: locally against a `vite preview`, or
// against the deployed site (the single environment serves at the apex). `npm run e2e:staging`.
const ENV = process.env.E2E_ENV ?? 'staging';
const URLS: Record<string, string> = {
  local: 'http://localhost:4173', // vite preview
  staging: 'https://tadeumendonca.io', // single env, served at the apex
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
