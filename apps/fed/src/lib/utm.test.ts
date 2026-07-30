import { describe, it, expect } from 'vitest';
import { withShareUtm, SHARE_MEDIUM, SHARE_CAMPAIGN, OWNER_CAMPAIGN } from './utm';

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
    expect(OWNER_CAMPAIGN).toBe('owner-post');
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
    const url = new URL(withShareUtm(ARTICLE, 'linkedin', OWNER_CAMPAIGN));
    expect(url.searchParams.get('utm_campaign')).toBe('owner-post');
  });

  it('is idempotent — tagging twice does not duplicate a parameter', () => {
    const once = withShareUtm(ARTICLE, 'x');
    const twice = withShareUtm(once, 'x');
    expect(twice).toBe(once);
  });
});
