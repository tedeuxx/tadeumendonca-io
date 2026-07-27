// Per-route document head — title, meta description, canonical, Open Graph, Twitter card + optional
// JSON-LD. Imperative (upserts into document.head via an effect), which is exactly what the build-time
// snapshot prerender captures per route: the crawler reads these tags from the static HTML. On the live
// SPA it also keeps the head correct across client-side navigation.
import { useEffect } from 'react';
import {
  SITE_NAME,
  DEFAULT_OG_IMAGE,
  OG_IMAGE_WIDTH,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_TYPE,
  OG_IMAGE_ALT,
  absoluteUrl,
} from '../lib/site';
import { localePath, ogLocale, useLocale, type Locale } from '../i18n';

// The hreflang alternates a locale-prefixed logical path exposes: the pt + en editions plus x-default.
// Both editions of a page advertise the SAME set, so a crawler sees reciprocal alternates and a self
// canonical, never a cross-locale one.
//
// INVARIANT (#200): x-default must point at a URL the build actually PRERENDERS. This previously pointed
// at the bare, unprefixed URL for every route, on the reasoning that the client-side redirect resolves it
// per visitor. But only the locale-prefixed routes plus the bare ROOT are snapshotted, and CloudFront maps
// 404 → /index.html with response code 200 — so five of the six advertised x-defaults answered 200
// carrying the HOME page's OG card, which a scraper pins permanently (ADR-0005).
//
// Kept BYTE-IDENTICAL in behaviour to scripts/routes.mjs's alternatesFor: this hook emits the runtime
// <link> tags while that module feeds the sitemap and prerender, so if the two disagree the served HTML
// and the sitemap advertise different things. (The duplication itself is tracked separately.)
function alternatesFor(logicalPath: string): Record<'pt' | 'en' | 'x-default', string> {
  const en = absoluteUrl(localePath('en', logicalPath));
  return {
    pt: absoluteUrl(localePath('pt', logicalPath)),
    en,
    // The bare origin is the ONE unprefixed URL the prerender snapshots.
    'x-default': logicalPath === '/' ? absoluteUrl('/') : en,
  };
}

