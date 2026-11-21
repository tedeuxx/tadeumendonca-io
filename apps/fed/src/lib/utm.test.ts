import { describe, it, expect } from 'vitest';
import {
  withShareUtm,
  SHARE_MEDIUM,
  SHARE_CAMPAIGN,
  AUTHOR_CAMPAIGN,
  YOUTUBE_SOURCE,
  type ShareSource,
} from './utm';
import type { ShareCompleteTarget } from './analytics';

const ARTICLE = 'https://tadeumendonca.io/pt/blog/meu-compromisso';

describe('withShareUtm', () => {
  it('tags an article URL with exactly the three campaign parameters', () => {
    const url = new URL(withShareUtm(ARTICLE, 'whatsapp'));
    expect(url.searchParams.get('utm_source')).toBe('whatsapp');
    expect(url.searchParams.get('utm_medium')).toBe('social');
    expect(url.searchParams.get('utm_campaign')).toBe('reader-share');
    // Exactly three: utm_content was deliberately dropped (#272). The landing page already carries the
    // article AND the locale (a path prefix), so it would have informed no decision page_path does not,
    // while being a permanent obligation baked into links in other people's chat histories.
    expect([...url.searchParams.keys()]).toHaveLength(3);
  });

  // These strings are load-bearing in a way a rename would silently break, so they are pinned as
  // literals rather than compared to themselves. `social` is what GA4's default channel grouping
  // matches to put a session in Organic Social — `social-share` and `share` fall to Unassigned. It
  // matters most for X, which is NOT in GA4's built-in source-category list (it still knows `twitter`),
  // so the medium is the only thing keeping X in the same bucket as the other two.
  it('pins the medium and campaign to the values GA4 actually groups on', () => {
    expect(SHARE_MEDIUM).toBe('social');
    expect(SHARE_CAMPAIGN).toBe('reader-share');
    expect(AUTHOR_CAMPAIGN).toBe('author-post');
  });

  it('keeps the path and origin untouched — it tags, it does not rewrite', () => {
    const url = new URL(withShareUtm(ARTICLE, 'linkedin'));
    expect(url.origin).toBe('https://tadeumendonca.io');
    expect(url.pathname).toBe('/pt/blog/meu-compromisso');
  });

  // The owner's own distribution (ADR-0038) must stay separable from a link a READER sent — that
  // separation IS the measurement. Today the owner's drafts emit a clean URL so it holds by accident;
  // this proves the reserved value works the day that changes.
  it('accepts the reserved owner campaign, so owner posts stay separable from reader shares', () => {
    const url = new URL(withShareUtm(ARTICLE, 'linkedin', AUTHOR_CAMPAIGN));
    expect(url.searchParams.get('utm_campaign')).toBe('author-post');
  });

  it('is idempotent — tagging twice does not duplicate a parameter', () => {
    const once = withShareUtm(ARTICLE, 'x');
    const twice = withShareUtm(once, 'x');
    expect(twice).toBe(once);
  });
});

// YouTube is an AUTHOR-side source (#817, ADR-0039 amendment 2026-11-21): a Short's description carries
// the author's per-language link. Same medium, existing author campaign, new source only.
describe('the YouTube author source', () => {
  it('pins the source literal, since it joins the immutable set on first use', () => {
    expect(YOUTUBE_SOURCE).toBe('youtube');
  });

  it('tags a per-language article link as youtube / social / author-post, exactly three parameters', () => {
    for (const article of [ARTICLE, 'https://tadeumendonca.io/en/blog/my-commitment']) {
      const url = new URL(withShareUtm(article, YOUTUBE_SOURCE, AUTHOR_CAMPAIGN));
      expect(url.searchParams.get('utm_source')).toBe('youtube');
      expect(url.searchParams.get('utm_medium')).toBe('social');
      expect(url.searchParams.get('utm_campaign')).toBe('author-post');
      expect([...url.searchParams.keys()]).toHaveLength(3);
      // The locale stays in the path, so the language is read from page_path, not from a parameter.
      expect(url.pathname).toBe(new URL(article).pathname);
    }
  });

  // These four are checked by `tsc --noEmit` (the typecheck gate), not by vitest: each directive fails
  // the typecheck the day the line below it starts to compile.
  it('stays out of the reader-share types and cannot carry the reader campaign', () => {
    // @ts-expect-error -- readers cannot share TO YouTube, so it is not a ShareSource.
    const asShare: ShareSource = YOUTUBE_SOURCE;
    // @ts-expect-error -- nor a share_complete target GA could ever receive.
    const asTarget: ShareCompleteTarget = YOUTUBE_SOURCE;
    // @ts-expect-error -- the default campaign is reader-share; an author source must name author-post.
    const defaulted = withShareUtm(ARTICLE, YOUTUBE_SOURCE);
    // @ts-expect-error -- and it may not name the reader campaign explicitly either.
    const asReader = withShareUtm(ARTICLE, YOUTUBE_SOURCE, SHARE_CAMPAIGN);
    expect([asShare, asTarget, defaulted, asReader]).toHaveLength(4);
  });
});

// The LinkedIn and X links are unchanged by #817: same source, medium and campaign as before.
describe('the LinkedIn and X values', () => {
  it.each([
    ['linkedin', 'reader-share'],
    ['x', 'reader-share'],
    ['linkedin', 'author-post'],
    ['x', 'author-post'],
  ] as const)('%s with %s keeps its three values', (source, campaign) => {
    const url = new URL(withShareUtm(ARTICLE, source, campaign));
    expect(url.searchParams.get('utm_source')).toBe(source);
    expect(url.searchParams.get('utm_medium')).toBe('social');
    expect(url.searchParams.get('utm_campaign')).toBe(campaign);
  });
});
