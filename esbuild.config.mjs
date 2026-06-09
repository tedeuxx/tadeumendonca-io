// Bundles the BFF into a single dist/index.js (Pattern B: IaC owns config, this repo ships code).
// node22 / esm / arm64-compatible; the AWS SDK v3 is bundled (Lambda's built-in SDK is also v3, but
// bundling pins the version). minified for cold-start.
import { build } from 'esbuild';
import { rm } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true }); // single artifact in the zip (index.mjs only)

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.mjs', // .mjs so Lambda (nodejs22) loads it as ESM; handler = index.handler
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  minify: true,
  sourcemap: false,
  // ESM output needs these shims for any CJS deps that reference __dirname/require.
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
});

console.log('built dist/index.js');
