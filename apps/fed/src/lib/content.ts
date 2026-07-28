// Blog content — sourced from markdown-in-repo (build-time). Vite bundles every .md under
// content/blog as a raw string; we parse the YAML frontmatter (js-yaml) + the markdown body here, so
// the SPA renders the blog with NO backend call. This module is the single source of truth for the
// articles section and /blog/:slug (the prerender / OG-image pipeline reads the same slugs).
//
// Every article is authored in BOTH locales — one markdown file per language, `<KEY>.pt.md` /
// `<KEY>.en.md` (the reference implementation is `src/content/rampup.{pt,en}.md`). The filename base is
// the article's stable KEY — the grouping key that pairs the two editions; it is NEVER a URL (by
// convention it is the canonical English slug). The contract is UNPUBLISHABLE-if-incomplete: a KEY that
// lacks either locale throws at module load, which fails the build, the prerender and the test suite. The
// loader makes the single-language case impossible, not merely discouraged.
//
// Identity is the filename KEY, not the slug. Per-locale slugs (ADR-0037) mean the two editions carry
// DIFFERENT slugs — EN `/en/blog/my-commitment`, PT `/pt/blog/meu-compromisso` — so `slug` is authored
// once PER LOCALE (frontmatter) and left OUT of the shared-fact set. This mirrors the CV: prose
// (title/excerpt/takeaway/body) and now the slug are per-locale, while the remaining FACTS (date, tag,
// track, links, media) are authored once and MUST agree across the two editions — a disagreement is a
// mistake, so it throws.
import yaml from 'js-yaml';
import { LOCALES, type Locale } from '../i18n/config';

/** Audience track. `pessoal` = everyday-life automation (no code); `engenharia` = AI in production. */
export type Track = 'pessoal' | 'engenharia';
const TRACKS: Track[] = ['pessoal', 'engenharia'];

