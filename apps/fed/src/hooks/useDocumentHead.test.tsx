import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { useDocumentHead } from './useDocumentHead';
import { LocaleProvider, localePath, type Locale } from '../i18n';

const metaContent = (sel: string) => document.head.querySelector<HTMLMetaElement>(sel)?.getAttribute('content');
const alternateHref = (hreflang: string) =>
  document.head.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${hreflang}"]`)?.getAttribute('href');

// Render the hook under a router seeded at the locale prefix, so the provider reads that locale off the path.
const wrapperAt = (locale: Locale) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[localePath(locale, '/')]}>
        <LocaleProvider>{children}</LocaleProvider>
      </MemoryRouter>
    );
  };

beforeEach(() => {
  document.head.innerHTML = '';
  document.title = '';
});

describe('useDocumentHead', () => {
  it('sets title (site suffix), description, canonical, OG + Twitter tags', () => {
    renderHook(() => useDocumentHead({ title: 'Blog', description: 'desc', canonicalPath: '/blog' }), {
      wrapper: wrapperAt('en'),
    });
    expect(document.title).toBe('Blog · tadeumendonca.io');
    expect(metaContent('meta[name="description"]')).toBe('desc');
    // Self-canonical is locale-prefixed (ADR-0036), never the bare logical path.
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://tadeumendonca.io/en/blog',
    );
    expect(metaContent('meta[property="og:title"]')).toBe('Blog · tadeumendonca.io');
    expect(metaContent('meta[property="og:url"]')).toBe('https://tadeumendonca.io/en/blog');
    expect(metaContent('meta[property="og:type"]')).toBe('website');
    expect(metaContent('meta[property="og:image"]')).toBe('https://tadeumendonca.io/og-default.png');
    expect(metaContent('meta[name="twitter:card"]')).toBe('summary_large_image');
  });

  // Per-locale OG (ADR-0036): og:locale reflects the active locale, and the canonical is that locale's URL.
  it('emits a self-canonical + og:locale for the active locale (pt)', () => {
    renderHook(() => useDocumentHead({ title: 'Perfil', canonicalPath: '/me' }), { wrapper: wrapperAt('pt') });
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://tadeumendonca.io/pt/me',
    );
    expect(metaContent('meta[property="og:locale"]')).toBe('pt_BR');
    expect(metaContent('meta[property="og:url"]')).toBe('https://tadeumendonca.io/pt/me');
  });

  it('emits og:locale en_US under the en prefix', () => {
    renderHook(() => useDocumentHead({ title: 'Profile', canonicalPath: '/me' }), { wrapper: wrapperAt('en') });
    expect(metaContent('meta[property="og:locale"]')).toBe('en_US');
  });

  // hreflang reciprocity + x-default: both editions advertise the SAME alternate set — pt, en, and
  // x-default → the bare unprefixed English URL — so a crawler can pair them; the canonical stays self.
  it('emits reciprocal pt/en/x-default hreflang alternates, identical across editions', () => {
    const expected = {
      pt: 'https://tadeumendonca.io/pt/me',
      en: 'https://tadeumendonca.io/en/me',
      xDefault: 'https://tadeumendonca.io/me',
    };
    renderHook(() => useDocumentHead({ title: 'Perfil', canonicalPath: '/me' }), { wrapper: wrapperAt('pt') });
    expect(alternateHref('pt')).toBe(expected.pt);
    expect(alternateHref('en')).toBe(expected.en);
    expect(alternateHref('x-default')).toBe(expected.xDefault);

    document.head.innerHTML = '';
    renderHook(() => useDocumentHead({ title: 'Profile', canonicalPath: '/me' }), { wrapper: wrapperAt('en') });
    expect(alternateHref('pt')).toBe(expected.pt);
    expect(alternateHref('en')).toBe(expected.en);
    expect(alternateHref('x-default')).toBe(expected.xDefault);
  });

  it('maps the x-default alternate of the landing to the bare origin', () => {
    renderHook(() => useDocumentHead({ title: 'tadeumendonca.io', canonicalPath: '/' }), { wrapper: wrapperAt('en') });
    expect(alternateHref('x-default')).toBe('https://tadeumendonca.io/');
    expect(alternateHref('pt')).toBe('https://tadeumendonca.io/pt');
    expect(alternateHref('en')).toBe('https://tadeumendonca.io/en');
  });

  it('sets article-specific tags + JSON-LD', () => {
    renderHook(
      () =>
        useDocumentHead({
          title: 'Post',
          type: 'article',
          publishedTime: '2026-01-01',
          image: '/og/x.png',
          canonicalPath: '/blog/x',
          jsonLd: { '@type': 'Article' },
        }),
      { wrapper: wrapperAt('en') },
    );
    expect(metaContent('meta[property="og:type"]')).toBe('article');
    expect(metaContent('meta[property="article:published_time"]')).toBe('2026-01-01');
    expect(metaContent('meta[property="og:image"]')).toBe('https://tadeumendonca.io/og/x.png');
    expect(document.head.querySelector('script[type="application/ld+json"][data-head]')?.textContent).toContain(
      'Article',
    );
  });

  // Declaring the card's size is what makes WhatsApp/LinkedIn render the wide banner instead of
  // guessing and falling back to a cropped square.
  it('declares the default card dimensions so unfurlers render it large', () => {
    renderHook(() => useDocumentHead({ title: 'Home', canonicalPath: '/' }), { wrapper: wrapperAt('en') });
    expect(metaContent('meta[property="og:image:width"]')).toBe('1200');
    expect(metaContent('meta[property="og:image:height"]')).toBe('630');
    expect(metaContent('meta[property="og:image:type"]')).toBe('image/png');
    expect(metaContent('meta[property="og:image:alt"]')).toBeTruthy();
  });

  it('drops the dimensions for a custom image rather than lying about its size', () => {
    // Start on a route using the default card, then navigate to one with its own image: the tags
    // must not survive, because upsertMeta alone would leave them describing the previous page.
    const { rerender } = renderHook(
      (props: { image?: string } = {}) => useDocumentHead({ title: 'Home', canonicalPath: '/', ...props }),
      { wrapper: wrapperAt('en') },
    );
    expect(metaContent('meta[property="og:image:width"]')).toBe('1200');

    rerender({ image: '/og/custom.png' });
    expect(metaContent('meta[property="og:image"]')).toBe('https://tadeumendonca.io/og/custom.png');
    expect(document.head.querySelector('meta[property="og:image:width"]')).toBeNull();
    expect(document.head.querySelector('meta[property="og:image:height"]')).toBeNull();
  });

  it('does not double-append the site name when already present', () => {
    renderHook(() => useDocumentHead({ title: 'tadeumendonca.io', canonicalPath: '/' }), { wrapper: wrapperAt('en') });
    expect(document.title).toBe('tadeumendonca.io');
  });
});
