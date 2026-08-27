// The pure half of the diagram pipeline (#170): find the mermaid sources, normalise them, hash them.
//
// Split out from gen-diagrams.mjs deliberately. The rendering half needs a browser and cannot be unit
// tested; everything that decides WHICH diagrams exist and WHETHER the committed artifact still matches
// them is decision logic, and lives here where it is testable without one. The generator is then a thin
// shell around tested functions rather than an untestable blob that happens to contain some logic.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** Long-form bodies that may carry diagrams. One file per locale (ADR-0032), so both are scanned. */
export function longFormFiles(contentDir) {
  return readdirSync(contentDir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => join(contentDir, f));
}

/**
 * Normalise before hashing so a diagram is identified by what it MEANS, not by how it was typed.
 * Without this, re-indenting a fence or changing its line endings invalidates the committed artifact and
 * fails the build for a whitespace edit — a guard that cries wolf gets disabled, and then it guards
 * nothing. Trailing whitespace, blank-line padding and CRLF are all noise here; interior structure is not.
 */
export function normalise(source) {
  return source
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
}

/**
 * A stable id for the diagram's SVG root element — NOT the artifact key.
 *
 * mermaid generates random element ids by default, so identical input would produce a different SVG on
 * every run and the committed artifact would churn with an unreviewable diff. Deriving it from the
 * source fixes that. Truncated to 16 hex chars: collision risk is nil at this scale and a full sha256
 * makes the generated file harder to read for no gain.
 */
export function hashOf(source) {
  return createHash('sha256').update(normalise(source)).digest('hex').slice(0, 16);
}

/**
 * Every ```mermaid fence in a markdown body, in document order.
 *
 * Fences are matched at the start of a line so an indented example INSIDE another code block is not
 * mistaken for a diagram to compile.
 */
export function mermaidFences(markdown) {
  const out = [];
  const re = /^```mermaid[ \t]*\n([\s\S]*?)^```[ \t]*$/gm;
  let m;
  while ((m = re.exec(markdown)) !== null) {
    const source = normalise(m[1]);
    out.push({ source, hash: hashOf(source) });
  }
  return out;
}

/** Every fence across every long-form file, with the file it came from (for error messages that name it). */
export function collectFences(contentDir) {
  return longFormFiles(contentDir).flatMap((file) =>
    mermaidFences(readFileSync(file, 'utf8')).map((fence) => ({ ...fence, file })),
  );
}

/**
 * The dagre spacing a fence is laid out with, keyed on the flow DIRECTION it declares (#473).
 *
 * WHY THIS IS NOT ONE CONSTANT, which is what the Issue proposed and what was measured instead. On
 * /architecture the three mermaid figures render at 2.1–3.5px painted type on a phone, because the SVG
 * carries `width="100%"` with an inline `max-width` at its natural width — so the render scale on a
 * narrow canvas is `canvas ÷ figure width` and NOTHING ELSE. Only the figure's WIDTH matters, and which
 * mermaid knob controls width depends on the direction:
 *
 *   `flowchart LR` — ranks run left to right, so `rankSpacing` is the horizontal gap. It is the lever.
 *   `flowchart TB` — ranks run top to bottom, so `rankSpacing` is VERTICAL and buys zero width.
 *                    Measured: 1235.75px at rankSpacing 50, 1235.75px at 20, 1235.75px at 10.
 *
 * `nodeSpacing` is the other axis in both, and it narrows both figure kinds (in LR it repacks the
 * subgraph columns), so it is lowered everywhere.
 *
 * AND `rankSpacing` MUST NOT BE LOWERED ON A `TB` FENCE — this is the load-bearing half. In a top-down
 * flow the band a subgraph's own title is drawn in comes out of the inter-rank gap, so shrinking it
 * slides the first row of boxes up THROUGH the title: at rankSpacing 16 the `TIER 1 · product`,
 * `TIER 1 · content` and `AFK · from ready to merge…` labels render struck through by the nodes beneath
 * them, still legible enough to look intentional. Rendered to PNG and looked at, because it is invisible
 * to every assertion this repo has — the suite measures WIDTHS, and the width is what improves.
 *
 * Values are deliberately small-but-nonzero. mermaid treats `0` as absent and falls back to its own
 * defaults, so a floor of 0/0 renders WIDER than 16/12 — measured at 1802px against 1628px, which reads
 * as the knob having no effect rather than as a rejected value.
 */
export function spacingFor(source) {
  const nodeSpacing = 12;
  // `graph` as well as `flowchart`: mermaid still accepts the older keyword, and every fence here is
  // authored by hand. A `graph LR` falling through to the vertical branch would keep the wide default
  // silently — the figure would simply stay unreadable, with nothing anywhere to say why.
  return /^\s*(?:flowchart|graph)\s+(?:LR|RL)\b/.test(source)
    ? { rankSpacing: 16, nodeSpacing }
    : { nodeSpacing };
}

/**
 * Compare the authored sources against the committed artifact, both ways.
 *
 * BOTH directions matter and for different reasons. `missing` is the staleness case — someone edited a
 * diagram and did not regenerate, so the page would render the previous picture or nothing at all. A
 * stale diagram is worse than an absent one: a picture reads as current in a way prose does not.
 * `orphaned` is the accumulation case — nothing breaks, which is exactly why it never gets noticed, and
 * the artifact grows dead SVGs nobody can prove are dead.
 */
export function diffAgainstArtifact(fences, artifact) {
  const authored = new Set(fences.map((f) => f.source));
  const committed = new Set(Object.keys(artifact));
  return {
    missing: fences.filter((f) => !committed.has(f.source)),
    orphaned: [...committed].filter((s) => !authored.has(s)),
  };
}
