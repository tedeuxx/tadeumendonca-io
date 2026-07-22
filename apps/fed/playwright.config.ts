import { defineConfig, devices } from '@playwright/test';

// E2E config (/frontend/playwright). The base URL comes from PLAYWRIGHT_BASE_URL, or from E2E_ENV
// (local | staging) mapped below. The SAME specs run anywhere: locally / on the PR gate against a
// `vite preview` of the built app, or against the deployed site post-deploy (the single environment
// serves at the apex). `npm run e2e:local` is the pre-merge gate; `e2e:staging` is the deploy smoke.
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
  // Only the local target needs a server booted: it points at a `vite preview` of the built app
  // (dist/ must exist — run `npm run build` first). The staging/production targets hit the live apex,
  // so no webServer. reuseExistingServer keeps a preview you already have running locally.
  webServer:
    ENV === 'local'
      ? {
          command: 'npm run preview',
          url: 'http://localhost:4173',
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        }
      : undefined,
});
