// Asks YouTube whether each embedded video can actually be embedded, and compares the answer to what
// `src/content/videos.json` claims. Run: `npm run check-video-embeddable`.
//
// THIS FILE IS THE NETWORK SHELL AND NOTHING ELSE. Every decision — what a status means, how it
// compares to the manifest, and what the run should exit with — lives in scripts/video-embeddable.mjs,
// which is unit-tested and in the coverage include. That split is the bar sonar-project.properties
// states for excluding a script from the metric, and it is the same one gen-video-thumbs.mjs clears
// against video-thumbs.mjs. There the thing the runner cannot have is a browser; here it is a network
// call to a third party, which `npm test` must never make.
//
// WHY IT IS NOT A GATE, and this is the design decision rather than a caveat.
//
// It makes one third-party request per video. A build that reddens because YouTube is unreachable
// converts someone else's outage into our own red pipeline, and the first response to a red that
// nobody caused is to relax it — which is how a gate becomes theatre. So this script is wired into NO
// workflow, NO test run and NO build step. It is invoked by a human, deliberately, and it reports.
//
// It also does not WRITE. A script that edited `videos.json` from a third party's answer would put an
// unreviewed claim into the repository on a schedule, and the flag's whole value is that a human typed
// it knowing what it means. This prints what it found; the edit is a decision.
//
// THE CEILING, said plainly because the manifest cannot say it: nothing runs this automatically, so a
// video whose owner disables embedding tomorrow is caught the next time a human runs it and not
// before. That is the honest limit of a check that must not redden the build for a third party's
// downtime.
import { resolve, join } from 'node:path';
import { readManifest, videoIdsIn } from './video-thumbs.mjs';
import { oembedUrl, verdictForStatus, claimedFor, classify, exitCodeFor, formatRow } from './video-embeddable.mjs';

const root = resolve(import.meta.dirname, '..');
const contentDir = join(root, 'src', 'content');
const manifest = readManifest(join(contentDir, 'videos.json'));
const ids = videoIdsIn(contentDir);

const TIMEOUT_MS = 10_000;

/** One request. A thrown error is an UNVERIFIED verdict, never an answer. */
async function probe(id) {
  try {
    const res = await fetch(oembedUrl(id), { redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS) });
    return { verdict: verdictForStatus(res.status), detail: `HTTP ${res.status}` };
  } catch (err) {
    return { verdict: 'unverified', detail: err instanceof Error ? err.message : String(err) };
  }
}

const rows = [];
for (const id of ids) {
  const { verdict, detail } = await probe(id);
  rows.push({ id, claimed: claimedFor(manifest[id]), verdict, detail });
}

const width = Math.max(...rows.map((r) => r.id.length));
for (const row of rows) console.log(formatRow(row, width));

const found = classify(rows);

for (const r of found.stale) {
  console.log(`::warning::${r.id} is flagged \`embeddable: false\` but YouTube embeds it — remove the flag?`);
}
for (const r of found.undeclared) {
  console.log(
    `::error::${r.id} has embedding DISABLED and the manifest does not say so — it renders a player that dies on click. Add \`"embeddable": false\`.`,
  );
}
for (const r of found.unverified) {
  console.log(`::warning::${r.id} could not be checked (${r.detail}) — this is NOT a pass.`);
}

const code = exitCodeFor(found);
if (code === 2) {
  console.log(`\n${found.unverified.length}/${rows.length} unchecked. Exiting 2: the check did not run, which is not the same as passing.`);
} else if (code === 1) {
  console.log(`\n${found.undeclared.length} undeclared, ${found.stale.length} stale. Exiting 1.`);
} else {
  console.log(`\n${rows.length}/${rows.length} checked, all consistent with src/content/videos.json.`);
}
process.exit(code);
