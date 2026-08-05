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
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  collectComponents,
  collectPersonas,
  diffAgainstManifest,
  driftReport,
  pluginPresent,
  readPluginVersion,
  resolvePluginDir,
  rosterDispatchNames,
  rosterDispatchReport,
  assertEnforcement,
  assertPluginVersion,
} from './harness-source.mjs';

const FED = dirname(dirname(fileURLToPath(import.meta.url)));
const MANIFEST = join(FED, 'src', 'content', 'generated', 'harness.json');
// `CLAUDE.md` sits at the repo root, two levels above this package (#353).
const GUIDE = join(dirname(FED), '..', 'CLAUDE.md');
const PLUGIN_RELEASE = join(FED, 'src', 'content', 'generated', 'plugin-release.json');
// `resolvePluginDir` does the resolving AND the validating — see its header. Nothing here calls `resolve`
// itself any more: a second resolve in the caller is what put the existing check off the path between the
// argument and the first `fs` call.
const pluginDir = resolvePluginDir(
  process.argv[2] ?? process.env.SKILLS_REPO ?? join(FED, '..', '..', '..', 'tadeumendonca-skills'),
);

// ---------------------------------------------------------------------------------------------
// The committed plugin version (#345, ADR-0043's 2026-08-04 amendment, Decision 2b).
//
// FIRST, and deliberately ABOVE the skip: this assertion needs no plugin tree, so it runs on the path
// where the sibling repo is absent too. It is also the only place the floor is ever checked — production
// renders the deploy-resolved override, so a malformed committed default is never evaluated there and
// would surface only in a fork's build, as a link that cannot resolve.
//
// The drift check is NO LONGER what keeps this value fresh; the deploy is. What remains is error-or-
// nothing, and BEHIND is deliberately silent — at the plugin's measured cadence (14 releases on
// 2026-08-02) a staleness notice would print on nearly every run, and an output that always appears is
// read by no one.
let committedVersion;
try {
  // TAKE THE RETURN. `assertPluginVersion(x); use(x)` was the shape everywhere in this slice, and it is
  // the one that cost three review rounds: the validator rebuilds the value from its capture groups, so
  // discarding the return means the check ran and the ORIGINAL was used anyway. This was the last site
  // where the pattern was still half-applied.
  //
  // Landing it now rather than as a follow-up, on `security`'s ruling and for a reason worth keeping:
  // the two `jssecurity:S8689` findings are now marked false-positive, which permanently silences the
  // only automated objector to this shape in these files. The new test in harness-source.test.mjs does
  // not reach here either — it pins the transformation, and a call that discards the return never
  // consumes it. A follow-up with no remaining objector is, in practice, never.
  committedVersion = assertPluginVersion(
    JSON.parse(readFileSync(PLUGIN_RELEASE, 'utf8')).version,
    'src/content/generated/plugin-release.json',
  );
} catch (err) {
  console.error(
    `::error::src/content/generated/plugin-release.json is unusable — ${err.message}. ` +
      'Run `npm --prefix apps/fed run gen-harness`.',
  );
  process.exit(1);
}

if (!pluginPresent(pluginDir)) {
  console.log(
    `::notice::SKIPPED — no tedeuxx/tadeumendonca-skills tree at ${pluginDir}, so the harness inventory was NOT verified. This is not a pass.`,
  );
  process.exit(0);
}

// AHEAD of the plugin's own VERSION. The generator cannot produce this — only a hand-edit or a bad merge
// can — and it names a release that does not exist, so a fork's card links a 404. BEHIND is the normal,
// expected state and says nothing.
const livePluginVersion = readPluginVersion(pluginDir);
const asNumbers = (v) => v.split('.').map(Number);
const isAhead = (a, b) => {
  const [x, y] = [asNumbers(a), asNumbers(b)];
  for (let i = 0; i < 3; i += 1) {
    if (x[i] !== y[i]) return x[i] > y[i];
  }
  return false;
};
if (isAhead(committedVersion, livePluginVersion)) {
  console.error(
    `::error::plugin-release.json says ${committedVersion}, but tedeuxx/tadeumendonca-skills is at ` +
      `${livePluginVersion} — the committed value names a release that does not exist, so the ` +
      '/portfolio card would link a 404. Run `npm --prefix apps/fed run gen-harness`.',
  );
  process.exit(1);
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

// The SECOND artifact this job compares against the same plugin tree (#353): the dispatch roster in
// `CLAUDE.md`. It rides here rather than in a job of its own because the expensive part — a tokenless
// checkout of the plugin — is already paid for above, and `collectPersonas` is the same read.
//
// Ordered AFTER the manifest diff deliberately. When a persona is retired over there, both checks
// fire; the manifest report names the command that fixes it (`gen-harness`), and this one names a
// hand edit. Reporting the mechanical fix first is the one a reader should act on first.
const guideRoster = rosterDispatchNames(readFileSync(GUIDE, 'utf8'));
const rosterProblem = rosterDispatchReport(
  guideRoster,
  collectPersonas(pluginDir).map((p) => p.id),
);
if (rosterProblem) {
  console.error(`::error::${rosterProblem.split('\n')[0]}`);
  console.error(rosterProblem);
  process.exit(1);
}

console.log(
  `::notice::the harness inventory matches tedeuxx/tadeumendonca-skills — ${manifest.length} component(s) verified, and CLAUDE.md dispatches the ${guideRoster.length} live persona(s)`,
);
