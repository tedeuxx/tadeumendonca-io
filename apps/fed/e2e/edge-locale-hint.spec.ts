import { test, expect, type APIResponse } from '@playwright/test';

// The locale-hint CloudFront Function, asserted against the real edge (#669). This is the spike's
// go/no-go: RED MEANS NO-GO, and the client step that would read the cookie does not start.
//
// `scripts/locale-hint.test.mjs` proves the function's LOGIC. It cannot prove that the edge runs the
// function, that the viewer-response association exists, or that CloudFront delivers the
// CloudFront-Viewer-Country header to it on the origin-request-policy route. Only a live request can.
//
// THE VERDICT IS THE VALUE. `pt` or `other` means the header reached the function: GO. `unknown` means
// the function ran and read no country, so the header did not reach it on this route: NO-GO, and the
// header moves to the cache policy (ADR-0036's edge-locale-hint section). No cookie at all means the
// function is detached, stale or rejected.
//
// ITS OWN STEP IN THE DEPLOY (#669), selected by the `@spike-669` tag. The main post-deploy smoke runs
// with `--grep-invert @spike-669`, so a NO-GO here never reads as a broken site: the site is intact on a
// NO-GO, because nothing reads the cookie yet. `deploy.yml`'s `report` job prints the two outcomes apart.
//
// POST-DEPLOY ONLY, like edge-rewrite.spec.ts: `vite preview` runs no CloudFront Function, so locally
// there is no cookie for a harness reason rather than a site reason. Playwright reports the skip as
// SKIPPED, not passed.
const COOKIE = 'locale_hint';
const GO = ['pt', 'other'];

function hintCookies(res: APIResponse): string[] {
  return res
    .headersArray()
    .filter((h) => h.name.toLowerCase() === 'set-cookie')
    .map((h) => h.value)
    .filter((v) => v.startsWith(`${COOKIE}=`));
}

test.describe('locale-hint CloudFront Function, at the edge', { tag: '@spike-669' }, () => {
  test.skip(
    ({ baseURL }) => ['localhost', '127.0.0.1', '[::1]', '::1'].includes(new URL(baseURL!).hostname),
    'the locale hint is set by a CloudFront Function; vite preview runs none',
  );

  for (const path of ['/', '/en/', '/pt/']) {
    test(`an HTML response at ${path} carries a readable ${COOKIE} with the fixed attributes`, async ({
      request,
    }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type']).toMatch(/^text\/html/);

      const cookies = hintCookies(res);
      expect(cookies, `no ${COOKIE} cookie: the function is detached, stale or rejected — NO-GO`).toHaveLength(1);

      const [pair, ...attrs] = cookies[0].split(';').map((p) => p.trim());
      const [name, value] = pair.split('=');
      expect(name).toBe(COOKIE);
      expect(
        GO,
        value === 'unknown'
          ? `${COOKIE}=unknown: CloudFront-Viewer-Country did not reach the function — NO-GO`
          : `${COOKIE}=${value} is outside the contract (pt · other · unknown)`,
      ).toContain(value);
      expect(attrs).toEqual(expect.arrayContaining(['Path=/', 'Secure', 'SameSite=Lax']));
      expect(attrs.map((a) => a.toLowerCase())).not.toContain('httponly');
    });
  }

  test('a non-HTML response carries no locale hint', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).not.toMatch(/^text\/html/);
    expect(hintCookies(res)).toEqual([]);
  });
});
