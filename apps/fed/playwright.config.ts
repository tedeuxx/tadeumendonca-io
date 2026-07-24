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
  // Only the local target needs a server booted: it points at a `vite preview` of the built app.
  // The staging/production targets hit the live apex, so no webServer.
  //
  // dist/ must exist AND be current. Staleness is the failure that actually happens — a suite run
  // against a previous build passes for the wrong reason, which cost a false 26/26 green during the
  // ramp-up slice. Hence `npm run e2e:local` rebuilds first; use `e2e:local:built` only when you just
  // built (CI does).
  //
  // reuseExistingServer is safe here and was NOT the cause: `vite preview` serves dist/ from disk per
  // request, so a rebuilt dist is picked up by an already-running preview — verified when the rebuild
  // turned that green run red without restarting anything.
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
