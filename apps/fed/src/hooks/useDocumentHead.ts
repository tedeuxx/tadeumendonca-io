// Per-route document head — title, meta description, canonical, Open Graph, Twitter card + optional
// JSON-LD. Imperative (upserts into document.head via an effect), which is exactly what the build-time
// snapshot prerender captures per route: the crawler reads these tags from the static HTML. On the live
// SPA it also keeps the head correct across client-side navigation.
import { useEffect } from 'react';
import { SITE_NAME, DEFAULT_OG_IMAGE, absoluteUrl } from '../lib/site';

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
