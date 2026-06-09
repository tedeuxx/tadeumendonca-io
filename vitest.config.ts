import { defineConfig } from 'vitest/config';

// esbuild embeds .wasm/.woff via its `binary` loader at build (esbuild.config.mjs); vitest has no such
// loader, so stub those imports as empty Uint8Arrays. The og-image generator only reads them lazily
// (initWasm runs inside generateOgImage, which tests mock), so module-eval works without real bytes.
const binaryStub = {
  name: 'binary-asset-stub',
  enforce: 'pre' as const,
  resolveId(id: string) {
    if (id.endsWith('.wasm') || id.endsWith('.woff')) return `\0binstub:${id}`;
  },
  load(id: string) {
    if (id.startsWith('\0binstub:')) return 'export default new Uint8Array();';
  },
};

export default defineConfig({
  plugins: [binaryStub],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/*.d.ts', // type-only declarations, no runtime code
        '**/index.ts', // app wiring — exercised via app.request in tests, not unit-covered
        '**/shared/config/**', // trivial env accessor (defaults only)
        '**/shared/db/client.ts', // SDK client construction (mocked at the boundary)
        '**/shared/s3/client.ts', // SDK client construction (mocked at the boundary)
        '**/modules/og-image/generator.ts', // satori + resvg-wasm; .wasm/.woff are esbuild binary-loader imports not loadable under vitest — validated by the build smoke test + live deploy
        '**/shared/types/**', // type-only, no runtime code
      ],
      thresholds: { lines: 85, functions: 85, branches: 85, statements: 85 },
    },
  },
});
