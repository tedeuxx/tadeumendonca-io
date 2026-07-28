import { defineConfig, devices } from '@playwright/test';

// E2E config (/frontend/playwright). The target is EXPLICIT: PLAYWRIGHT_BASE_URL, or E2E_ENV
// (local | staging | production) mapped below. There is NO default — a bare default silently pointed
// at the live apex and cost a debugging session (the suite asserted code that wasn't deployed yet, #88).
// The SAME specs run anywhere: locally / on the PR gate against a `vite preview` of the built app, or
// against the deployed site post-deploy (the single environment serves at the apex). `npm run e2e:local`
// is the pre-merge gate; the deploy job sets E2E_ENV for its post-deploy smoke.
const ENV = process.env.E2E_ENV;
const URLS: Record<string, string> = {
  local: 'http://localhost:4173', // vite preview
  // Both remote targets are the SAME live apex — there is one environment. 'staging' names no real
  // tier here; the rename/removal is #120. Until then it stays so the deploy smoke's E2E_ENV resolves.
  staging: 'https://tadeumendonca.io',
  production: 'https://tadeumendonca.io',
};
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? (ENV ? URLS[ENV] : undefined);
if (!baseURL) {
  throw new Error(
    'E2E target not set — refusing to default (a bare default here silently drives the live apex, #88). ' +
      'Use `npm run e2e:local` (pre-merge gate — builds, then runs against a local preview) · ' +
      '`npm run e2e:local:built` (dist/ already current) · `npm run e2e:production` (the live apex, on purpose) · ' +
      'or pass E2E_ENV=local|staging|production / PLAYWRIGHT_BASE_URL explicitly.',
  );
}

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
  // ramp-up slice. Hence `npm run e2e:local` rebuilds first — via `build:static`, so it PRODUCES the
  // prerendered artifact (#189). It used to run plain `vite build`, which emptied outDir and left the
  // 9 specs that assert the prerender failing on a healthy branch. Use `e2e:local:built` when dist/ is
  // already what you want tested: CI (it just built), or a re-run right after a local build.
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
