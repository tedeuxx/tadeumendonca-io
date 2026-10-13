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
// THIS FILE AND `harness-source.mjs` ARE IN THAT JOB'S PATH FILTER (#615). Until then they matched only
// `code` and `test` via `apps/**`, so editing the comparison ran eslint, tsc, vitest, build and Playwright
// and did not run the comparison. It buys nothing about the blind window the job's own comment documents —
// the falsifying event is still a merge in the plugin repo, which no trigger here can match.
//
// WHERE THE PLUGIN IS ABSENT THIS REPORTS SKIPPED, NEVER PASSED. Same rule as e2e/edge-rewrite.spec.ts
// (#216): a check that could not run must not read like one that did. In CI the checkout is
// unconditional, so the skip path is for local runs only — and it exits 0, because a missing sibling is
// not a defect in this repo.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  collectComponents,
  diffAgainstManifest,
  driftReport,
  pluginLayout,
  pluginPresent,
  readPluginVersion,
  resolvePluginDir,
  assertEnforcement,
  assertPluginVersion,
  pluginLinkTargets,
  pluginLinkReport,
} from './harness-source.mjs';

const FED = dirname(dirname(fileURLToPath(import.meta.url)));
const MANIFEST = join(FED, 'src', 'content', 'generated', 'harness.json');
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
  // ~~The two `jssecurity:S8689` findings are now marked false-positive~~ — STRUCK at #721: the owner's
  // rule is that a security finding is FIXED IN CODE, never accepted. Both are fixed now by removing
  // the sink rather than arguing about the source: no file-derived version string is logged here or in
  // gen-harness.mjs, and the error below names the file instead of echoing the validator's message,
  // which quotes the raw value. Once the code no longer triggers the rule, the false-positive marks in
  // SonarCloud have nothing left to mark. The new test in harness-source.test.mjs still pins the
  // transformation; a call that discards the return never consumes it.
  committedVersion = assertPluginVersion(
    JSON.parse(readFileSync(PLUGIN_RELEASE, 'utf8')).version,
    'src/content/generated/plugin-release.json',
  );
} catch (err) {
  // The validator's message quotes the raw file value, so it is NOT echoed (jssecurity:S8689); the
  // error class is enough to say which kind of failure it was.
  console.error(
    `::error::src/content/generated/plugin-release.json is unusable (${err instanceof SyntaxError ? 'not valid JSON' : 'no valid X.Y.Z version'}). ` +
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
  // NO FILE-DERIVED VALUE IS LOGGED (jssecurity:S8689, log injection). Both versions are read from files
  // and pass through `assertPluginVersion`, but the taint engine cannot see that validator as a
  // sanitiser, and this repository's rule is to fix a security finding in code rather than mark it
  // accepted. The message names the two files to compare instead; nothing a reader needs is lost.
  console.error(
    '::error::src/content/generated/plugin-release.json is AHEAD of the VERSION file of ' +
      'tedeuxx/tadeumendonca-skills — the committed value names a release that does not exist, so the ' +
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

// THE COLLECTION IS GUARDED, and this is the difference between a signal and a stack trace.
//
// Every refusal in harness-source.mjs is deliberate and carefully worded — and until now all of them
// arrived here as an UNCAUGHT throw, so what the `harness-drift` job actually printed was a Node stack
// trace with the message buried in it and a non-zero exit nobody could act on. That is what this repo
// got when the plugin shipped its two-level `skills/` tree: the module said exactly what was wrong, in
// a form that read like a crash in this repo's own build.
//
// A COLLECTION FAILURE IS NOT DRIFT, so it does not borrow drift's fix line. `gen-harness` cannot help
// here — regenerating from a tree this module refuses to read reproduces the same refusal. The tree is
// what has to change, in the other repository, so that is what this says.
let components;
try {
  components = collectComponents(pluginDir);
} catch (err) {
  console.error(`::error::the tedeuxx/tadeumendonca-skills tree could not be read — ${err.message.split('\n')[0]}`);
  console.error(
    `The plugin tree at ${pluginDir} could not be turned into an inventory:\n\n${err.message}\n\n` +
      'This is almost certainly NOT your change — the plugin is a separate repository and a merge there\n' +
      'cannot turn this repo red until the next run here. Running `gen-harness` will NOT fix it: the\n' +
      'generator reads the same tree through the same reader and refuses it the same way.',
  );
  process.exit(1);
}

const diff = diffAgainstManifest(components, manifest);
const report = driftReport(diff);

if (report) {
  console.error(`::error::${report.split('\n')[0]}`);
  console.error(report);
  process.exit(1);
}

// The SECOND artifact against the same tree: the cross-repo links on /architecture. The checkout is
// already paid for above, and it runs last because its failure is a hand edit in two markdown files,
// while the manifest report names a generator, and a reader should act on the mechanical fix first.
//
// A third leg compared `AGENTS.md`'s `roster:dispatch` fence with the plugin's `agents/` until #715.
// The fence left the brief when the working method moved to the workstation (mhw), so the plugin is no
// longer the source of the roster this repository dispatches; that leg had no subject and was removed.
//
// Both editions, and the paths are POOLED rather than compared: the link-parity unit test already asserts
// the two editions cite the same targets in the same order, so re-deriving that here would be a second
// implementation of a rule that already has one.
const pageLinks = ['architecture.pt.md', 'architecture.en.md'].flatMap((f) =>
  pluginLinkTargets(readFileSync(join(FED, 'src', 'content', f), 'utf8')),
);
const linkProblem = pluginLinkReport(pageLinks, (p) => existsSync(join(pluginDir, p)));
if (linkProblem) {
  console.error(`::error::${linkProblem.split('\n')[0]}`);
  console.error(linkProblem);
  process.exit(1);
}

// The LAYOUT is named in the success line, not only in the failure ones (`-skills`#164). The plugin is
// checked out with no `ref:` above and in app.yml, so this job reads whatever `main` is at the moment it
// runs — and across the migration that is two different tree shapes producing two different manifests.
// A green run that does not say which one it compared leaves the one fact a reader would want unrecorded
// in the only place it was ever observed.
console.log(
  `::notice::the harness inventory matches tedeuxx/tadeumendonca-skills — ${manifest.length} component(s) verified in the ${pluginLayout(pluginDir)} layout, and all ${new Set(pageLinks).size} cross-repo link(s) on /architecture resolve`,
);
