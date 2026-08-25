import { describe, it, expect } from 'vitest';
import { isPreviewRequested, PREVIEW_PARAM } from './preview';

// #510 — the gate value that distinguishes reading a held article from not finding it.
//
// Small surface, and the tests are about the SHAPES A REAL URL TAKES rather than about the function
// being a one-liner: every case below is a URL the owner would actually produce by hand or by paste, and
// each of them failing would look identical from the outside — the article silently redirects home and
// the owner concludes the feature is broken rather than that the query string was.
describe('isPreviewRequested', () => {
  it('opens on the bare parameter, with no value at all', () => {
    expect(isPreviewRequested('?preview')).toBe(true);
  });

  // The three shapes a person or a link actually produces. Presence is the contract, so a value must
  // never be REQUIRED — a check on truthiness would reject `?preview=` and `?preview=0`, and the owner
  // pasting either would get the home page with nothing to explain why.
  it('opens on an empty value and on any value — presence is the contract, not the value', () => {
    expect(isPreviewRequested('?preview=')).toBe(true);
    expect(isPreviewRequested('?preview=1')).toBe(true);
    expect(isPreviewRequested('?preview=0')).toBe(true);
  });

  it('opens when the parameter arrives beside others, in either position', () => {
    expect(isPreviewRequested('?utm_source=whatsapp&preview=1')).toBe(true);
    expect(isPreviewRequested('?preview&utm_source=whatsapp')).toBe(true);
  });

  it('stays shut on no query string at all — the ordinary visitor', () => {
    expect(isPreviewRequested('')).toBe(false);
    expect(isPreviewRequested('?')).toBe(false);
  });

  // The near-miss cases. `URLSearchParams.has` is exact, and these assert that rather than assume it: a
  // hand-rolled `search.includes('preview')` — the obvious wrong implementation — passes every test above
  // and fails all three of these, which is exactly why they are here.
  it('stays shut on a parameter that merely CONTAINS the name', () => {
    expect(isPreviewRequested('?previewing=1')).toBe(false);
    expect(isPreviewRequested('?not-preview=1')).toBe(false);
    expect(isPreviewRequested('?utm_campaign=preview')).toBe(false);
  });

  // Case-sensitive, asserted rather than left to chance: it is a decision, and the alternative (accepting
  // `?Preview`) would be a second spelling of a URL contract with nothing declaring which one is right.
  it('is case-sensitive', () => {
    expect(isPreviewRequested('?Preview=1')).toBe(false);
  });

  it('names the parameter once, so nothing re-types the URL contract', () => {
    expect(PREVIEW_PARAM).toBe('preview');
    expect(isPreviewRequested(`?${PREVIEW_PARAM}`)).toBe(true);
  });
});
