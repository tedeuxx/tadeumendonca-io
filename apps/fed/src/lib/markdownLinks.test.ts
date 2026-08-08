import { describe, it, expect } from 'vitest';
import { isInternalHref } from './markdownLinks';

// The rule is narrow BY DESIGN and both edges matter, so both are pinned. The `//host` case is the one
// that looks like an oversight and is not: a protocol-relative URL is an external URL wearing a leading
// slash, and treating it as internal would rewrite someone else's domain into ours — in the renderer as a
// broken route, in the copied markdown as a link that points at the wrong site entirely.
describe('isInternalHref', () => {
  it('accepts a root-relative site path', () => {
    expect(isInternalHref('/library')).toBe(true);
    expect(isInternalHref('/')).toBe(true);
    expect(isInternalHref('/blog/meu-compromisso')).toBe(true);
  });

  it('rejects a protocol-relative URL, which is external despite the leading slash', () => {
    expect(isInternalHref('//example.com/x')).toBe(false);
  });

  it('rejects absolute URLs, mailto and in-page anchors', () => {
    expect(isInternalHref('https://example.com/x')).toBe(false);
    expect(isInternalHref('http://example.com/x')).toBe(false);
    expect(isInternalHref('mailto:someone@example.com')).toBe(false);
    expect(isInternalHref('#section')).toBe(false);
    expect(isInternalHref('relative/path')).toBe(false);
  });

  it('rejects an absent href rather than throwing', () => {
    expect(isInternalHref(undefined)).toBe(false);
  });
});
