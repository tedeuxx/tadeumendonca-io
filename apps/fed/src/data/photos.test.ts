import { describe, it, expect } from 'vitest';
import { PHOTOS, photoFor } from './photos';

// The RESOLUTION half of the photograph registry. The other half — whether the numbers in `photos.json`
// are the committed JPEGs' real dimensions, and whether those files carry an EXIF orientation tag that
// would rotate them under the reader — lives in `scripts/photo-assets.test.mjs`, because it needs
// `node:fs` and this tree is deliberately typechecked without `@types/node`.
describe('the photograph registry', () => {
  // Guard against a vacuous suite: an empty table makes every lookup below fail for the wrong reason and
  // makes every `for` over PHOTOS elsewhere pass in silence.
  it('is not empty', () => {
    expect(PHOTOS.length).toBeGreaterThan(0);
  });

  it('declares a positive intrinsic box for every entry', () => {
    for (const p of PHOTOS) {
      expect(p.width, `${p.src} has no width`).toBeGreaterThan(0);
      expect(p.height, `${p.src} has no height`).toBeGreaterThan(0);
    }
  });

  // A duplicate `src` makes `photoFor` return whichever came first and hides the second entry's numbers,
  // which is a wrong reservation that no other check would notice.
  it('registers each file exactly once', () => {
    const srcs = PHOTOS.map((p) => p.src);
    expect(new Set(srcs).size).toBe(srcs.length);
  });
});

describe('photoFor', () => {
  it('resolves a registered target to its measured box', () => {
    const knuth = photoFor('/photos/knuth-cv-museum.jpg');
    expect(knuth).not.toBeNull();
    expect(knuth!.width).toBe(1600);
    expect(knuth!.height).toBe(704);
  });

  // The opt-in half: anything not in the table stays a plain image rather than becoming a figure with an
  // invented size. `undefined` is covered because react-markdown can hand a handler an image with no src.
  it('returns null for an unregistered target and for no target at all', () => {
    expect(photoFor('/og-default.png')).toBeNull();
    expect(photoFor(undefined)).toBeNull();
  });
});
