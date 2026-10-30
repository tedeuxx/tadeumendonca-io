import { describe, it, expect } from 'vitest';
import { isExternalHref, isInternalHref } from './markdownLinks';
import { SITE_URL } from './site';

describe('isExternalHref (#712)', () => {
  it('accepts an absolute http(s) URL on another origin', () => {
    expect(isExternalHref('https://claude.ai/artifact/example-id')).toBe(true);
    expect(isExternalHref('http://example.com/x')).toBe(true);
  });

  it('rejects this site itself, read from SITE_URL rather than a literal', () => {
    expect(isExternalHref(`${SITE_URL}/en/library`)).toBe(false);
    expect(isExternalHref(SITE_URL)).toBe(false);
  });

  it('rejects relative paths, protocol-relative URLs, anchors, mailto and non-http schemes', () => {
    expect(isExternalHref('/library')).toBe(false);
    expect(isExternalHref('//example.com/x')).toBe(false);
    expect(isExternalHref('#section')).toBe(false);
    expect(isExternalHref('relative/path')).toBe(false);
    expect(isExternalHref('mailto:someone@example.com')).toBe(false);
    expect(isExternalHref('ftp://example.com/x')).toBe(false);
  });

  it('rejects an absent href rather than throwing', () => {
    expect(isExternalHref(undefined)).toBe(false);
  });
});

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
