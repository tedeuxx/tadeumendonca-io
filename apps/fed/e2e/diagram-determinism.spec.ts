import { test, expect } from '@playwright/test';
import { renderDiagrams } from '../scripts/gen-diagrams.mjs';

// The diagram generator is deterministic: two runs over the same sources write byte-identical output
// (#758, ADR-0040's 2026-10-17 amendment).
//
// It was not. mermaid 11 draws node outlines through roughjs, whose jitter falls back to Math.random
// when `handDrawnSeed` is 0 (the default), so every regeneration rewrote the outer `<path d=…>` of
// those shapes and the committed diagrams.json churned with no real change. The fix is a fixed seed in
// gen-diagrams.mjs's THEME; this spec is what goes red if it is ever removed.
//
// WHY E2E AND NOT A UNIT TEST: the render needs a real browser (mermaid has no Node renderer), and the
// vitest job has none. Playwright's Chromium is already here.
//
// WHY ONLY AGAINST A LOCAL TARGET: this is a property of the source tree, not of the deployed site. The
// post-deploy smoke's red must mean the SITE is broken, so the spec does not run there. Playwright
// reports that as SKIPPED, not passed. Keyed on the loopback addresses, as `edge-rewrite.spec.ts` is.
//
// Both runs write into this test's own output directory, never into the committed artifact, and the
// comparison is the exact text each run wrote. Same machine, same browser: a cross-machine comparison
// (font metrics) is out of scope by the Issue's own terms.
test.describe('gen-diagrams is deterministic', () => {
  test.skip(
    ({ baseURL }) => !['localhost', '127.0.0.1', '[::1]', '::1'].includes(new URL(baseURL!).hostname),
    'a source-tree property: it runs on the pre-merge gate, not against the live apex',
  );

  test('two consecutive renders write byte-identical diagrams.json', async () => {
    test.setTimeout(180_000);
    const testInfo = test.info();

    const first = await renderDiagrams(testInfo.outputPath('run-1', 'diagrams.json'));
    const second = await renderDiagrams(testInfo.outputPath('run-2', 'diagrams.json'));

    // Guard the input: zero fences writes `{}` twice and would pass vacuously, and a render with no
    // shape path would not exercise the jitter this spec exists to pin.
    expect(first.count, 'no diagrams were rendered — nothing was compared').toBeGreaterThan(0);
    expect(first.text, 'no <path> in the output — the jitter-bearing element is absent').toContain('<path');

    expect(second.count).toBe(first.count);
    // A plain string equality, not a snapshot: nothing is stored, and on failure the diff shows the
    // `d=` attribute of whichever shape lost its seed.
    expect(second.text, 'the two renders differ — is handDrawnSeed still set?').toBe(first.text);
  });
});
