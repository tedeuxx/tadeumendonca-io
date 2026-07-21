// Blog content — sourced from markdown-in-repo (build-time). Vite bundles every .md under
// content/blog as a raw string; we parse the YAML frontmatter (js-yaml) + the markdown body here, so
// the SPA renders the blog with NO backend call. This module is the single source of truth for /blog.
// (The existing edge prerender / OG-image pipeline still covers these slugs; Slice 2 points it here too.)
import yaml from 'js-yaml';

export interface BlogPost {
  slug: string;
  title: string;
  /** ISO 8601 — keep it quoted in frontmatter so YAML doesn't coerce it to a Date. */
  date: string;
  tag: string;
  excerpt?: string;
  /** Optional OG image path (defaults handled by the prerender pipeline). */
  ogImage?: string;
  /** Markdown body (rendered by <Markdown>). */
  body: string;
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

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
    excerpt: fm.excerpt != null ? String(fm.excerpt) : undefined,
    ogImage: fm.ogImage != null ? String(fm.ogImage) : undefined,
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

export function getAllPosts(tag?: string): BlogPost[] {
  return tag ? posts.filter((p) => p.tag === tag) : posts;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}
