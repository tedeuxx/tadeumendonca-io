import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/index.ts', // app wiring — exercised via app.request in tests, not unit-covered
        '**/shared/config/**', // trivial env accessor (defaults only)
        '**/shared/db/client.ts', // SDK client construction (mocked at the boundary)
        '**/shared/types/**', // type-only, no runtime code
      ],
      thresholds: { lines: 85, functions: 85, branches: 85, statements: 85 },
    },
  },
});
