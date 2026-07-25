// Blog content — sourced from markdown-in-repo (build-time). Vite bundles every .md under
// content/blog as a raw string; we parse the YAML frontmatter (js-yaml) + the markdown body here, so
// the SPA renders the blog with NO backend call. This module is the single source of truth for the
// articles section and /blog/:slug (the prerender / OG-image pipeline reads the same slugs).
//
// Every article is authored in BOTH locales — one markdown file per language, `<slug>.pt.md` /
// `<slug>.en.md` (the reference implementation is `src/content/rampup.{pt,en}.md`). The contract is
// UNPUBLISHABLE-if-incomplete: a slug that lacks either locale throws at module load, which fails the
// build, the prerender and the test suite. The loader makes the single-language case impossible, not
// merely discouraged. This mirrors the CV: prose (title/excerpt/takeaway/body) is per-locale, but
// FACTS (slug, date, tag, track, links, media) are authored once and MUST agree across the two
// editions — a disagreement is a mistake, so it also throws.
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
// cannot disagree about them. Prose (title, excerpt, takeaway, body) is deliberately NOT here.
const FACT_KEYS = ['slug', 'date', 'tag', 'track', 'linkedinUrl', 'hasVideo', 'cover', 'ogImage'] as const;

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
