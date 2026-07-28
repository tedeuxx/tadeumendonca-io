import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// #205 — the CloudFront viewer-request function is the last unguarded link in the #200 chain.
//
// It is what turns an ADVERTISED URL into the prerendered artifact: every hreflang alternate and every
// sitemap <loc> is emitted in the SLASH-LESS form (`/en/me`), and nothing on the merge path exercises
// that form. `vite preview` does not rewrite, so the E2E suite requests the directory form (`/en/me/`)
// deliberately — a local-harness accommodation, which means the production contract was verified by
// READING the function rather than by a gate.
//
// The failure that makes it worth a test: if this rewrite regressed, every advertised URL would serve
// the SPA fallback carrying the home page's OG card, #200's fix would revert in effect, and every gate
// would stay green — `infra-plan` validates Terraform, not behaviour.
//
// The source is evaluated rather than imported: CloudFront Functions run a JS 2.0 runtime with no module
// system, so `handler` is a bare function declaration and adding an `export` would break the deploy. This
// tests the exact bytes that ship.
const SOURCE = resolve(import.meta.dirname, '../../../iac/cloudfront-functions/spa-rewrite.js');

function loadHandler() {
  const src = readFileSync(SOURCE, 'utf8');
  return new Function(`${src}; return handler;`)();
}

const rewrite = (uri) => loadHandler()({ request: { uri } }).uri;

describe('spa-rewrite (CloudFront viewer-request)', () => {
  // THE assertion #205 exists for: the slash-less form is what the sitemap and hreflang advertise.
  describe('the ADVERTISED slash-less form resolves to the prerendered artifact', () => {
    for (const [uri, expected] of [
      ['/en/me', '/en/me/index.html'],
      ['/pt/me', '/pt/me/index.html'],
      ['/en/blog/my-commitment', '/en/blog/my-commitment/index.html'],
      ['/pt/blog/meu-compromisso', '/pt/blog/meu-compromisso/index.html'],
      ['/en/architecture', '/en/architecture/index.html'],
    ]) {
      it(`${uri} → ${expected}`, () => expect(rewrite(uri)).toBe(expected));
    }
  });

  describe('the directory form resolves to the same artifact', () => {
    it('appends index.html to a trailing slash', () => {
      expect(rewrite('/en/me/')).toBe('/en/me/index.html');
    });

    it('the bare root serves the x-default snapshot', () => {
      expect(rewrite('/')).toBe('/index.html');
    });

    it('both forms of the same route land on the SAME artifact', () => {
      expect(rewrite('/en/me')).toBe(rewrite('/en/me/'));
    });
  });

  // A file must pass through untouched — rewriting it would 404 the asset. `/assets/*` and `/og/*` have
  // their own cache behaviours and never reach this function, but the root-level files do.
  describe('real files pass through unchanged', () => {
    for (const uri of ['/sitemap.xml', '/robots.txt', '/cv.pdf', '/og-default.png', '/favicon.ico']) {
      it(`${uri} is not rewritten`, () => expect(rewrite(uri)).toBe(uri));
    }

    // Pinning a REAL limitation rather than the behaviour I assumed. The heuristic is "a dot in the last
    // segment means a file", so a ROUTE whose last segment contains a dot is not rewritten — it misses
    // the artifact, 404s at the origin, and `custom_error_response` (iac/frontend.tf) answers 200 with
    // /index.html, i.e. the home page's OG card. That is #200's failure mode, reachable through a slug.
    //
    // This test asserts the current behaviour so the constraint is visible and cannot change unnoticed.
    // The hazard it implies — an article slug containing a dot (`node.js-patterns`, `v1.2-release`) —
    // is filed separately; the fix belongs with slug validation, not here.
    it('does NOT rewrite a route whose last segment contains a dot (known constraint)', () => {
      expect(rewrite('/en/blog/v1.2-release')).toBe('/en/blog/v1.2-release');
    });

    // The assertion that pins the heuristic ITSELF. The function compares the last '.' against the last
    // '/', so a dot in a NON-final segment is still a route. Without this row the whole suite passes
    // against a naive `!uri.includes('.')` implementation — every other assertion survives that mutation,
    // so the suite would guard the function's advertised contract while not distinguishing it from a
    // strictly worse one.
    it('DOES rewrite a route with a dot in a non-final segment', () => {
      expect(rewrite('/v1.2/me')).toBe('/v1.2/me/index.html');
    });
  });
});
