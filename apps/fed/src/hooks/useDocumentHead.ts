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

export function useDocumentHead({ title, description, canonicalPath, image, type = 'website', publishedTime, jsonLd }: DocumentHead) {
  // Serialize JSON-LD so the effect depends on its value, not object identity.
  const jsonLdStr = jsonLd ? JSON.stringify(jsonLd) : undefined;

  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} · ${SITE_NAME}`;
    const url = canonicalPath ? absoluteUrl(canonicalPath) : undefined;
    const img = image ? absoluteUrl(image) : DEFAULT_OG_IMAGE;

    document.title = fullTitle;
    if (description) upsertMeta('name', 'description', description);
    if (url) upsertLink('canonical', url);

    upsertMeta('property', 'og:site_name', SITE_NAME);
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
  }, [title, description, canonicalPath, image, type, publishedTime, jsonLdStr]);
}
