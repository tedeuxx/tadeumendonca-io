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

  it('does not double-append the site name when already present', () => {
    renderHook(() => useDocumentHead({ title: 'tadeumendonca.io' }));
    expect(document.title).toBe('tadeumendonca.io');
  });
});
