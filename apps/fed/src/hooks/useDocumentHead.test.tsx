import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDocumentHead } from './useDocumentHead';

const metaContent = (sel: string) => document.head.querySelector<HTMLMetaElement>(sel)?.getAttribute('content');

beforeEach(() => {
  document.head.innerHTML = '';
  document.title = '';
});

describe('useDocumentHead', () => {
  it('sets title (site suffix), description, canonical, OG + Twitter tags', () => {
    renderHook(() => useDocumentHead({ title: 'Blog', description: 'desc', canonicalPath: '/blog' }));
    expect(document.title).toBe('Blog · tadeumendonca.io');
    expect(metaContent('meta[name="description"]')).toBe('desc');
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://tadeumendonca.io/blog');
    expect(metaContent('meta[property="og:title"]')).toBe('Blog · tadeumendonca.io');
    expect(metaContent('meta[property="og:url"]')).toBe('https://tadeumendonca.io/blog');
    expect(metaContent('meta[property="og:type"]')).toBe('website');
    expect(metaContent('meta[property="og:image"]')).toBe('https://tadeumendonca.io/og-default.png');
    expect(metaContent('meta[name="twitter:card"]')).toBe('summary_large_image');
  });

  it('sets article-specific tags + JSON-LD', () => {
    renderHook(() =>
      useDocumentHead({ title: 'Post', type: 'article', publishedTime: '2026-01-01', image: '/og/x.png', jsonLd: { '@type': 'Article' } }),
    );
    expect(metaContent('meta[property="og:type"]')).toBe('article');
    expect(metaContent('meta[property="article:published_time"]')).toBe('2026-01-01');
    expect(metaContent('meta[property="og:image"]')).toBe('https://tadeumendonca.io/og/x.png');
    expect(document.head.querySelector('script[type="application/ld+json"][data-head]')?.textContent).toContain('Article');
  });

  // Declaring the card's size is what makes WhatsApp/LinkedIn render the wide banner instead of
  // guessing and falling back to a cropped square.
  it('declares the default card dimensions so unfurlers render it large', () => {
    renderHook(() => useDocumentHead({ title: 'Home' }));
    expect(metaContent('meta[property="og:image:width"]')).toBe('1200');
    expect(metaContent('meta[property="og:image:height"]')).toBe('630');
    expect(metaContent('meta[property="og:image:type"]')).toBe('image/png');
    expect(metaContent('meta[property="og:image:alt"]')).toBeTruthy();
  });

  it('drops the dimensions for a custom image rather than lying about its size', () => {
    // Start on a route using the default card, then navigate to one with its own image: the tags
    // must not survive, because upsertMeta alone would leave them describing the previous page.
    const { rerender } = renderHook((props: { image?: string } = {}) => useDocumentHead({ title: 'Home', ...props }));
    expect(metaContent('meta[property="og:image:width"]')).toBe('1200');

    rerender({ image: '/og/custom.png' });
    expect(metaContent('meta[property="og:image"]')).toBe('https://tadeumendonca.io/og/custom.png');
    expect(document.head.querySelector('meta[property="og:image:width"]')).toBeNull();
    expect(document.head.querySelector('meta[property="og:image:height"]')).toBeNull();
  });

  it('does not double-append the site name when already present', () => {
    renderHook(() => useDocumentHead({ title: 'tadeumendonca.io' }));
    expect(document.title).toBe('tadeumendonca.io');
  });
});
