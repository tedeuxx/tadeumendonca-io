// Bundles two Lambdas (Pattern B: IaC owns config, this repo ships code): the BFF → dist/index.mjs and
// the newsletter digest → dist-digest/index.mjs. Each is a separate single-file artifact the deploy zips
// + ships. node22 / esm / arm64; the AWS SDK v3 is bundled (pins the version). minified for cold-start.
import { build } from 'esbuild';
import { rm } from 'node:fs/promises';

const shared = {
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  minify: true,
  sourcemap: false,
  // The og-image module imports the resvg wasm + Inter woff fonts; embed them as Uint8Array so the
  // bundle stays a single self-contained file (no runtime file reads, no native binary to ship).
  loader: { '.wasm': 'binary', '.woff': 'binary' },
  // ESM output needs these shims for any CJS deps that reference __dirname/require.
  banner: { js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);" },
};

await rm('dist', { recursive: true, force: true }); // one artifact per dir (index.mjs only)
await rm('dist-digest', { recursive: true, force: true });

await build({ ...shared, entryPoints: ['src/index.ts'], outfile: 'dist/index.mjs' }); // BFF — handler = index.handler
await build({ ...shared, entryPoints: ['src/digest/handler.ts'], outfile: 'dist-digest/index.mjs' }); // digest — handler = index.handler

console.log('built dist/index.mjs + dist-digest/index.mjs');
