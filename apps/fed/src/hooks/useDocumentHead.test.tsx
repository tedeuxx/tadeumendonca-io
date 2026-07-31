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

  // #167: #162 gave a shared /pt/* link Portuguese og:title and og:description over an ENGLISH image,
  // so the card's own words disagreed with the text beside it. Asserted as the exact URL: `toContain`
  // on a substring like 'og-default' cannot fail here, because the English card contains it too.
  it('serves the reader’s own language in the card, not just in the text beside it', () => {
    renderHook(() => useDocumentHead({ title: 'Perfil', canonicalPath: '/me' }), { wrapper: wrapperAt('pt') });
    expect(metaContent('meta[property="og:image"]')).toBe('https://tadeumendonca.io/og-default.pt.png');
    expect(metaContent('meta[property="og:image:alt"]')).toBe(
      'tadeumendonca.io — aprenda a construir com IA, do dia a dia à produção',
    );
  });

  it('keeps the unsuffixed card for en — the suffix is additive, not a rename of a pinned URL', () => {
    renderHook(() => useDocumentHead({ title: 'Profile', canonicalPath: '/me' }), { wrapper: wrapperAt('en') });
    expect(metaContent('meta[property="og:image"]')).toBe('https://tadeumendonca.io/og-default.png');
  });

  it('emits og:locale en_US under the en prefix', () => {
    renderHook(() => useDocumentHead({ title: 'Profile', canonicalPath: '/me' }), { wrapper: wrapperAt('en') });
    expect(metaContent('meta[property="og:locale"]')).toBe('en_US');
  });

  // hreflang reciprocity + x-default: both editions advertise the SAME alternate set, so a crawler can
  // pair them; the canonical stays self. x-default is the PREFIXED English URL (#200) — the bare `/me` is
  // never prerendered, and CloudFront answers it 200 with the home page's OG card.
  it('emits reciprocal pt/en/x-default hreflang alternates, identical across editions', () => {
    const expected = {
      pt: 'https://tadeumendonca.io/pt/me',
      en: 'https://tadeumendonca.io/en/me',
      xDefault: 'https://tadeumendonca.io/en/me',
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

  // Per-locale slugs (ADR-0037): when `alternates` carries the two localized logical paths, the hreflang
  // set advertises each locale's OWN slug (not the shared canonicalPath re-prefixed). This is what pairs
  // `/en/blog/my-commitment` with `/pt/blog/meu-compromisso` for a crawler. x-default is the PREFIXED
  // English article URL (#200): the bare `/blog/<en-slug>` is not prerendered AND, because unprefixed
  // paths redirect preserving the path while slugs are per-locale, it dead-ends a pt-BR reader on
  // `/pt/blog/<en-slug>` — a route that does not exist.
  it('emits per-locale hreflang from `alternates` when a route’s slug differs across locales', () => {
    const alternates = { en: '/blog/my-commitment', pt: '/blog/meu-compromisso' };
    // The EN edition (self-canonical is /en/blog/my-commitment) still advertises the reciprocal pair.
    renderHook(
      () => useDocumentHead({ title: 'My Commitment', canonicalPath: '/blog/my-commitment', alternates }),
      { wrapper: wrapperAt('en') },
    );
    expect(alternateHref('en')).toBe('https://tadeumendonca.io/en/blog/my-commitment');
    expect(alternateHref('pt')).toBe('https://tadeumendonca.io/pt/blog/meu-compromisso');
    expect(alternateHref('x-default')).toBe('https://tadeumendonca.io/en/blog/my-commitment');
    // Self-canonical stays this locale's own slug.
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://tadeumendonca.io/en/blog/my-commitment',
    );

    // The PT edition (self-canonical is /pt/blog/meu-compromisso) advertises the SAME reciprocal set.
    document.head.innerHTML = '';
    renderHook(
      () => useDocumentHead({ title: 'Meu Compromisso', canonicalPath: '/blog/meu-compromisso', alternates }),
      { wrapper: wrapperAt('pt') },
    );
    expect(alternateHref('en')).toBe('https://tadeumendonca.io/en/blog/my-commitment');
    expect(alternateHref('pt')).toBe('https://tadeumendonca.io/pt/blog/meu-compromisso');
    expect(alternateHref('x-default')).toBe('https://tadeumendonca.io/en/blog/my-commitment');
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://tadeumendonca.io/pt/blog/meu-compromisso',
    );
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
    expect(metaContent('meta[property="og:image:alt"]')).toBe(
      'tadeumendonca.io — learn to build with AI, from everyday life to production',
    );
  });

  // THE ASSERTION THAT FAILS ON THE COMMIT BEFORE THIS ONE (#167). The gate used to be "is this the
  // default card"; #269 gave every article a card of its own, all of them rendered at the same
  // 1200×630, and the stale condition stripped the whole block from every one of them. The article
  // card became distinctive and, on the two surfaces the site actually distributes through, started
  // unfurling as the small square thumbnail — distinct at a size where distinctness cannot be seen.
  //
  // Fed the path `content.ts` derives rather than a hand-written literal, so the test follows the
  // shape the app really produces if that derivation ever changes.
  it('declares the dimensions for a per-article card too — it is the same 1200×630 the build renders', () => {
    const derivedCardPath = `/og/${'my-commitment'}.${'en'}.png`;
    renderHook(
      () =>
        useDocumentHead({
          title: 'My commitment',
          canonicalPath: '/blog/my-commitment',
          image: derivedCardPath,
          imageAlt: 'My commitment',
          type: 'article',
        }),
      { wrapper: wrapperAt('en') },
    );
    expect(metaContent('meta[property="og:image"]')).toBe(`https://tadeumendonca.io${derivedCardPath}`);
    expect(metaContent('meta[property="og:image:width"]')).toBe('1200');
    expect(metaContent('meta[property="og:image:height"]')).toBe('630');
    expect(metaContent('meta[property="og:image:type"]')).toBe('image/png');
  });

  // The alt is the half that must NOT be shared. Reusing the default card's alt over an article's
  // title card tells a screen-reader user they are looking at a picture they are not looking at —
  // and they are the one reader who cannot notice the substitution.
  it('describes the article card by its own title, never by the default card’s alt', () => {
    renderHook(
      () =>
        useDocumentHead({
          title: 'Meu compromisso',
          canonicalPath: '/blog/meu-compromisso',
          image: '/og/my-commitment.pt.png',
          imageAlt: 'Meu compromisso',
          type: 'article',
        }),
      { wrapper: wrapperAt('pt') },
    );
    expect(metaContent('meta[property="og:image:alt"]')).toBe('Meu compromisso');
    expect(metaContent('meta[property="og:image:alt"]')).not.toContain('aprenda a construir');
  });

  it('drops the dimensions for an image the build did not generate, rather than lying about its size', () => {
    // Start on a route using the default card, then navigate to one carrying an image from OUTSIDE the
    // build: the tags must not survive, because upsertMeta alone would leave them describing the
    // previous page. `/og/…` is deliberately NOT used here any more — it is a generated path now, and
    // this test asserted the opposite for a year on the strength of the path alone.
    const { rerender } = renderHook(
      (props: { image?: string } = {}) => useDocumentHead({ title: 'Home', canonicalPath: '/', ...props }),
      { wrapper: wrapperAt('en') },
    );
    expect(metaContent('meta[property="og:image:width"]')).toBe('1200');

    rerender({ image: 'https://images.example.com/someone-elses.png' });
    expect(metaContent('meta[property="og:image"]')).toBe('https://images.example.com/someone-elses.png');
    expect(document.head.querySelector('meta[property="og:image:width"]')).toBeNull();
    expect(document.head.querySelector('meta[property="og:image:height"]')).toBeNull();
    expect(document.head.querySelector('meta[property="og:image:alt"]')).toBeNull();
  });

  it('does not double-append the site name when already present', () => {
    renderHook(() => useDocumentHead({ title: 'tadeumendonca.io', canonicalPath: '/' }), { wrapper: wrapperAt('en') });
    expect(document.title).toBe('tadeumendonca.io');
  });
});
