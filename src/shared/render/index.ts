// Bot HTML rendering (/backend/prerender) — content templating, NOT SSR (no React on the server).
// Markdown deps isolated here. The OG PNG itself comes from /backend/og-image-generator; we only
// reference its URL. Public base URL = the SPA origin (config.spaOrigin).
import MarkdownIt from 'markdown-it';
import { config } from '../config';
import type { Profile, Post } from '../types/entities';

const md = new MarkdownIt({ html: false, linkify: true });

const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

interface MetaInput {
  title: string;
  description: string;
  image_url: string;
  url: string;
}

export function htmlDoc(input: MetaInput & { jsonLd: object; body: string; ogType?: string }): string {
  const { title, description, url, image_url, jsonLd, body, ogType = 'website' } = input;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="${ogType}" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${image_url}" />
<meta name="twitter:card" content="summary_large_image" />
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
${body}
</body>
</html>
`;
}

// --- profile (CV) ---
export function profileMeta(profile: Profile): MetaInput {
  return {
    title: `${profile.name} — ${profile.headline}`,
    description: profile.summary ?? profile.headline,
    image_url: `${config.apiOrigin}/og/profile/me.png`,
    url: `${config.spaOrigin}/`,
  };
}

export function personJsonLd(profile: Profile): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.headline,
    description: profile.summary,
    sameAs: Object.values(profile.metadata),
  };
}

export function profileHtml(profile: Profile): string {
  const meta = profileMeta(profile);
  const experience = profile.experience
    .map((e) => `<li><strong>${escapeHtml(e.title)} · ${escapeHtml(e.company)}</strong>${e.description ? ` — ${escapeHtml(e.description)}` : ''}</li>`)
    .join('');
  const skills = Object.entries(profile.skills)
    .map(([cat, list]) => `<li>${escapeHtml(cat)}: ${list.map(escapeHtml).join(', ')}</li>`)
    .join('');
  const body = `<article>
<h1>${escapeHtml(profile.name)}</h1>
<p>${escapeHtml(profile.headline)}</p>
${profile.summary ? `<p>${escapeHtml(profile.summary)}</p>` : ''}
${experience ? `<h2>Experience</h2><ul>${experience}</ul>` : ''}
${skills ? `<h2>Skills</h2><ul>${skills}</ul>` : ''}
</article>`;
  return htmlDoc({ ...meta, jsonLd: personJsonLd(profile), body });
}

// --- posts (feed) ---
const plainSnippet = (markdown: string, max = 160): string => {
  const text = markdown.replace(/[#*_`>[\]()~]/g, '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

export function postMeta(post: Post): MetaInput {
  return {
    title: post.title,
    description: plainSnippet(post.body),
    image_url: `${config.apiOrigin}/og/posts/${post.post_id}.png`,
    url: `${config.spaOrigin}/posts/${post.post_id}`,
  };
}

export function postJsonLd(post: Post): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: post.created_at,
    dateModified: post.updated_at ?? post.created_at,
    keywords: post.tags?.join(', '),
    url: `${config.spaOrigin}/posts/${post.post_id}`,
  };
}

export function postHtml(post: Post): string {
  const meta = postMeta(post);
  const tags = post.tags?.length ? `<p>${post.tags.map((t) => `#${escapeHtml(t)}`).join(' ')}</p>` : '';
  const body = `<article>
<h1>${escapeHtml(post.title)}</h1>
<time datetime="${post.created_at}">${escapeHtml(post.created_at.slice(0, 10))}</time>
${tags}
${md.render(post.body)}
</article>`;
  return htmlDoc({ ...meta, ogType: 'article', jsonLd: postJsonLd(post), body });
}

// markdown→HTML helper for article bodies (Phase 3) — kept here so the dep stays isolated.
export const renderMarkdown = (markdown: string): string => md.render(markdown);
