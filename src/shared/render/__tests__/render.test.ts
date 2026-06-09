import { describe, it, expect } from 'vitest';
import { renderMarkdown, profileMeta, personJsonLd } from '../index';
import type { Profile } from '../../types/entities';

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
});
