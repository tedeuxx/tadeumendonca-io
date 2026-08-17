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
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  collectComponents,
  collectPersonas,
  diffAgainstManifest,
  driftReport,
  pluginLayout,
  pluginPresent,
  readPluginVersion,
  resolvePluginDir,
  rosterDispatchNames,
  rosterDispatchReport,
  assertEnforcement,
  assertPluginVersion,
  pluginLinkTargets,
  pluginLinkReport,
  pluginLinkParityReport,
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

// ---------------------------------------------------------------------------------------------
// CROSS-EDITION PARITY of the plugin links on /architecture — and, like the version assertion above,
// deliberately ABOVE THE SKIP. It compares the two markdown files in THIS repository against each other,
// so it needs no plugin tree at all; putting it below the skip would make an offline, local-checkable
// rule depend on a sibling repo being cloned, on a path that exits 0.
//
// The read is hoisted here rather than duplicated: the existence check further down consumes these same
// two arrays, so each file is opened once.
//
// IT THEREFORE REPORTS BEFORE THE MANIFEST DIFF, which inverts this file's own ordering rule ("name the
// mechanical fix first") — stated here rather than left for a reader to catch. Placement above the skip
// is a constraint and the ordering rule is a preference, so the preference yields; and where both do
// fire the inversion is arguably the right way round anyway, because every report below this one begins
// "this is almost certainly NOT your change" and this one is the single failure in the job that IS.
const [ptLinks, enLinks] = ['architecture.pt.md', 'architecture.en.md'].map((f) =>
  pluginLinkTargets(readFileSync(join(FED, 'src', 'content', f), 'utf8')),
);
const parityProblem = pluginLinkParityReport(ptLinks, enLinks);
if (parityProblem) {
  console.error(`::error::${parityProblem.split('\n')[0]}`);
  console.error(parityProblem);
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

// The THIRD artifact against the same tree: the cross-repo links on /architecture. Same reasoning as the
// roster check above — the checkout is already paid for — and the same ordering rule: it runs last
// because its failure is a hand edit in two markdown files, while the two above name a generator or a
// list, and a reader should act on the mechanical fix first.
//
// Both editions, POOLED — and the justification for pooling used to be a false one, corrected here
// rather than deleted because it is the sentence that hid a real gap. It read: "the link-parity unit test
// already asserts the two editions cite the same targets in the same order, so re-deriving that here
// would be a second implementation of a rule that already has one." It does not. `architecture-links.test.ts`
// matches `tadeumendonca-io` URLs only, so a PLUGIN link was invisible to it and its parity assertion
// compared [] to []. Pooling on top of that meant one edition's citation satisfied the floor for both.
//
// Parity is now asked ABOVE the skip, by `pluginLinkParityReport`, before this line runs — so by the time
// the pooled list is built the two editions are known to be identical, which is what makes pooling sound
// here rather than merely convenient: existence is a property of the target, and asking it twice about
// two identical lists would double the same question.
const pageLinks = [...ptLinks, ...enLinks];
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
  `::notice::the harness inventory matches tedeuxx/tadeumendonca-skills — ${manifest.length} component(s) verified in the ${pluginLayout(pluginDir)} layout, CLAUDE.md dispatches the ${guideRoster.length} live persona(s), and all ${new Set(pageLinks).size} cross-repo link(s) on /architecture resolve`,
);
