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
      include: ['src/**/*.{ts,tsx}', 'scripts/gen-distribution.mjs', 'scripts/routes.mjs'],
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
