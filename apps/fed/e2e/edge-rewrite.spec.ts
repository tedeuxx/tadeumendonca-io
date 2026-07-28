import { test, expect } from '@playwright/test';

// The CloudFront viewer-request function, asserted against the real edge (#216).
//
// `scripts/spa-rewrite.test.mjs` (#205) proves the function's LOGIC is right. It cannot prove the edge
// is running it, and those fail differently:
//
//   - the function is no longer ASSOCIATED with the distribution's default cache behaviour
//   - the association points at an older published version than the one in the repo
//   - the runtime never accepted it — CloudFront Functions run JS 2.0, so `?.`, `??` or `const` pass the
//     Node-based unit test green and are rejected at `aws_cloudfront_function` create time, inside
//     `infra-apply`, AFTER the merge
//
// In every one of those the logic is correct and the edge does not run it, which no unit test reaches.
//
// The discrimination is the same one seo.spec.ts uses, applied to the URL form the local harness cannot
// exercise: request the advertised SLASH-LESS URL and compare the SERVED canonical to the requested one.
// Without the rewrite the request misses the object, falls to `custom_error_response`, and returns the
// HOME page — at status 200, carrying the home page's canonical. A reachability check passes on all of
// them; only comparing canonicals fails.
//
// POST-DEPLOY ONLY, by construction: `vite preview` does not rewrite, so slash-less URLs serve the SPA
// fallback locally and this would fail for a harness reason rather than a site reason. #195's standing
// rule for this step is that its red must mean the SITE is broken — so rather than weaken the assertion
// to something that passes everywhere, it does not run where it cannot be true. Playwright reports that
// as SKIPPED, not passed: a check that did not run must not read like one that did.
test.describe('CloudFront URL-rewrite function, at the edge', () => {
  // Matched on the resolved baseURL rather than on E2E_ENV, so PLAYWRIGHT_BASE_URL is covered too — and
  // on the loopback ADDRESSES, not just the name `localhost`: keyed on the name alone, pointing the
  // harness at 127.0.0.1 runs this against a server that cannot satisfy it and reports the local
  // fallback as a production outage.
  test.skip(
    ({ baseURL }) => ['localhost', '127.0.0.1', '[::1]', '::1'].includes(new URL(baseURL!).hostname),
    'slash-less URLs need the CloudFront rewrite; vite preview serves the SPA fallback instead',
  );

  test('every advertised URL serves its own canonical in the SLASH-LESS form', async ({ request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text();
    const advertised = [...new Set([...sitemap.matchAll(/hreflang="[^"]+" href="([^"]+)"/g)].map((m) => m[1]))];
    // Guard the input: an empty list would make the loop below vacuously green — the exact shape of
    // "verified nothing" this test exists to prevent elsewhere.
    expect(advertised.length, 'no hreflang alternates found in the sitemap').toBeGreaterThan(1);

    const offenders: string[] = [];
    for (const url of advertised) {
      const path = new URL(url).pathname;
      // The slash-less form IS the advertised one — sitemap and hreflang publish `/en/me`, not `/en/me/`.
      // The root has no slash-less form to test; it is covered by seo.spec.ts.
      if (path === '/') continue;
      const target = path.replace(/\/$/, '');
      const res = await request.get(target);
      const canonical = /rel="canonical" href="([^"]+)"/.exec(await res.text())?.[1];
      if (res.status() !== 200 || canonical !== url) {
        offenders.push(`${target} → ${res.status()} canonical=${canonical} (expected 200 / ${url})`);
      }
    }
    expect(
      offenders,
      `the edge is not rewriting these — the function is detached, stale, or was rejected by the JS 2.0 runtime:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});
