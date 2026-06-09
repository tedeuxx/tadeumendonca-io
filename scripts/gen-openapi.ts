// Emit the neutral OpenAPI contract from the Hono app (CI, before deploy). The AWS overlay
// (integration + cognito authorizer + CORS) is applied separately at deploy via envsubst →
// put-rest-api (/backend/openapi, /workflow/github-actions). Version-stamps info.version.
import { writeFileSync } from 'node:fs';
import { app } from '../src/index';

const version = process.argv.includes('--version')
  ? process.argv[process.argv.indexOf('--version') + 1]
  : '0.0.0';
const outIndex = process.argv.indexOf('--out');
const out = outIndex !== -1 ? process.argv[outIndex + 1] : 'openapi.json';

const doc = app.getOpenAPI31Document({
  openapi: '3.1.0',
  info: { title: 'tadeumendonca-api', version },
});

writeFileSync(out, JSON.stringify(doc, null, 2) + '\n');
console.log(`wrote ${out} (version ${version})`);
