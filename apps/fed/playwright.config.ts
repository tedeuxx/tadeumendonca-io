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
  // ramp-up slice. Hence `npm run e2e:local` rebuilds first. Use `e2e:local:built` when dist/ is
  // already what you want tested: CI (it just built), or after `build:static` when you specifically
  // want the PRERENDERED artifact — `vite build` empties outDir, so `e2e:local` would destroy it.
  //
  // reuseExistingServer did NOT cause that failure: `vite preview` reads dist/ from disk per request
  // (sirv with dev:true stats each file; indexHtmlMiddleware re-reads index.html), so an
  // already-running preview picks up a rebuild — including new hashed asset names.
  //
  // It is not therefore SAFE, and the residual is worth knowing: Playwright only probes that
  // *something* answers on :4173. A `vite preview` left running from another worktree or checkout is
  // reused silently, and building in THIS tree does not fix that — you would be testing a different
  // dist/ entirely. Same class of false green, not covered by the build-first default.
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
