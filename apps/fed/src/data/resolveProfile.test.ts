import { describe, it, expect } from 'vitest';
import { resolveProfile } from './resolveProfile';
import { profileSource, CAREER_YEARS_PUBLIC } from './profile';
import type { ProfileSource } from '../types/profile';

const en = resolveProfile(profileSource, 'en');
const pt = resolveProfile(profileSource, 'pt');

describe('resolveProfile', () => {
  it('resolves prose to the requested locale', () => {
    // The public figure is the evergreen "N+" floor (#124); assert the SHAPE and the locale, not the
    // exact floor — pinning the number here would recreate the drift this replaced, one layer down.
    expect(en.headline).toMatch(/\d+\+ years in Software Engineering/);
    expect(pt.headline).toMatch(/\d+\+ anos em Engenharia de Software/);
    expect(en.summary).toContain('not machine learning research');
    expect(pt.summary).toContain('não pesquisa em machine learning');
    expect(en.location).toBe('São Paulo — Brazil');
    expect(pt.location).toBe('São Paulo — Brasil');
  });

  // The headline is the owner's ratified string, word for word (#749). It is the same string LinkedIn
  // carries (ADR-0024), so a paraphrase here is a drift between two surfaces, and the assertion is the
  // whole string rather than a fragment. The years figure is read from the exported constant rather than
  // typed, so the evergreen floor can move without this test going stale.
  it('carries the ratified mission-first headline in both editions (#749)', () => {
    expect(en.headline).toBe(
      'AI Engineer, learning in public with the people and machines of this era | ' +
        'Context & Harness Engineering | ' +
        'Claude Code · Kiro · Python · TypeScript · AWS | ' +
        `${CAREER_YEARS_PUBLIC} years in Software Engineering & Distributed Systems`,
    );
    expect(pt.headline).toBe(
      'AI Engineer, aprendendo em público com as pessoas e as máquinas desta era | ' +
        'Context & Harness Engineering | ' +
        'Claude Code · Kiro · Python · TypeScript · AWS | ' +
        `${CAREER_YEARS_PUBLIC} anos em Engenharia de Software & Sistemas Distribuídos`,
    );
  });

  // LinkedIn caps a headline at 220 characters, and the English edition is the one it carries. At 211
  // the margin is nine, so one added tool name overflows it; this fails before the copy reaches LinkedIn.
  it('keeps the LinkedIn headline within its 220-character limit (#749)', () => {
    expect(en.headline.length).toBeLessThanOrEqual(220);
  });

  it('tells the full career arc, not only the AI-Engineer slice (#125)', () => {
    // AI is the attention hook at the top of the summary…
    expect(en.summary).toMatch(/^AI Engineer/);
    expect(pt.summary).toMatch(/^AI Engineer/);
    // …with the ~two-decade journey legible underneath as the substance: the beginnings (packaged
    // software) and the through-line both named, so the arc reads as a journey the AI work sits on —
    // not a fresh start. This is the point of #125.
    //
    // THE THROUGH-LINE IS NO LONGER AN IDENTITY NOUN, AND THAT IS THE ASSERTION THAT MOVED (#537). It
    // read `distributed-applications architect` / `arquiteto de aplicações distribuídas` until
    // 2026-08-27, when the owner objected that `architect` reads to the market as someone who does not
    // write code. What replaced it is a statement of what he DOES across the same span, which is the
    // device the practice lines already use one layer down. #125's requirement is unchanged — the arc
    // must still be named here — so the assertion is repointed rather than deleted; deleting it would
    // have left the summary free to lose the through-line entirely and ship green.
    expect(en.summary).toContain('packaged software');
    expect(en.summary).toContain('building modern applications on AWS');
    expect(pt.summary).toContain('software empacotado');
    expect(pt.summary).toContain('construindo aplicações modernas na AWS');
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

  // A translated sentence is free to differ in wording; it is not free to differ in FACT. The test above
  // pins the structured facts (dates, titles); this one pins the facts that live INSIDE the prose — the
  // years a role's description and highlights name. #717: the EN edition said he joined as an intern in
  // 2008 and the PT edition did not mention it, and `/cv.pdf` prints only the EN edition, so nothing
  // printed or rendered compared the two. Over EVERY role, not the one that drifted, because the hole
  // belongs to the prose and not to that role.
  it('names the same years in each role prose across editions (#717)', () => {
    const years = (role: (typeof en.experience)[number]) =>
      [...new Set([role.description ?? '', ...(role.highlights ?? [])].join(' ').match(/\b(?:19|20)\d{2}\b/g) ?? [])].sort();

    // Without this the test could pass by comparing empty sets everywhere — prose that names no year.
    expect(en.experience.some((role) => years(role).length > 0), 'no role prose names a year — this test would assert nothing').toBe(true);

    en.experience.forEach((role, i) => {
      expect(years(pt.experience[i]), `${role.company} (${role.start_date}): PT prose names different years than EN`).toEqual(
        years(role),
      );
    });
  });

  // The fact itself, settled by the owner on #717 («Estágio nas duas»): both editions say the career
  // began as an internship, in the year the role's own start date carries. Read the year off the data
  // rather than typing it, so a corrected start date moves the expectation with it.
  it('says the career began as an internship, in both editions (#717)', () => {
    const first = [...en.experience].sort((a, b) => a.start_date.localeCompare(b.start_date))[0];
    const i = en.experience.indexOf(first);
    const year = first.start_date.slice(0, 4);
    const prose = (role: (typeof en.experience)[number]) => (role.highlights ?? []).join(' ');

    expect(prose(first)).toMatch(/\bintern\b/i);
    expect(prose(first)).toContain(year);
    expect(prose(pt.experience[i])).toMatch(/\best[aá]gi/i); // estágio · estagiário · estagiária
    expect(prose(pt.experience[i])).toContain(year);
  });

  it('localizes education wording but not the institution', () => {
    expect(en.education[0].degree).toBe("Bachelor's Degree");
    expect(pt.education[0].degree).toBe('Bacharelado');
    expect(pt.education[0].institution).toBe(en.education[0].institution);
  });

  it('localizes skill group labels while sharing the technical terms', () => {
    expect(Object.keys(en.skills)).toContain('Distributed Systems & DevOps');
    expect(Object.keys(pt.skills)).toContain('Sistemas Distribuídos & DevOps');
    // The terms themselves are proper nouns — identical in both editions.
    expect(pt.skills['Linguagens']).toEqual(en.skills['Languages']);
    expect(pt.skills['Engenharia AI-native']).toEqual(en.skills['AI-native Engineering']);
  });

  // Spoken languages are LEVELED like every other group since 2026-07-31, and their names localize —
  // which is the case `SkillItemSource.name` was widened for. Asserted in both editions and with the
  // level, because the point of the change was that this group stopped being the exception.
  it('localizes a leveled skill name and keeps its level (spoken languages)', () => {
    expect(en.skills['Languages (spoken)']).toContainEqual({ name: 'Portuguese', level: 4 });
    expect(pt.skills['Idiomas']).toContainEqual({ name: 'Português', level: 4 });
  });

  // The other half of the widened type, and the one that would break silently: a technical name is a
  // plain string and must pass through UNCHANGED in both editions, never resolved as if localized.
  it('leaves a plain-string skill name identical across editions', () => {
    expect(en.skills['Languages']).toContainEqual({ name: 'Python', level: 3 });
    expect(pt.skills['Linguagens']).toContainEqual({ name: 'Python', level: 3 });
  });

  it('preserves the authored group order in both editions', () => {
    expect(Object.keys(pt.skills)).toHaveLength(Object.keys(en.skills).length);
    expect(Object.keys(en.skills)[0]).toBe('AWS Cloud');
    expect(Object.keys(pt.skills)[0]).toBe('AWS Cloud');
  });

  // `print_highlight_index` is an INDEX into an array authored a hundred lines away in the same file,
  // and nothing relates the two: `print_highlight_index: 99` typechecks, renders no `data-print-keep`,
  // and prints ZERO bullets — silently, with every gate green.
  //
  // THE PAGE BUDGET CANNOT CATCH IT, and the reason is this slice's own doing. Measured on 2026-08-27,
  // three builds, one variable: `main` prints 0 bullets in 2 pages; head prints 1 in 3; head with the
  // index out of range prints 0 in — still 3. On `main` the count accidentally discriminated
  // bullet-presence; #542 lengthened the practice lines enough that three pages are spent on the
  // practice lines alone, so the budget now carries no information about whether the bullet it was
  // raised to buy actually printed. The slice created the exposure AND removed the only signal that
  // had been covering it, which is why the invariant is asserted here directly rather than inferred
  // from `cv-pdf.spec.ts`'s `toHaveLength(3)`.
  //
  // OVER EVERY ROLE AND BOTH EDITIONS, not over the one role that sets the flag today: the hole belongs
  // to the field, not to this year's CV, and a test naming one role stops covering the next role to set
  // it. This is the FLOOR — it proves the flag points at a highlight that exists. That it points at the
  // RIGHT one is a claim about meaning, and it is asserted where the meaning is visible, on the printed
  // artifact (`e2e/cv-pdf.spec.ts`, "keeps a hands-on bullet under the current role").
  it('points `print_highlight_index` at a highlight that exists, on every role and in both editions', () => {
    const flagged = [...en.experience, ...pt.experience].filter((role) => role.print_highlight_index !== undefined);

    // Without this, the test passes by iterating an empty list the day the flag is unset everywhere —
    // the same "compares nothing to nothing" failure `cv-pdf.spec.ts` guards its own selectors against.
    // It is a real coupling to the data: unsetting the flag on every role reddens here, deliberately,
    // because that is a decision (it happened between #522 and #542) and not something to drift into.
    expect(flagged.length, 'no role sets print_highlight_index — this test would assert nothing').toBeGreaterThan(0);

    for (const role of flagged) {
      const i = role.print_highlight_index as number;
      expect(Number.isInteger(i), `${role.company}: print_highlight_index must be an integer, got ${i}`).toBe(true);
      expect(i, `${role.company}: print_highlight_index must not be negative`).toBeGreaterThanOrEqual(0);
      // The assertion that actually closes the hole: the index must land INSIDE the array it indexes.
      // `highlights?.[99]` is `undefined`, which is precisely the state that prints nothing.
      expect(
        role.highlights?.[i],
        `${role.company}: print_highlight_index ${i} points at no highlight (${role.highlights?.length ?? 0} authored)`,
      ).toEqual(expect.any(String));
      expect((role.highlights?.[i] ?? '').trim().length, `${role.company}: the printed highlight is empty`).toBeGreaterThan(0);
    }
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
