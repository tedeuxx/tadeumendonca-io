// `blast-radius-supernova` as a dated record with an addendum (#737).
//
// WHY THIS EXISTS. The article, published 2026-08-28, says the plugin passes every shell command through
// two hooks and that hooks deny a command before it runs. Both were true that day; neither is true of
// this repository today (`wip-guard` was deleted on 2026-09-04, and the plugin is disabled here). The
// owner ruled the article stays a record of when it was published (Q1 on #737, carrying over #732), so
// the fix is a dated addendum and the sign-off moved to its end, not a rewrite. This pins the SOURCE; the
// served bytes are pinned by `e2e/blast-radius-supernova-addendum.spec.ts`.
//
// TWO STATES, ONE FILE (#737 AC 16). The addendum ships as a PENDING REVISION (#741, ADR-0049 as amended
// 2026-10-16): merge 1 adds `revisions/blast-radius-supernova.{en,pt}.md`, merge 2 moves them onto `blog/`
// with `git mv -f` and nothing else. So the text under test is the revision while one exists for this key,
// and the published edition otherwise; each state adds the arms only it can hold. Neither needs an edit at
// release, which is what keeps the release one commit.
//
// WHAT THIS CANNOT DO. Every arm is a PHRASE CHECK: a paraphrase passes. It cannot tell whether the
// addendum's statements about today's loop are still true tomorrow; the addendum is dated for exactly that
// reason. That the body is unchanged since the publication commit `0812dac` needs git history, which a
// unit test does not read; it is checked with `git diff 0812dac:<blog file> <revision file>` (AC 1). While
// the revision is pending, the arm below checks the same thing against the published edition on disk.
import { describe, it, expect } from 'vitest';
import en from './blog/blast-radius-supernova.en.md?raw';
import pt from './blog/blast-radius-supernova.pt.md?raw';

const revisions = import.meta.glob('./revisions/blast-radius-supernova.*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;
// The state is read off the tree, never typed: a revision file for this key means merge 1 has landed and
// merge 2 has not.
const PENDING = Object.keys(revisions).length > 0;
const PUBLISHED = { en, pt } as const;
const BODY = PENDING
  ? {
      en: revisions['./revisions/blast-radius-supernova.en.md'] ?? '',
      pt: revisions['./revisions/blast-radius-supernova.pt.md'] ?? '',
    }
  : PUBLISHED;
const LOCALES = ['en', 'pt'] as const;

const SIGN_OFF = {
  en: 'Good luck out there, and may your radius be narrow.',
  pt: 'Boa sorte por aí, e que o seu raio seja estreito.',
};
const ADDENDUM_HEADING = { en: '## Addendum — 16 October 2026', pt: '## Adendo — 16 de outubro de 2026' };
// The dates the addendum is allowed to carry; every other digit would be a count (AC 5).
const DATES = {
  en: ['16 October 2026', '28 August 2026', '4 September 2026'],
  pt: ['16 de outubro de 2026', '28 de agosto de 2026', '4 de setembro de 2026'],
};
// AC 2: the owner's argument for hooks and gates stays as published, whatever the addendum says.
const LINE_173 = {
  en: 'why this loop is made of hooks and gates rather than of a very long document explaining to the agent how to behave.',
  pt: 'por que este loop é feito de hooks e gates em vez de um documento muito longo explicando ao agente como se comportar.',
};

const addendum = (locale: (typeof LOCALES)[number]): string => {
  const at = BODY[locale].indexOf(ADDENDUM_HEADING[locale]);
  return at < 0 ? '' : BODY[locale].slice(at);
};

describe('a dated addendum closes each edition (#737 AC 3, 4, 5, 7)', () => {
  // The sign-off moves to the end of the addendum, once (AC 3, the #732 "Mover a assinatura" ruling).
  it.each(LOCALES)('the %s addendum sits behind a rule and ends on the sign-off', (locale) => {
    const body = BODY[locale];
    const head = body.indexOf(ADDENDUM_HEADING[locale]);
    expect(head, `${locale}: addendum heading missing`).toBeGreaterThan(0);
    expect(body.slice(0, head).trimEnd().endsWith('\n---'), `${locale}: no rule before the addendum`).toBe(true);
    expect(body.split(SIGN_OFF[locale]).length - 1, `${locale}: sign-off must appear exactly once`).toBe(1);
    expect(body.indexOf(SIGN_OFF[locale]), `${locale}: sign-off before the addendum`).toBeGreaterThan(head);
    const lines = body.trimEnd().split('\n');
    expect(lines[lines.length - 1], `${locale}: last line is not the sign-off`).toBe(SIGN_OFF[locale]);
  });

  it.each(LOCALES)('the %s addendum points to /architecture and to tedeuxx/mhw', (locale) => {
    const text = addendum(locale);
    expect(text).toContain('](/architecture)');
    expect(text).toContain('](https://github.com/tedeuxx/mhw)');
  });

  it.each(LOCALES)('the %s addendum publishes no number other than its dates', (locale) => {
    let text = addendum(locale);
    expect(text.length, `${locale}: addendum missing`).toBeGreaterThan(500);
    for (const d of DATES[locale]) text = text.split(d).join('');
    expect(text).not.toMatch(/\d/);
  });

  it.each(LOCALES)('the %s edition keeps the hooks-and-gates argument as published (AC 2)', (locale) => {
    expect(BODY[locale].split(LINE_173[locale]).length - 1).toBe(1);
    expect(addendum(locale)).not.toContain('very long document');
    expect(addendum(locale)).not.toContain('documento muito longo');
  });
});

// While the revision is pending (merge 1 landed, merge 2 not): the published edition is the one every
// visitor reads, so it must be untouched, and the revision must be that edition plus the addendum only.
describe.runIf(PENDING)('while the revision is pending, the published edition is untouched (#737 AC 1, 13, 14)', () => {
  it.each(LOCALES)('the published %s edition carries no addendum and still ends on the sign-off', (locale) => {
    expect(PUBLISHED[locale]).not.toContain(ADDENDUM_HEADING[locale]);
    expect(PUBLISHED[locale].trimEnd().endsWith(`\n\n${SIGN_OFF[locale]}`)).toBe(true);
  });

  it.each(LOCALES)('the %s revision is the published edition with only the addendum and the sign-off move', (locale) => {
    const revised = BODY[locale];
    const head = revised.indexOf(ADDENDUM_HEADING[locale]);
    const before = revised.slice(0, head).trimEnd();
    expect(before.endsWith('\n---')).toBe(true);
    const original = before.slice(0, -'\n---'.length).trimEnd();
    expect(`${original}\n\n${SIGN_OFF[locale]}\n`).toBe(PUBLISHED[locale]);
  });
});
// Once released, the arms above read the published edition, which is the whole of AC 7's source half.
// "No revision is left for this key" is AC 17's `git ls-tree` check: asserted here it would be the state
// predicate restated, true by construction.
