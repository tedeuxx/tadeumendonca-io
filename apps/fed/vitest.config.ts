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