export interface BlogPost {
  slug: string;
  title: string;
  /** ISO 8601 — keep it quoted in frontmatter so YAML doesn't coerce it to a Date. */
  date: string;
  tag: string;
  /** Which audience the piece is written for. Unknown or missing → `engenharia`. */
  track: Track;
  excerpt?: string;
  /** Reader-first promise, rendered as "Você sai sabendo …" on the article row. */
  takeaway?: string;
  /** Deep-link to the LinkedIn edition of the same piece (the site hosts the canonical). */
  linkedinUrl?: string;
  /** Marks a post whose body embeds a video, so the row can advertise it. */
  hasVideo?: boolean;
  /** Optional cover image path. */
  cover?: string;
  /** Optional OG image path (defaults handled by the prerender pipeline). */
  ogImage?: string;
  /** Markdown body (rendered by <Markdown>). */
  body: string;
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
// `<slug>.<locale>.md` — the locale segment is validated against LOCALES, the rest is the slug.
const FILENAME = /\/([^/]+)\.([^./]+)\.md$/;

// Facts are authored once and shared: they identify the piece, not its prose, so the two editions
// cannot disagree about them. Prose (title, excerpt, takeaway, body) is deliberately NOT here — and
// neither is `slug`, which is per-locale (ADR-0037): identity is the filename KEY, not the slug.
const FACT_KEYS = ['date', 'tag', 'track', 'linkedinUrl', 'hasVideo', 'cover', 'ogImage'] as const;

const asTrack = (value: unknown): Track => (TRACKS.includes(value as Track) ? (value as Track) : 'engenharia');
const asString = (value: unknown): string | undefined => (value != null ? String(value) : undefined);

function parse(fileSlug: string, raw: string): BlogPost {
  const m = FRONTMATTER.exec(raw);
  const fm: Record<string, unknown> = (m ? (yaml.load(m[1]) as Record<string, unknown> | null) : null) ?? {};
  const body = (m ? m[2] : raw).trim();
  return {
    slug: String(fm.slug ?? fileSlug),
    title: String(fm.title ?? fileSlug),
    date: String(fm.date ?? ''),
    tag: String(fm.tag ?? ''),
    track: asTrack(fm.track),
    excerpt: asString(fm.excerpt),
    takeaway: asString(fm.takeaway),
    linkedinUrl: asString(fm.linkedinUrl),
    hasVideo: fm.hasVideo === true,
    cover: asString(fm.cover),
    ogImage: asString(fm.ogImage),
    body,
  };
}

/** A slug resolved to its two editions, keyed by locale. */
type Editions = Record<Locale, BlogPost>;

// Group the raw glob by slug and enforce the unpublishable contract. Exported so tests can feed it a
// synthetic set (one locale missing, a locale outside LOCALES, disagreeing facts) and assert it throws
// — the real glob below is always a complete, agreeing pair, so the throws never fire in production.
export function buildEditions(raws: Record<string, string>): Record<string, Editions> {
  const grouped = new Map<string, Partial<Record<Locale, BlogPost>>>();

  for (const [path, raw] of Object.entries(raws)) {
    const m = FILENAME.exec(path);
    if (!m) throw new Error(`content: unexpected blog filename "${path}" — expected <slug>.<locale>.md`);
    const [, fileSlug, localePart] = m;
    if (!LOCALES.includes(localePart as Locale)) {
      throw new Error(`content: "${path}" has locale "${localePart}" that is not one of ${LOCALES.join(', ')}`);
    }
    const locale = localePart as Locale;
    const editions = grouped.get(fileSlug) ?? {};
    editions[locale] = parse(fileSlug, raw);
    grouped.set(fileSlug, editions);
  }

  const resolved: Record<string, Editions> = {};
  for (const [fileSlug, editions] of grouped) {
    const missing = LOCALES.filter((l) => !editions[l]);
    if (missing.length > 0) {
      throw new Error(
        `content: blog article "${fileSlug}" is missing the ${missing.join(', ')} edition — ` +
          'every article must be authored in both languages (<slug>.pt.md and <slug>.en.md).',
      );
    }
    // Facts are authored once: assert they agree across the two editions, else it's an error.
    const [first, ...rest] = LOCALES;
    for (const locale of rest) {
      for (const key of FACT_KEYS) {
        if (editions[first]![key] !== editions[locale]![key]) {
          throw new Error(
            `content: blog article "${fileSlug}" disagrees on the fact "${key}" between its ` +
              `${first} (${String(editions[first]![key])}) and ${locale} (${String(editions[locale]![key])}) ` +
              'editions — facts are authored once and must match.',
          );
        }
      }
    }
    resolved[fileSlug] = editions as Editions;
  }
  return resolved;
}

const raws = import.meta.glob('../content/blog/*.{pt,en}.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const editionsBySlug = buildEditions(raws);

// Per-locale, newest first (ISO date strings sort lexicographically).
const byLocale: Record<Locale, BlogPost[]> = { pt: [], en: [] };
for (const editions of Object.values(editionsBySlug)) {
  for (const locale of LOCALES) byLocale[locale].push(editions[locale]);
}
for (const locale of LOCALES) {
  byLocale[locale].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function getAllPosts(locale: Locale, filter?: { tag?: string; track?: Track }): BlogPost[] {
  const { tag, track } = filter ?? {};
  return byLocale[locale].filter((p) => (tag ? p.tag === tag : true) && (track ? p.track === track : true));
}

export function getPostBySlug(slug: string, locale: Locale): BlogPost | undefined {
  return byLocale[locale].find((p) => p.slug === slug);
}

/**
 * The two editions of the article whose `locale` edition carries `slug`. Since slugs are per-locale
 * (ADR-0037), the lookup is unambiguous: it matches on the given locale's OWN slug, then returns the
 * whole group so callers can read the sibling locale's slug (for hreflang, the toggle, the sitemap).
 */
export function getEditions(slug: string, locale: Locale): Editions | undefined {
  return Object.values(editionsBySlug).find((eds) => eds[locale].slug === slug);
}

/** The `to`-locale slug of the article whose `from`-locale slug is `slug`, or undefined if unknown. */
export function alternateSlug(slug: string, from: Locale, to: Locale): string | undefined {
  return getEditions(slug, from)?.[to].slug;
}

/**
 * Map an article logical path across locales: `/blog/<fromSlug>` → `/blog/<toSlug>`. Any non-article
 * path (or an unknown slug) passes through unchanged, so this is safe to call on every path a locale
 * switch touches — only real article routes are rewritten.
 */
export function localizeArticlePath(logicalPath: string, from: Locale, to: Locale): string {
  const m = /^\/blog\/([^/]+)$/.exec(logicalPath);
  if (!m) return logicalPath;
  const alt = alternateSlug(m[1], from, to);
  return alt ? `/blog/${alt}` : logicalPath;
}

/**
 * Map an article path to `to`'s slug WITHOUT knowing which locale the incoming slug belongs to (#204).
 *
 * The locale toggle always knows its `from` (it is on a prefixed route), so `localizeArticlePath` fits
 * there. The unprefixed redirect does not: `/blog/<slug>` carries no prefix, and the slug may belong to
 * either edition. Re-prefixing it blindly is what dead-ended a pt-BR reader on `/pt/blog/<en-slug>` — a
 * route that does not exist — dropping them on the blog listing instead of the article.
 *
 * Tries each locale as the source and returns the first match, so it resolves an EN slug for a pt reader
 * and a PT slug for an en reader alike. An unknown slug passes through unchanged, keeping the in-locale
 * not-found behaviour intact.
 */
export function articlePathForLocale(logicalPath: string, to: Locale): string {
  const m = /^\/blog\/([^/]+)$/.exec(logicalPath);
  if (!m) return logicalPath;
  for (const from of LOCALES) {
    const alt = alternateSlug(m[1], from, to);
    if (alt) return `/blog/${alt}`;
  }
  return logicalPath;
}
