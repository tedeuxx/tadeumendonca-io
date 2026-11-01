import { test, expect, type APIResponse } from '@playwright/test';

// The locale-hint CloudFront Function, asserted against the real edge (#669). This is the spike's
// go/no-go: RED MEANS NO-GO, and the client step that would read the cookie does not start.
//
// `scripts/locale-hint.test.mjs` proves the function's LOGIC. It cannot prove that the edge runs the
// function, that the viewer-response association exists, or that CloudFront delivers the
// CloudFront-Viewer-Country header to it on the origin-request-policy route. Only a live request can.
//
// THE EXPECTED VALUE IS `other`, because the post-deploy runner is assumed to sit outside the CPLP. That
// is a premise, not a measurement: run from a CPLP country, this goes red with `pt`, which is the
// function working, not failing.
//
// WHAT THIS CANNOT TELL APART, said so a green is not over-read: the function gives `other` both for a
// non-CPLP country AND for a missing header. So from a non-CPLP runner this proves the function is
// attached, running and HTML-scoped; it does not by itself prove the header reached it. Only a request
// from a CPLP country (`pt`) proves that.
//
// POST-DEPLOY ONLY, like edge-rewrite.spec.ts: `vite preview` runs no CloudFront Function, so locally
// there is no cookie for a harness reason rather than a site reason. Playwright reports the skip as
// SKIPPED, not passed.
const COOKIE = 'locale_hint';
const EXPECTED = 'other';

function hintCookies(res: APIResponse): string[] {
  return res
    .headersArray()
    .filter((h) => h.name.toLowerCase() === 'set-cookie')
    .map((h) => h.value)
    .filter((v) => v.startsWith(`${COOKIE}=`));
}

test.describe('locale-hint CloudFront Function, at the edge', () => {
  test.skip(
    ({ baseURL }) => ['localhost', '127.0.0.1', '[::1]', '::1'].includes(new URL(baseURL!).hostname),
    'the locale hint is set by a CloudFront Function; vite preview runs none',
  );

  for (const path of ['/', '/en/', '/pt/']) {
    test(`an HTML response at ${path} carries ${COOKIE}=${EXPECTED} with the fixed attributes`, async ({
      request,
    }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type']).toMatch(/^text\/html/);

      const cookies = hintCookies(res);
      expect(cookies, `no ${COOKIE} cookie: the function is detached, stale or rejected — NO-GO`).toHaveLength(1);

      const [pair, ...attrs] = cookies[0].split(';').map((p) => p.trim());
      expect(pair).toBe(`${COOKIE}=${EXPECTED}`);
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
