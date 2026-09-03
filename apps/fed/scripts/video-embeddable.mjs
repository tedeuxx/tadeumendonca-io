// The pure half of the embeddability check: what a YouTube answer MEANS, how it compares to what
// `src/content/videos.json` claims, and what that comparison should exit with.
//
// Split from check-video-embeddable.mjs for the reason video-thumbs.mjs is split from
// gen-video-thumbs.mjs, and sonar-project.properties states the bar this has to clear: everything that
// DECIDES belongs where a test can reach it without the thing the runner cannot have. There it was a
// browser; here it is a network call to a third party, which `npm test` must never make.
//
// WHAT THE PROBE MEASURES, and it is narrower than "does this video play".
// `https://www.youtube.com/oembed?url=…&format=json` answers 200 for a video that may be embedded and
// 401 for one whose owner has disabled embedding. Measured 2026-09-03 against this repository's own
// manifest: `pqlWNihgdjI` returned 401, and the other ten returned 200. Anything else — 404 for a
// removed or private video, 429, a timeout, a redirect to a consent page — is UNVERIFIED. A 200 means
// "embedding is not disabled", which is what the 401 discriminates; it is not a promise that the frame
// will render.

/** The oembed endpoint for a video id. The inner URL is encoded so its own `?v=` is not read as ours. */
export const oembedUrl = (id) =>
  `https://www.youtube.com/oembed?url=https%3A//www.youtube.com/watch%3Fv%3D${id}&format=json`;

/**
 * An HTTP status as a verdict.
 *
 * NEVER A BOOLEAN, deliberately: two values cannot express the difference between "checked, and it is
 * fine" and "could not check", and collapsing those is exactly how a check ends up failing open. The
 * third value is what the exit code below is built on.
 */
export function verdictForStatus(status) {
  if (status === 200) return 'embeddable';
  if (status === 401) return 'disabled';
  return 'unverified';
}

/** What the manifest CLAIMS about a video: `disabled`, or `unknown`. There is deliberately no `yes`. */
export const claimedFor = (entry) => (entry?.embeddable === false ? 'disabled' : 'unknown');

/**
 * Rows split into the three findings that matter, each named for the failure it is.
 *
 * `undeclared` is TODAY'S DEFECT: a video the manifest says nothing about that YouTube refuses to
 * embed, so the site renders a play button that dies after a click. It is the direction the schema
 * cannot prevent, because "absent" is also the honest default for a video nobody has checked.
 *
 * `stale` is the cheap direction: a flag that is wrong or has been overtaken, costing a reader a link
 * preview where a player would have worked — visible on the page, reversible in one line.
 *
 * `unverified` is not a finding about a video at all. It is a finding about the CHECK.
 */
export function classify(rows) {
  return {
    stale: rows.filter((r) => r.claimed === 'disabled' && r.verdict === 'embeddable'),
    undeclared: rows.filter((r) => r.claimed === 'unknown' && r.verdict === 'disabled'),
    unverified: rows.filter((r) => r.verdict === 'unverified'),
  };
}

/**
 * The exit code, and the ORDER of these branches is the whole point.
 *
 * `unverified` is checked FIRST and outranks a real finding, because a run that could not reach every
 * video does not know whether it found everything — reporting 0 or 1 from a partial run would state a
 * conclusion the data does not support.
 *
 *   0  every video reached, every answer agrees with the manifest
 *   1  every video reached, at least one answer CONTRADICTS the manifest
 *   2  at least one video unreachable, or answering uninterpretably — NOT a pass
 */
export function exitCodeFor({ stale, undeclared, unverified }) {
  if (unverified.length > 0) return 2;
  if (undeclared.length > 0 || stale.length > 0) return 1;
  return 0;
}

/** One aligned report line per video. */
export const formatRow = (row, width) =>
  `${row.id.padEnd(width)}  manifest=${row.claimed.padEnd(8)}  youtube=${row.verdict.padEnd(10)}  (${row.detail})`;
