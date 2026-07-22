// Blog content — sourced from markdown-in-repo (build-time). Vite bundles every .md under
// content/blog as a raw string; we parse the YAML frontmatter (js-yaml) + the markdown body here, so
// the SPA renders the blog with NO backend call. This module is the single source of truth for the
// articles section and /blog/:slug (the prerender / OG-image pipeline reads the same slugs).
import yaml from 'js-yaml';

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

const asTrack = (value: unknown): Track => (TRACKS.includes(value as Track) ? (value as Track) : 'engenharia');
const asString = (value: unknown): string | undefined => (value != null ? String(value) : undefined);

function parse(path: string, raw: string): BlogPost {
  const m = FRONTMATTER.exec(raw);
  const fm: Record<string, unknown> = (m ? (yaml.load(m[1]) as Record<string, unknown> | null) : null) ?? {};
  const body = (m ? m[2] : raw).trim();
  const fileSlug = path.split('/').pop()!.replace(/\.md$/, '');
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

const raws = import.meta.glob('../content/blog/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Newest first (ISO date strings sort lexicographically).
const posts: BlogPost[] = Object.entries(raws)
  .map(([path, raw]) => parse(path, raw))
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

export function getAllPosts(filter?: { tag?: string; track?: Track }): BlogPost[] {
  const { tag, track } = filter ?? {};
  return posts.filter((p) => (tag ? p.tag === tag : true) && (track ? p.track === track : true));
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}