export interface DocumentHead {
  /** Page title; the site name is appended unless it's already present. */
  title: string;
  description?: string;
  /** Canonical path or absolute URL (e.g. '/blog/slug'). */
  canonicalPath?: string;
  /** OG image path or absolute URL; falls back to the site default. */
  image?: string;
  type?: 'website' | 'article';
  /** ISO date for article:published_time (articles only). */
  publishedTime?: string;
  /** JSON-LD structured data. */
  jsonLd?: Record<string, unknown>;
  /**
   * Per-locale LOGICAL paths for hreflang, when a route's path DIFFERS across locales (article slugs are
   * per-locale, ADR-0037 — EN `/blog/my-commitment`, PT `/blog/meu-compromisso`). When given, the pt/en
   * alternates prefix these localized paths and x-default is the bare English slug. When absent (the
   * shared-slug routes), the alternates re-prefix `canonicalPath` for both locales, as before.
   */
  alternates?: Record<Locale, string>;
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** Drop a meta tag entirely. Needed because upsertMeta only ever writes: on client-side navigation a
 *  tag that no longer applies would otherwise linger and describe the previous page. */
function removeMeta(attr: 'name' | 'property', key: string) {
  document.head.querySelector(`meta[${attr}="${key}"]`)?.remove();
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

// Upsert a <link rel="alternate" hreflang="…">. Keyed by hreflang (not just rel) so the pt/en/x-default
// trio coexist; the set is stable across navigation, so only the href is ever rewritten.
function upsertAlternate(hreflang: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${hreflang}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'alternate');
    el.setAttribute('hreflang', hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setJsonLd(json: string | undefined) {
  const existing = document.head.querySelector<HTMLScriptElement>('script[type="application/ld+json"][data-head]');
  if (!json) {
    existing?.remove();
    return;
  }
  const el = existing ?? document.createElement('script');
  el.type = 'application/ld+json';
  el.setAttribute('data-head', '');
  el.textContent = json;
  if (!existing) document.head.appendChild(el);
}

export function useDocumentHead({ title, description, canonicalPath, image, type = 'website', publishedTime, jsonLd, alternates }: DocumentHead) {
  const { locale } = useLocale();
  // Serialize JSON-LD so the effect depends on its value, not object identity.
  const jsonLdStr = jsonLd ? JSON.stringify(jsonLd) : undefined;
  // Depend on the primitive localized paths (not the object identity) so a fresh `alternates` each render
  // doesn't re-run the effect needlessly.
  const altPt = alternates?.pt;
  const altEn = alternates?.en;

  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} · ${SITE_NAME}`;
    // Per-locale URLs (ADR-0036): the canonical is SELF — the current locale's prefixed URL — never
    // cross-locale. The reciprocal editions are advertised via hreflang alternates below.
    const url = canonicalPath ? absoluteUrl(localePath(locale, canonicalPath)) : undefined;
    const img = image ? absoluteUrl(image) : DEFAULT_OG_IMAGE;

    document.title = fullTitle;
    if (description) upsertMeta('name', 'description', description);
    if (url) upsertLink('canonical', url);

    // hreflang alternates (pt · en · x-default). Emitted for every real route so both editions point at
    // the same set — the reciprocity a crawler needs to pair them. When the route's path is per-locale
    // (article slugs, ADR-0037), `alternates` carries the two localized logical paths; otherwise the
    // shared `canonicalPath` re-prefixes for both. x-default is the PREFIXED English URL in both branches
    // (#200): the bare `/blog/<en-slug>` is never prerendered, and — because unprefixed paths redirect
    // preserving the path while slugs are per-locale — it also dead-ends a pt-BR reader on
    // `/pt/blog/<en-slug>`, a route that does not exist.
    if (canonicalPath) {
      const alt =
        altPt !== undefined && altEn !== undefined
          ? {
              pt: absoluteUrl(localePath('pt', altPt)),
              en: absoluteUrl(localePath('en', altEn)),
              'x-default': absoluteUrl(localePath('en', altEn)),
            }
          : alternatesFor(canonicalPath);
      upsertAlternate('pt', alt.pt);
      upsertAlternate('en', alt.en);
      upsertAlternate('x-default', alt['x-default']);
    }

    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:locale', ogLocale(locale));
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:image', img);
    // Declaring the size is what makes WhatsApp/LinkedIn render the WIDE card. Without it they fetch
    // first and guess, and the fallback guess is the small square thumbnail. Only emitted for the
    // default card, whose dimensions we actually know — a per-article image could be any size, and
    // claiming 1200×630 for it would be worse than staying silent.
    if (img === DEFAULT_OG_IMAGE) {
      upsertMeta('property', 'og:image:width', OG_IMAGE_WIDTH);
      upsertMeta('property', 'og:image:height', OG_IMAGE_HEIGHT);
      upsertMeta('property', 'og:image:type', OG_IMAGE_TYPE);
      upsertMeta('property', 'og:image:alt', OG_IMAGE_ALT);
    } else {
      // A custom image is a different, unknown size — carrying the default's dimensions over from a
      // previous route would actively lie about it.
      removeMeta('property', 'og:image:width');
      removeMeta('property', 'og:image:height');
      removeMeta('property', 'og:image:type');
      removeMeta('property', 'og:image:alt');
    }
    if (description) upsertMeta('property', 'og:description', description);
    if (url) upsertMeta('property', 'og:url', url);
    if (publishedTime) upsertMeta('property', 'article:published_time', publishedTime);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:image', img);
    if (description) upsertMeta('name', 'twitter:description', description);

    setJsonLd(jsonLdStr);
  }, [locale, title, description, canonicalPath, image, type, publishedTime, jsonLdStr, altPt, altEn]);
}
