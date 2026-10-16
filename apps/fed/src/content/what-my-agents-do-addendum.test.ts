// `what-my-agents-do` as a dated record with an addendum (#732).
//
// WHY THIS EXISTS. The article published a tier drawing and a sentence saying that drawing "is" the one on
// /architecture. The loop moved on (#716, #733) and the article kept claiming identity with a live page,
// while one clause about content-reviewer was false on the day it went out. The owner ruled the article
// stays a record of when it was published (Q1 on #732), so the fix is an erratum, a past-tense sentence
// and a dated addendum, not a rewrite. This pins the SOURCE and the generated artifact; the served bytes
// are pinned by `e2e/what-my-agents-do-addendum.spec.ts`.
//
// WHAT THIS CANNOT DO. Every arm is a PHRASE CHECK: it catches the retired wording as published and the
// new wording as written, and a paraphrase passes either way. It cannot tell whether the addendum's
// statements about today's loop are still true tomorrow; the addendum is dated for exactly that reason.
// AC 1 and AC 5 (nothing else in the article moved since `3389dbb`) need git history, which a unit test
// does not read; they are checked with `git diff 3389dbb -- <both editions>`.
import { describe, it, expect } from 'vitest';
import en from './blog/what-my-agents-do.en.md?raw';
import pt from './blog/what-my-agents-do.pt.md?raw';
import diagrams from './generated/diagrams.json';

const BODY = { en, pt } as const;
const LOCALES = ['en', 'pt'] as const;

const SIGNATURE = { en: 'This is what I think.', pt: 'Isso é o que eu penso.' };
const ADDENDUM_HEADING = { en: '## Addendum — 15 October 2026', pt: '## Adendo — 15 de outubro de 2026' };
// The dates the addendum is allowed to carry; every other digit would be a count (AC 6).
const DATES = {
  en: ['15 October 2026', '18 September 2026'],
  pt: ['15 de outubro de 2026', '18 de setembro de 2026'],
};
const RETIRED_REVIEWER = { en: 'what it blocks is a draft', pt: 'o que ele barra é um rascunho' };
const CURRENT_REVIEWER = {
  en: 'it blocks nothing: it repairs the draft in place',
  pt: 'ele não barra nada: conserta o rascunho ali mesmo',
};
// The present-tense identity claim of AC 3, in the words it was published in.
const RETIRED_IDENTITY = {
  en: ['it is the one that sits on', 'taken as it is'],
  pt: ['é o que está na [página de arquitetura]', 'tal como está'],
};
const PAST_IDENTITY = {
  en: 'it was the one that sat on [the architecture page](/architecture) when I published this',
  pt: 'era o que estava na [página de arquitetura](/architecture) quando eu publiquei este texto',
};

const fence = (body: string): string => {
  const m = /```mermaid\n([\s\S]*?)```/.exec(body);
  return m ? m[1] : '';
};
const addendum = (locale: (typeof LOCALES)[number]): string => {
  const at = BODY[locale].indexOf(ADDENDUM_HEADING[locale]);
  return at < 0 ? '' : BODY[locale].slice(at);
};
const flattenSvg = (svg: string): string => svg.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

describe('the tier drawing carries the content-reviewer erratum (#732 AC 1–2)', () => {
  it.each(LOCALES)('the %s fence states the true clause and not the retired one', (locale) => {
    const src = fence(BODY[locale]);
    expect(src.length, `${locale}: no mermaid fence found`).toBeGreaterThan(1000);
    expect(src).not.toContain(RETIRED_REVIEWER[locale]);
    expect(src).toContain(CURRENT_REVIEWER[locale]);
  });

  it.each(LOCALES)('the generated %s SVG follows the corrected source', (locale) => {
    const src = fence(BODY[locale]).trimEnd();
    const svg = (diagrams as Record<string, string>)[src];
    expect(svg, `${locale}: diagrams.json has no entry for this fence — run gen-diagrams`).toBeTruthy();
    const text = flattenSvg(svg);
    expect(text).not.toContain(RETIRED_REVIEWER[locale]);
    expect(text).toContain(CURRENT_REVIEWER[locale]);
  });
});

describe('the architecture-page sentence is past tense (#732 AC 3)', () => {
  it.each(LOCALES)('the %s edition no longer claims identity with the live page', (locale) => {
    for (const phrase of RETIRED_IDENTITY[locale]) expect(BODY[locale]).not.toContain(phrase);
    expect(BODY[locale]).toContain(PAST_IDENTITY[locale]);
  });
});

describe('a dated addendum closes each edition (#732 AC 4, 6, 7)', () => {
  it.each(LOCALES)('the %s addendum follows the signature behind a rule', (locale) => {
    const body = BODY[locale];
    const sig = body.indexOf(SIGNATURE[locale]);
    const head = body.indexOf(ADDENDUM_HEADING[locale]);
    expect(sig, `${locale}: signature missing`).toBeGreaterThan(0);
    expect(head, `${locale}: addendum heading missing`).toBeGreaterThan(sig);
    expect(body.slice(sig + SIGNATURE[locale].length, head).trim()).toBe('---');
  });

  it.each(LOCALES)('the %s addendum points to /architecture and to tedeuxx/mhw', (locale) => {
    const text = addendum(locale);
    expect(text).toContain('](/architecture)');
    expect(text).toContain('](https://github.com/tedeuxx/mhw)');
  });

  it.each(LOCALES)('the %s addendum publishes no number other than its two dates', (locale) => {
    let text = addendum(locale);
    expect(text.length, `${locale}: addendum missing`).toBeGreaterThan(500);
    for (const d of DATES[locale]) text = text.split(d).join('');
    expect(text).not.toMatch(/\d/);
  });
});
