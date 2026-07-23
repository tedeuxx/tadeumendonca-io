import { describe, it, expect } from 'vitest';
import { resolveProfile } from './resolveProfile';
import { profileSource } from './profile';
import type { ProfileSource } from '../types/profile';

const en = resolveProfile(profileSource, 'en');
const pt = resolveProfile(profileSource, 'pt');

describe('resolveProfile', () => {
  it('resolves prose to the requested locale', () => {
    expect(en.headline).toContain('17y across SDLC');
    expect(pt.headline).toContain('17 anos em SDLC');
    expect(en.summary).toContain('not machine learning research');
    expect(pt.summary).toContain('não pesquisa em machine learning');
    expect(en.location).toBe('São Paulo — Brazil');
    expect(pt.location).toBe('São Paulo — Brasil');
  });

  it('shares the facts across editions — the two CVs can never disagree', () => {
    // Dates, employers and official job titles are authored once; a translation cannot drift them.
    expect(pt.experience.map((e) => e.company)).toEqual(en.experience.map((e) => e.company));
    expect(pt.experience.map((e) => e.title)).toEqual(en.experience.map((e) => e.title));
    expect(pt.experience.map((e) => e.start_date)).toEqual(en.experience.map((e) => e.start_date));
    expect(pt.experience.map((e) => e.end_date)).toEqual(en.experience.map((e) => e.end_date));
    expect(pt.certifications).toEqual(en.certifications);
    expect(pt.metadata).toEqual(en.metadata);
    expect(pt.name).toBe(en.name);
  });

  it('translates every role description and highlight, keeping the same count', () => {
    expect(pt.experience).toHaveLength(en.experience.length);
    pt.experience.forEach((role, i) => {
      expect(role.description).not.toBe(en.experience[i].description);
      expect(role.highlights).toHaveLength(en.experience[i].highlights?.length ?? 0);
    });
  });

  it('localizes education wording but not the institution', () => {
    expect(en.education[0].degree).toBe("Bachelor's Degree");
    expect(pt.education[0].degree).toBe('Bacharelado');
    expect(pt.education[0].institution).toBe(en.education[0].institution);
  });

  it('localizes skill group labels while sharing the technical terms', () => {
    expect(Object.keys(en.skills)).toContain('Backend & Distributed Systems');
    expect(Object.keys(pt.skills)).toContain('Backend & Sistemas Distribuídos');
    // The terms themselves are proper nouns — identical in both editions.
    expect(pt.skills['Linguagens']).toEqual(en.skills['Languages']);
    expect(pt.skills['IA & Agentes']).toEqual(en.skills['AI & Agentic']);
  });

  it('localizes the one prose-like skill group (spoken languages)', () => {
    expect(en.skills['Languages (spoken)']).toContain('Portuguese (Native)');
    expect(pt.skills['Idiomas']).toContain('Português (nativo)');
  });

  it('preserves the authored group order in both editions', () => {
    expect(Object.keys(pt.skills)).toHaveLength(Object.keys(en.skills).length);
    expect(Object.keys(en.skills)[0]).toBe('AI & Agentic');
    expect(Object.keys(pt.skills)[0]).toBe('IA & Agentes');
  });

  it('omits optional fields that were not authored', () => {
    const minimal: ProfileSource = {
      profile_id: 'x',
      name: 'X',
      headline: { pt: 'a', en: 'b' },
      experience: [{ company: 'C', title: 'T', start_date: '2020-01', end_date: null }],
      education: [],
      certifications: [],
      skills: [],
      metadata: {},
    };
    const resolved = resolveProfile(minimal, 'pt');
    expect(resolved.summary).toBeUndefined();
    expect(resolved.location).toBeUndefined();
    expect(resolved.experience[0].description).toBeUndefined();
    expect(resolved.experience[0].highlights).toBeUndefined();
  });
});
