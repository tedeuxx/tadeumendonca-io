import { describe, it, expect } from 'vitest';
import { renderMarkdown, profileMeta, personJsonLd, postMeta, postHtml, postJsonLd } from '../index';
import type { Profile, Post } from '../../types/entities';

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
});
