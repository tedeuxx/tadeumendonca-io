// Lookup for the build-time compiled diagrams (#170, ADR-0040).
//
// Keyed by the diagram's own normalised source, and a PLAIN string lookup. The obvious design was to key
// by a content hash and recompute it here — the shape lib/content.ts uses to refuse a missing locale
// edition. That analogy is false: content.ts compares strings and checks key presence, cents of work,
// while hashing every fence at module load would ship a sha256 implementation into the browser bundle
// and run it on every page load, to catch a mistake that can only be made in this repo. The staleness
// check belongs in Node, and it lives in scripts/diagram-source.test.mjs where it costs a reader nothing.
import generated from './generated/diagrams.json';

const diagrams: Record<string, string> = generated;

/** Must match `normalise` in scripts/diagram-source.mjs — the key is agreed between generator and
 *  reader, so the two normalisations are one contract in two languages. Asserted by test. */
export function normaliseDiagramSource(source: string): string {
  return source
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
}

/**
 * The compiled SVG for a mermaid source.
 *
 * Throws rather than returning undefined, and that is the decision rather than an oversight. A
 * render-time fallback — an error card, an empty box, the raw source — is the failure mode this repo has
 * already paid for twice: #235 served Portuguese on /en/portfolio for three days, #213 served the home
 * page's OG card to every scraper, both because nothing objected. On a static site the prerender bakes
 * whatever happened into the served bytes, so a silent failure is not a moment, it is an artifact.
 * Throwing fails the build, the prerender, the unit tests and the E2E together.
 */
export function diagramSvg(source: string): string {
  const svg = diagrams[normaliseDiagramSource(source)];
  if (!svg) {
    throw new Error(
      'No compiled diagram for this mermaid source. It was edited without regenerating: run `npm run gen-diagrams`.',
    );
  }
  return svg;
}

export const diagramSources = (): string[] => Object.keys(diagrams);
