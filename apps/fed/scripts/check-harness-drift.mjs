// The LIVE half of the harness drift check (#318, ADR-0043): does the committed manifest still describe
// the real tedeuxx/tadeumendonca-skills tree?
//
// Run: node scripts/check-harness-drift.mjs [path-to-plugin]
//
// WHY THIS IS NOT IN `npm test`. The pure comparison is unit-tested against fixtures in
// harness-source.test.mjs, so `npm test` never needs a second repository on disk. This script needs one,
// and a gate that fails because a contributor has not cloned a sibling repo is a gate everyone learns to
// ignore. So it is its own job in `.github/workflows/app.yml`, with a second, TOKENLESS `actions/checkout`
// — the plugin is public, which is the property that makes this acceptable at all: no credential, no
// secret, and nothing anywhere near the deploy gate whose outputs decide whether an OIDC-credentialed job
// runs.
//
// WHERE THE PLUGIN IS ABSENT THIS REPORTS SKIPPED, NEVER PASSED. Same rule as e2e/edge-rewrite.spec.ts
// (#216): a check that could not run must not read like one that did. In CI the checkout is
// unconditional, so the skip path is for local runs only — and it exits 0, because a missing sibling is
// not a defect in this repo.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { collectComponents, diffAgainstManifest, driftReport, pluginPresent, assertEnforcement } from './harness-source.mjs';

const FED = dirname(dirname(fileURLToPath(import.meta.url)));
const MANIFEST = join(FED, 'src', 'content', 'generated', 'harness.json');
const pluginDir = resolve(
  process.argv[2] ?? process.env.SKILLS_REPO ?? join(FED, '..', '..', '..', 'tadeumendonca-skills'),
);

if (!pluginPresent(pluginDir)) {
  console.log(
    `::notice::SKIPPED — no tedeuxx/tadeumendonca-skills tree at ${pluginDir}, so the harness inventory was NOT verified. This is not a pass.`,
  );
  process.exit(0);
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));

// The committed file first, before it is compared to anything. A manifest that is empty, or that carries
// an enforcement class nothing defines, would otherwise sail through: an empty artifact compared against
// an empty diff agrees perfectly, which is the vacuous-pass shape this repo keeps paying for.
if (!Array.isArray(manifest) || manifest.length === 0) {
  console.error('::error::harness.json is empty or not an array — run `npm --prefix apps/fed run gen-harness`');
  process.exit(1);
}
for (const component of manifest) assertEnforcement(component.enforcement);

const diff = diffAgainstManifest(collectComponents(pluginDir), manifest);
const report = driftReport(diff);

if (report) {
  console.error(`::error::${report.split('\n')[0]}`);
  console.error(report);
  process.exit(1);
}

console.log(
  `::notice::the harness inventory matches tedeuxx/tadeumendonca-skills — ${manifest.length} component(s) verified`,
);
