// Asks YouTube whether each embedded video can actually be embedded, and compares the answer to what
// `src/content/videos.json` claims. Run: `npm run check-video-embeddable`.
//
// WHY IT IS NOT A GATE, and this is the whole design decision rather than a caveat.
//
// It makes one network request per video to a third party. A build that reddens because YouTube is
// unreachable is worse than the defect it guards — it converts someone else's outage into our own red
// pipeline, and the first response to a red that nobody caused is to relax it, which is how a gate
// becomes theatre. So this script is wired into NO workflow, NO test run and NO build step. It is
// invoked by a human, deliberately, and it reports.
//
// It also does not write. A script that edited `videos.json` from a third party's answer would put an
// unreviewed claim into the repository on a schedule, and the flag's whole value is that a human typed
// it knowing what it means. This prints what it found; the edit is a decision.
//
// IT MUST NOT FAIL OPEN, which is the one thing it does not compromise on. Three exit codes, and
// "could not check" is never spelled the same way as "checked and fine":
//
//   0  every video was reached, and every answer agrees with the manifest
//   1  every video was reached, and at least one answer CONTRADICTS the manifest
//   2  at least one video could not be reached, or answered in a way this script cannot interpret
//
// WHAT THE PROBE ACTUALLY MEASURES. `https://www.youtube.com/oembed?url=…&format=json` answers 200 for
// a video that may be embedded and 401 for one whose owner has disabled embedding. Measured 2026-09-03
// against this manifest's own ids — pqlWNihgdjI (the AWS video, flagged) returned 401; rKV5JcALQoQ
// returned 200. Anything else (404 for a removed or private video, 429, a timeout, a redirect to a
// consent page) is UNVERIFIED and exits 2. A 200 is read as "embedding is not disabled", which is what
// the 401 discriminates and is not the same as a promise that the frame will render.
//
// THE CEILING, said plainly because the manifest cannot say it: nothing runs this automatically, so a
// video whose owner disables embedding tomorrow is caught the next time a human runs it and not before.
// That is the honest limit of a check that must not redden the build for a third party's downtime.
import { resolve, join } from 'node:path';
import { readManifest, videoIdsIn } from './video-thumbs.mjs';

const root = resolve(import.meta.dirname, '..');
const contentDir = join(root, 'src', 'content');
const manifest = readManifest(join(contentDir, 'videos.json'));
const ids = videoIdsIn(contentDir);

const TIMEOUT_MS = 10_000;

/** `embeddable` | `disabled` | `unverified` — never a boolean, so an unreached video cannot read as a pass. */
async function probe(id) {
  const url = `https://www.youtube.com/oembed?url=https%3A//www.youtube.com/watch%3Fv%3D${id}&format=json`;
  try {
    const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (res.status === 200) return { verdict: 'embeddable', detail: '200' };
    if (res.status === 401) return { verdict: 'disabled', detail: '401' };
    return { verdict: 'unverified', detail: `HTTP ${res.status}` };
  } catch (err) {
    return { verdict: 'unverified', detail: err instanceof Error ? err.message : String(err) };
  }
}

const rows = [];
for (const id of ids) {
  const claimed = manifest[id]?.embeddable === false ? 'disabled' : 'unknown';
  const { verdict, detail } = await probe(id);
  rows.push({ id, claimed, verdict, detail });
}

const width = Math.max(...rows.map((r) => r.id.length));
for (const r of rows) {
  console.log(`${r.id.padEnd(width)}  manifest=${r.claimed.padEnd(8)}  youtube=${r.verdict.padEnd(10)}  (${r.detail})`);
}

// A manifest `disabled` that YouTube says is fine — the flag is stale or was wrong. Costs a reader a
// preview where a player would have worked: visible, and the cheap direction.
const staleFlags = rows.filter((r) => r.claimed === 'disabled' && r.verdict === 'embeddable');
// A video the manifest says nothing about that YouTube refuses to embed — TODAY'S DEFECT, undeclared.
// This is the direction the schema cannot prevent, because "absent" is also the honest default.
const undeclared = rows.filter((r) => r.claimed === 'unknown' && r.verdict === 'disabled');
const unverified = rows.filter((r) => r.verdict === 'unverified');

for (const r of staleFlags) {
  console.log(`::warning::${r.id} is flagged \`embeddable: false\` but YouTube embeds it — remove the flag?`);
}
for (const r of undeclared) {
  console.log(`::error::${r.id} has embedding DISABLED and the manifest does not say so — it renders a player that dies on click. Add \`"embeddable": false\`.`);
}
for (const r of unverified) {
  console.log(`::warning::${r.id} could not be checked (${r.detail}) — this is NOT a pass.`);
}

if (unverified.length > 0) {
  console.log(`\n${unverified.length}/${rows.length} unchecked. Exiting 2: the check did not run, which is not the same as passing.`);
  process.exit(2);
}
if (undeclared.length + staleFlags.length > 0) {
  console.log(`\n${undeclared.length} undeclared, ${staleFlags.length} stale. Exiting 1.`);
  process.exit(1);
}
console.log(`\n${rows.length}/${rows.length} checked, all consistent with src/content/videos.json.`);
