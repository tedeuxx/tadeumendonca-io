import { describe, it, expect } from 'vitest';
import { renderMarkdown, profileMeta, personJsonLd, postMeta, postHtml, postJsonLd, articleHtml, articleMeta } from '../index';
import type { Profile, Post, Article } from '../../types/entities';

const baseArticle: Article = {
  article_id: 'a1',
  slug: 'my-slug',
  tag: 'aws',
  title: 'Title <x>',
  body: '',
  published: true,
  created_at: '2026-06-01T12:00:00.000Z',
};

const profile: Profile = {
  profile_id: 'me',
  name: 'A & B',
  headline: 'Eng <x>',
  experience: [],
  education: [],
  certifications: [],
  skills: {},
  metadata: { gh: 'https://x' },
};

describe('render helpers', () => {
  it('renders markdown to HTML', () => {
    expect(renderMarkdown('# Hi')).toContain('<h1>Hi</h1>');
  });

  it('builds profile meta + Person JSON-LD', () => {
    const meta = profileMeta(profile);
    expect(meta.title).toBe('A & B — Eng <x>');
    const ld = personJsonLd(profile) as { '@type': string; sameAs: string[] };
    expect(ld['@type']).toBe('Person');
    expect(ld.sameAs).toContain('https://x');
  });

  const post: Post = {
    post_id: 'p1',
    title: 'Hello <world>',
    body: '# Heading\n\nSome **bold** text that is reasonably long for a snippet check.',
    tags: ['aws', 'serverless'],
    published: true,
    created_at: '2026-06-01T12:00:00.000Z',
  };

  it('builds post meta with the og image + post URL', () => {
    const meta = postMeta(post);
    expect(meta.title).toBe('Hello <world>');
    expect(meta.image_url).toMatch(/\/og\/posts\/p1\.png$/);
    expect(meta.url).toMatch(/\/posts\/p1$/);
    expect(meta.description).not.toContain('#'); // markdown stripped from the snippet
  });

  it('builds BlogPosting JSON-LD + escapes the title in HTML', () => {
    const ld = postJsonLd(post) as { '@type': string; headline: string };
    expect(ld['@type']).toBe('BlogPosting');
    const html = postHtml(post);
    expect(html).toContain('og:type" content="article"');
    expect(html).toContain('Hello &lt;world&gt;'); // escaped
    expect(html).toContain('<h1>Heading</h1>'); // markdown body rendered
    expect(html).toContain('"@type":"BlogPosting"');
  });

  it('renders a legacy (markdown) article via markdown-it', () => {
    const html = articleHtml({ ...baseArticle, body: '# H\n\ntext' });
    expect(html).toContain('<h1>H</h1>'); // markdown rendered
  });

  it('renders an html article body directly (and re-sanitizes for safety)', () => {
    const html = articleHtml({ ...baseArticle, content_format: 'html', body: '<p>rich <strong>body</strong></p><script>x()</script>' });
    expect(html).toContain('<p>rich <strong>body</strong></p>'); // used as-is
    expect(html).not.toContain('<script>'); // defense-in-depth re-sanitize
  });

  it('strips html from the meta description snippet', () => {
    const meta = articleMeta({ ...baseArticle, content_format: 'html', body: '<p>Hello <strong>world</strong> from html</p>' });
    expect(meta.description).toContain('Hello world from html');
    expect(meta.description).not.toContain('<');
  });
});
