// The mission a reader meets first, guarded against the proposition it replaced (#688).
//
// The site used to lead with a harness-centered proof-of-engineering pitch: "a portfolio of automations
// and technical writing", and a hero promising to teach the reader to build with AI "from everyday life
// to production". #688 recentered it on a personal, independent commitment to learn in public with the
// people and machines of this era. The carriers of that first contact are the hero keys, the landing's
// about panel, the default description in both locales, its pre-load copy in index.html, and the default
// card's alt text.
//
// WHY A NEGATIVE AND A POSITIVE TOGETHER. A list of retired phrases alone passes over an empty string,
// and over any future wording that drifts back to the old proposition in new words. So each carrier is
// also asserted to carry the new proposition in its own language. The retired list is derived from the
// strings that actually shipped before #688, not from memory.
//
// Calibrated by mutating the SOURCE (messages.ts, site.ts, index.html), never this file — see the PR.
import { describe, it, expect } from 'vitest';
import indexHtml from '../../index.html?raw';
import { strings } from '../i18n/messages';
import { DEFAULT_DESCRIPTION_EN, DEFAULT_DESCRIPTION_PT, defaultDescription, ogImageAlt } from './site';
import type { Locale } from '../i18n/config';

const LOCALES: Locale[] = ['pt', 'en'];

// The retired proposition, as it shipped. Case-insensitive, and hyphen-or-space for "proof-of-engineering"
// so a re-spelling does not walk past it.
const RETIRED = [
  /proof[- ]of[- ]engineering/i,
  /portfolio of automations/i,
  /portf[oó]lio de automa[cç][oõ]es/i,
  /learn to build with ai/i,
  /aprenda a construir com ia/i,
  /from everyday life to production/i,
  /do dia a dia [àa] produ[cç][aã]o/i,
  /open technical content/i,
  /conte[uú]do t[eé]cnico aberto/i,
  /the code (is|IS) the pitch/i,
  /in public about AI engineering/i,
  /em público sobre engenharia de IA/i,
];

// The new proposition, per locale: learning in public, with the people and machines of this era.
const MISSION: Record<Locale, RegExp> = {
  en: /learn in public with the people and machines of this era/i,
  pt: /aprender em público com as pessoas e as máquinas desta era/i,
};

const heroText = (locale: Locale) => Object.values(strings.hero).map((entry) => entry[locale]).join(' ');

const preloadDescription = /<meta name="description" content="([^"]*)"/.exec(indexHtml)?.[1] ?? '';

describe('the retired proposition does not return to first contact', () => {
  const carriers: [string, string][] = [
    ...LOCALES.map((l): [string, string] => [`hero (${l})`, heroText(l)]),
    ...LOCALES.map((l): [string, string] => [`landing about panel (${l})`, strings.about.body[l]]),
    ...LOCALES.map((l): [string, string] => [`default description (${l})`, defaultDescription(l)]),
    ...LOCALES.map((l): [string, string] => [`default card alt (${l})`, ogImageAlt(l)]),
    ['index.html pre-load description', preloadDescription],
  ];

  it.each(carriers)('%s carries none of the retired phrases', (_name, text) => {
    // A carrier that resolved to nothing would pass every negative below having checked nothing.
    expect(text.length).toBeGreaterThan(20);
    for (const phrase of RETIRED) expect(text).not.toMatch(phrase);
  });
});

describe('the new proposition is what first contact says', () => {
  it.each(LOCALES)('the %s hero tagline states it', (locale) => {
    const tagline = `${strings.hero.taglineLead[locale].replace(/\s*—\s*$/, '')} ${strings.hero.taglineAccent[locale]}`;
    expect(tagline).toMatch(MISSION[locale]);
  });

  it.each(LOCALES)('the %s default description states it, and keeps one market term', (locale) => {
    const description = defaultDescription(locale);
    expect(description).toMatch(MISSION[locale]);
    expect(description).toContain('agentic development');
  });

  // The owner named the noun on the PR (#743): first contact calls the mission a commitment, never an
  // effort. Pinned on the two carriers that state it, the hero body and the default description.
  const NOUN: Record<Locale, { kept: RegExp; retired: RegExp }> = {
    en: { kept: /\bcommitment\b/i, retired: /\beffort\b/i },
    pt: { kept: /\bcompromisso\b/i, retired: /esfor[cç]o/i },
  };
  it.each(LOCALES)('the %s first contact names the mission a commitment, not an effort', (locale) => {
    for (const text of [heroText(locale), defaultDescription(locale)]) {
      expect(text).toMatch(NOUN[locale].kept);
      expect(text).not.toMatch(NOUN[locale].retired);
    }
  });

  it('the pre-load description is the English default, word for word', () => {
    expect(preloadDescription).toBe(DEFAULT_DESCRIPTION_EN);
  });

  // The negatives in useDocumentHead.test.tsx and e2e/seo.spec.ts assert an ARTICLE card's alt does not
  // contain `vamos aprender em público`. That only means something while the default alt really carries
  // those words; this pins the coupling, so moving the alt without moving those negatives goes red here.
  it('the default card alt carries the words the article-alt negatives name', () => {
    expect(ogImageAlt('pt')).toContain('vamos aprender em público');
    expect(ogImageAlt('en')).toMatch(/learn in public, with the people and machines of this era/);
  });

  it('the two editions are two authored strings, not one copied', () => {
    expect(DEFAULT_DESCRIPTION_PT).not.toBe(DEFAULT_DESCRIPTION_EN);
  });
});
