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
