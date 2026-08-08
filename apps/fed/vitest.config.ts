import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    // `scripts/` is included so build-time tooling can be unit-tested at all: with `src/**` alone a
    // test file next to a script is silently NOT COLLECTED, so `npm test` goes green having run none
    // of it. Only gen-distribution.mjs is added to coverage below — the other scripts stay uncovered
    // for now rather than being swept in by a slice that did not test them.
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'src/**/*.{ts,tsx}',
        'scripts/gen-distribution.mjs',
        'scripts/routes.mjs',
        // #170. The decision half of the diagram pipeline — which fences exist, how they are normalised,
        // and whether the committed artifact still matches them. It is unit-tested, and leaving it off
        // this list did not merely lose a number: SonarCloud reads the lcov and saw 0% on new code, so
        // the local "99% coverage" was an average over a set that excluded the slice being reviewed.
        //
        // gen-diagrams.mjs is deliberately NOT here. It drives a browser and has no unit-testable
        // surface left once the logic is factored out — which is exactly why the logic was factored out.
        'scripts/diagram-source.mjs',
        // #318. Third time this list has been the thing that turned Sonar red, and the lesson is two
        // lines above rather than in some other repo: a slice adds a tested script, the local coverage
        // number stays high because it averages over a set that EXCLUDES the new file, and SonarCloud
        // reads the lcov and sees 0% on new code. The include list is an ALLOWLIST — silence here is
        // not "uncovered", it is "not measured", and those read identically in a green local run.
        //
        // gen-adrs.mjs is deliberately NOT here, on the same rule as gen-diagrams.mjs: it is a shell
        // around this file with no unit-testable surface left once the decisions were factored out.
        'scripts/adr-source.mjs',
        // #269. Same split as diagram-source: this is the half that decides WHICH cards must exist and
        // whether the committed set still matches the articles. gen-og-articles.mjs is excluded from the
        // metric in sonar-project.properties for the same reason gen-diagrams.mjs is — it drives a
        // browser and has no unit-testable surface left once the logic is factored out.
        'scripts/og-cards.mjs',
        // #167. The third of the same split, and the one that carries WORDS: which sentence each
        // locale's card sets, what it is named, and the tie back to the hero's tagline. Its generator
        // (gen-og-default.mjs) is excluded from the Sonar metric on the same terms as the other two —
        // browser harness, no unit-testable surface left once the decisions moved here.
        'scripts/og-copy.mjs',
        // #318 / ADR-0043. The decision half of the harness inventory — what a component IS, which
        // enforcement class it may claim, and whether the committed manifest still matches the plugin
        // tree. Added here for the reason the `docs/adr/**` note two entries up spells out: this list is
        // an ALLOWLIST, and a tested file left off it reads as 0% on new code to SonarCloud while the
        // local average stays high.
        //
        // gen-harness.mjs and check-harness-drift.mjs are deliberately NOT here, on the same rule as
        // gen-diagrams.mjs and gen-adrs.mjs: both are shells around this file — one writes it, one exits
        // non-zero on it — and neither has a unit-testable surface left once the decisions moved out.
        // check-harness-drift.mjs additionally requires a second repository on disk, which `npm test`
        // must never need.
        'scripts/harness-source.mjs',
        // The decision half of the video-facade poster pipeline: which videos the content embeds, which
        // art must therefore exist, and whether the committed set still matches. Added here on the rule
        // the entries above spell out — this list is an ALLOWLIST, so a tested file left off it reads as
        // 0% on new code to SonarCloud while the local average stays comfortably high.
        //
        // gen-video-thumbs.mjs is deliberately NOT here, on the same rule as gen-og-articles.mjs: it is a
        // browser harness with no unit-testable surface left once the decisions moved into this module.
        'scripts/video-thumbs.mjs',
      ],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/main.tsx', // bootstrap wiring
        'src/App.tsx', // provider/router/layout wiring — exercised by e2e, not unit
        'src/test-setup.ts',
        'src/types/**',
        'src/vite-env.d.ts',
      ],
      thresholds: { lines: 85, functions: 85, branches: 85, statements: 85 },
    },
  },
});
