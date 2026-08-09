import { describe, it, expect } from 'vitest';
import { parseVennSpec } from './vennSpec';

const LINES = [
  'accTitle: A caption',
  'accDescr: The whole figure, in words, for a reader who cannot see it.',
  'centre: First line | Second line',
  'pillar: One | uno',
  '- alpha',
  '- beta',
  'pillar: Two | dos',
  '- gamma',
  'pillar: Three | tres',
  '- delta',
];
const VALID = LINES.join('\n');
const without = (i: number): string => LINES.filter((_, j) => j !== i).join('\n');

describe('the venn fence grammar', () => {
  it('reads the caption, the description, the intersection and three pillars', () => {
    const spec = parseVennSpec(VALID);
    expect(spec.accTitle).toBe('A caption');
    expect(spec.accDescr).toMatch(/^The whole figure/);
    expect(spec.centre).toEqual(['First line', 'Second line']);
    expect(spec.pillars.map((p) => p.title)).toEqual([
      ['One', 'uno'],
      ['Two', 'dos'],
      ['Three', 'tres'],
    ]);
    expect(spec.pillars.map((p) => p.items)).toEqual([['alpha', 'beta'], ['gamma'], ['delta']]);
  });

  it('ignores blank lines and indentation, the way a fence gets edited', () => {
    const padded = LINES.flatMap((l) => ['', `   ${l}  `]).join('\n');
    expect(parseVennSpec(padded)).toEqual(parseVennSpec(VALID));
  });

  // EVERY ONE OF THESE IS A REAL AUTHORING MISTAKE, and each is asserted individually rather than as one
  // "invalid input throws" case. An omnibus assertion passes as soon as ONE branch throws, which is how a
  // validator ends up enforcing one rule while looking like it enforces eleven.
  //
  // The parser throws rather than degrades: on a static site the prerender bakes the result into the
  // served bytes, so a half-drawn figure is an artifact, not a moment.
  it.each([
    ['no accTitle — the figure would be unlabelled for a screen reader', without(0), /accTitle/],
    ['no accDescr — the figure would be nothing at all for that reader', without(1), /accDescr/],
    ['no centre — the intersection is the claim the figure makes', without(2), /centre is missing/],
    ['two pillars where the geometry draws three', LINES.slice(0, 8).join('\n'), /3 pillars, got 2/],
    ['four pillars', [VALID, 'pillar: Four | quatro', '- epsilon'].join('\n'), /3 pillars, got 4/],
    ['a pillar with no items — an empty circle', without(9), /no items/],
    [
      'a pillar with six items — the sixth row affords 14 characters, which is not a line anyone writes',
      [...LINES.slice(0, 6), '- b3', '- b4', '- b5', '- b6', ...LINES.slice(6)].join('\n'),
      /5 is what the circle holds/,
    ],
    [
      'a one-line centre where the geometry needs two',
      VALID.replace('centre: First line | Second line', 'centre: Only one line'),
      /centre must be two/,
    ],
    ['a one-line pillar title', VALID.replace('pillar: Two | dos', 'pillar: Two'), /pillar title must be two/],
    ['an item before any pillar', ['- orphan', VALID].join('\n'), /before any/],
    ['a key the grammar does not know', [VALID, 'colour: red'].join('\n'), /unrecognised line/],
  ])('refuses: %s', (_case, body, message) => {
    expect(() => parseVennSpec(body)).toThrow(message);
  });

  // The guard on the guard: every mutation above must break something the VALID baseline does NOT break.
  // Without this, a parser that threw unconditionally would pass all eleven cases above.
  it('accepts the baseline the refusals are mutations of', () => {
    expect(() => parseVennSpec(VALID)).not.toThrow();
  });

  // THE OTHER HALF OF THE CAP, and it is the half that was missing while the cap read 4. A refusal test
  // alone pins only the ceiling; it stays green when the ceiling is set too LOW, which is exactly the
  // defect that shipped — five items were refused as an overflow they are not, on an unmeasured comment.
  // So the last legal arrangement is asserted to be legal, not merely the first illegal one to be illegal.
  it('accepts five items — the last arrangement the geometry affords', () => {
    const five = [...LINES.slice(0, 6), '- b3', '- b4', '- b5', ...LINES.slice(6)].join('\n');
    expect(() => parseVennSpec(five)).not.toThrow();
    expect(parseVennSpec(five).pillars[0].items).toHaveLength(5);
  });
});
