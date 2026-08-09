// The intrinsic size of every photograph a content body may embed (#415).
//
// WHY A REGISTRY AT ALL, when the browser could just load the file and find out: because "find out" is
// exactly the cost. Without `width`/`height` on the <img> the browser reserves no space, the paragraph
// below it is painted where the image will not be, and the page jumps when the bytes land — cumulative
// layout shift, on four figures, on the page whose thesis is that the machine is shown rather than
// claimed. The attributes are what let the box be reserved before a single byte of JPEG arrives.
//
// WHY THE TABLE IS JSON AND NOT LITERALS IN THIS FILE. Numbers hand-typed about a binary are worth having
// only if something compares them to the binary, and the thing that can do that has to read files —
// which means `node:fs`, which means `@types/node`, which `tsconfig.json` records a deliberate decision
// not to depend on. So the table sits in JSON, this module gives it a type for the app, and
// `scripts/photo-assets.test.mjs` — outside the typechecked tree, exactly where
// `architecture-diagrams.test.mjs` already lives — parses each JPEG's SOF marker off disk and compares.
// A recrop that changes a shape and forgets the table turns that suite red rather than shipping a wrong
// reservation. Same split as `harness.json` and `diagrams.json`: one artifact, two readers.
//
// NO LOCALE SUFFIX, deliberately. A photograph is not translated: both editions embed the same file, and
// the parity probe in `content/architecture-photos.test.ts` asserts exactly that. The words that DO
// differ per locale — the caption and the alt — are authored in the markdown, per edition, where a
// translator can see them.
import table from './photos.json';

export interface PhotoAsset {
  /** Root-relative, as authored in markdown. The browser resolves it against the origin. */
  readonly src: string;
  readonly width: number;
  readonly height: number;
}

export const PHOTOS: readonly PhotoAsset[] = table;

/**
 * The registered photograph for a markdown image target, or `null` for anything else.
 *
 * Returning `null` rather than guessing is the opt-in that keeps this facade narrow: an unregistered
 * image target stays whatever the renderer would otherwise make of it, exactly as an unregistered URL
 * stays a plain link in `repoCardFor`. A photograph has to be added to the table — and therefore
 * measured — before it can render as a figure.
 */
export function photoFor(src: string | undefined): PhotoAsset | null {
  if (!src) return null;
  return PHOTOS.find((p) => p.src === src) ?? null;
}
