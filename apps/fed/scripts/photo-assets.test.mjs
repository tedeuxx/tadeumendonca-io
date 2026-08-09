// The photograph registry, against the committed JPEGs themselves (#415).
//
// WHY THIS FILE EXISTS AT ALL. `src/data/photos.json` is a hand-typed table of numbers ABOUT A BINARY,
// and the only thing that makes such a table worth having is something that compares it to the binary.
// Without this, a recrop that changes a shape leaves the <img> reserving a box of the old proportions —
// the exact layout shift the width/height attributes were added to remove, now with a test suite standing
// next to it saying nothing.
//
// WHY IT IS HERE RATHER THAN NEXT TO THE MODULE IT CHECKS: it needs `node:fs`, and `tsconfig.json`
// records a deliberate decision that this app does not depend on `@types/node`. `scripts/` is outside the
// typechecked tree and is already where a test that reads content files off disk lives
// (`architecture-diagrams.test.mjs`), so this is the existing seam rather than a new one.
//
// The dimensions are read from the JPEG's own SOF marker rather than from an image library: this is a
// static site with a deliberate dependency floor (ADR-0001), and a twenty-line header walk is a smaller
// thing to own than a decoder.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const fedDir = resolve(import.meta.dirname, '..');
const publicDir = join(fedDir, 'public');
const photosDir = join(publicDir, 'photos');
const PHOTOS = JSON.parse(readFileSync(join(fedDir, 'src', 'data', 'photos.json'), 'utf8'));
const fileFor = (src) => join(publicDir, src.replace(/^\//, ''));

/**
 * A JPEG's real pixel dimensions, from its SOF (Start Of Frame) marker.
 *
 * Walks the segment chain rather than scanning for a byte pattern, because `FF C0` occurs inside
 * compressed entropy data often enough that a scan finds a plausible, wrong answer — which is the worst
 * possible failure for a check whose whole job is to detect a wrong number.
 */
function jpegSize(bytes) {
  if (bytes.readUInt16BE(0) !== 0xffd8) throw new Error('not a JPEG — no SOI marker');
  let i = 2;
  while (i < bytes.length) {
    if (bytes[i] !== 0xff) throw new Error(`segment chain broke at byte ${i}`);
    const marker = bytes[i + 1];
    // Standalone markers carry no length; SOS (DA) begins entropy data and ends the useful chain.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    if (marker === 0xda) break;
    const length = bytes.readUInt16BE(i + 2);
    // SOF0–SOF15, excluding the three in that range that are not frame headers: DHT (C4), JPG (C8),
    // DAC (CC).
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: bytes.readUInt16BE(i + 5), width: bytes.readUInt16BE(i + 7) };
    }
    i += 2 + length;
  }
  throw new Error('no SOF marker — cannot read the dimensions');
}

/** Does this JPEG carry an APP1 `Exif` block? */
function hasExif(bytes) {
  let i = 2;
  while (i < bytes.length) {
    if (bytes[i] !== 0xff) return false;
    const marker = bytes[i + 1];
    if (marker === 0xda) return false;
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    const length = bytes.readUInt16BE(i + 2);
    if (marker === 0xe1 && bytes.subarray(i + 4, i + 8).toString('latin1') === 'Exif') return true;
    i += 2 + length;
  }
  return false;
}

describe('the photograph registry describes the files that shipped', () => {
  // Guard against a vacuous suite: an empty table passes every `it.each` below by generating no cases.
  it('is not empty', () => {
    expect(PHOTOS.length).toBeGreaterThan(0);
  });

  it.each(PHOTOS.map((p) => [p.src, p]))('%s exists on disk', (_src, photo) => {
    expect(existsSync(fileFor(photo.src))).toBe(true);
  });

  it.each(PHOTOS.map((p) => [p.src, p]))('%s is declared at the size it really is', (_src, photo) => {
    const actual = jpegSize(readFileSync(fileFor(photo.src)));
    expect(actual).toEqual({ width: photo.width, height: photo.height });
  });

  // THE DEFECT THIS SLICE ACTUALLY HIT, pinned so the next crop cannot repeat it silently.
  //
  // The first pass through the crop pipeline produced files whose PIXELS were correct and whose EXIF
  // Orientation tag said "rotate me 90°". Browsers honour that tag by default (`image-orientation:
  // from-image`), so the reader would have got a photograph turned on its side inside a box reserved from
  // the un-rotated width and height — a broken picture AND a broken reservation, from metadata that no
  // visual check of the pixels can see. It was found by looking at a rendered file, not by reading the
  // command that produced it.
  //
  // Asserted as the ABSENCE OF ANY Exif BLOCK rather than as "orientation equals 1", because that is the
  // property the export step actually establishes and it cannot be satisfied by accident: with no Exif
  // segment there is no orientation tag to disagree with the declared size.
  it.each(PHOTOS.map((p) => [p.src, p]))(
    '%s carries no EXIF block, so no orientation tag can rotate it under the reader',
    (_src, photo) => {
      expect(hasExif(readFileSync(fileFor(photo.src)))).toBe(false);
    },
  );

  // The other direction, and the one a subset test misses: a file in the directory the registry does not
  // know about renders as a bare <img> — no caption, no alt requirement, no reserved box — which is the
  // silent default this whole mechanism exists to replace.
  it('knows about every file in public/photos', () => {
    const onDisk = readdirSync(photosDir).filter((f) => f.endsWith('.jpg'));
    const registered = PHOTOS.map((p) => p.src.replace('/photos/', ''));
    expect(onDisk.sort()).toEqual(registered.sort());
  });

  // The page is served to phones on mobile data and there is deliberately NO build-time optimiser — a new
  // dependency and tool class against ADR-0001, to compress four files. That trade is only defensible
  // while the files stay small, so the bound is asserted rather than remembered: an unoptimised export
  // dropped into this directory is caught here instead of in someone's data allowance.
  it('keeps the four photographs under 1 MB in total', () => {
    const bytes = PHOTOS.map((p) => readFileSync(fileFor(p.src)).length).reduce((a, b) => a + b, 0);
    expect(bytes, `the photographs weigh ${Math.round(bytes / 1024)} KB`).toBeLessThan(1024 * 1024);
  });
});
