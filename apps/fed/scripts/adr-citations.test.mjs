import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import {
  SELF_EXCLUDED,
  auditFiles,
  auditRepo,
  describeCitation,
  libraryIndex,
  quotedRanges,
  resolves,
  scanText,
  selfCitations,
  struckRanges,
  trackedTextFiles,
} from './adr-citations.mjs';

const repoRoot = resolve(import.meta.dirname, '..', '..', '..');
const adrDir = join(repoRoot, 'docs', 'adr');

// One audit for the whole file — it reads every tracked text file in the repo, and doing that once
// per assertion would make this suite the slowest thing in `npm test` for no extra proof.
const audit = auditRepo(repoRoot, adrDir);

describe('adr citations — the gate', () => {
  // THE ASSERTION THIS FILE EXISTS FOR (#456). Before it, nothing in this repo tokenized a citation
  // from one record to another or from application code to a record: `adr-source.test.mjs` reads each
  // record for what it says about ITSELF, `architecture-links.test.ts` resolves only the `docs/` links
  // in `architecture.{en,pt}.md`, and there is no lychee/markdown-link-check anywhere. So a record
  // could be renamed or deleted and every citation to it would go on pointing at nothing, silently.
  it('has no citation naming a record that does not exist', () => {
    expect(audit.dangling.map(describeCitation)).toEqual([]);
  });

  // The guard above compares a filtered list against an empty one, and an empty list matches an empty
  // list perfectly. If the two citation regexes ever stop matching — a spelling convention changes,
  // `git ls-files` returns nothing because the test ran outside a checkout — every citation comes back
  // clean and this suite goes green having verified nothing. Same vacuous-pass shape `adr-source.test.mjs`
  // already guards against, and the reason those floors are keyed to the library rather than to a number.
  it('is asserting against a real, non-empty citation population', () => {
    expect(audit.citations.length).toBeGreaterThan(0);

    // BOTH spellings, and this is not decoration. The sister job in `tadeumendonca-skills` found
    // citation defects that one spelling missed and the other caught: a number citation survives a
    // RENAME and dies on a REMOVAL, a path citation dies on both. A gate that silently degraded to one
    // spelling would keep passing while covering half of what it claims.
    expect(audit.citations.filter((c) => c.kind === 'token').length).toBeGreaterThan(0);
    expect(audit.citations.filter((c) => c.kind === 'path').length).toBeGreaterThan(0);

    // The scan reached the library AND the code outside it — the two populations this gate was built
    // for. Keyed to "at least one file in each" rather than to the 1,205 / 373 the intake measured:
    // those are facts about a 48-record library, and this Issue exists to change that population.
    const from = (pred) => audit.citations.some((c) => pred(c.file));
    expect(from((f) => f.startsWith('docs/adr/'))).toBe(true);
    expect(from((f) => !f.startsWith('docs/adr/'))).toBe(true);
  });

  // Every citation the gate declined to fail on is REPORTED, not dropped. An excuse nobody can see is
  // how a gate stops covering what it claims to, and these three lists are the only places a real
  // dangling citation could hide. Asserted as exact contents so a new entry has to be looked at by a
  // person, rather than absorbed by a count that keeps passing.
  it('names every citation it excused, rather than discarding it', () => {
    expect(audit.crossRepo.map(describeCitation)).toEqual([]);
    expect(audit.quoted.map(describeCitation)).toEqual([]);
    expect(audit.struck.map(describeCitation)).toEqual([
      // The library's supersede-never-rewrite convention, working as intended: this record's own
      // struck text says the target "was never written". Not a defect; not silently ignored either.
      'docs/adr/0043-harness-inventory-derived-from-plugin-repo.md:1287 cites 0044-committed-permission-floor-local-overlay-ephemeral.md',
    ]);
  });

  // The exclusion is the one hole in a scan that otherwise covers every tracked text file, so it is
  // asserted to be exactly two real paths. A rename does not widen it — the renamed file gets scanned,
  // its fixtures do not resolve, and the gate goes red — but a path that has silently stopped existing
  // would leave an exclusion nobody can account for.
  it('excludes only its own two files, and both of them exist', () => {
    expect(SELF_EXCLUDED).toHaveLength(2);
    for (const p of SELF_EXCLUDED) expect(existsSync(join(repoRoot, p)), p).toBe(true);
    expect(trackedTextFiles(repoRoot).some((f) => SELF_EXCLUDED.includes(f))).toBe(false);
  });

  // NOT A FAILURE YET, and the assertion says so out loud rather than being absent. Absorption turns a
  // citation BETWEEN two records into a citation INSIDE one, which every dangling-link check on earth
  // is blind to because the target still resolves — the defect class the sister job manufactured and
  // had to go back for. `row 00N must not cite ADR-00N` is the arm that catches it; it has nothing to
  // catch until a fold has happened, and an assertion with no possible subject cannot fail.
  //
  // THE ARM COMES WITH THE FIRST FOLD SLICE. What is pinned here is the pre-fold baseline, so that
  // slice can tell a self-citation it MANUFACTURED from the three that were already here.
  it('pins the pre-fold self-citation baseline (the fold arm hangs on this)', () => {
    expect(audit.selfCitations.map(describeCitation)).toEqual([
      'docs/adr/0012-snake-case-content-no-mapping.md:64 cites ADR-0012',
      'docs/adr/0021-application-security-posture.md:54 cites ADR-0021',
      'docs/adr/0035-static-repo-cards-in-longform.md:60 cites ADR-0035',
    ]);
  });
});

describe('scanText', () => {
  it('finds the number form and the intra-library path form', () => {
    const found = scanText('see ADR-0007 and [x](./0009-self-hosted-fonts.md)', 'a.md');
    expect(found.map((c) => [c.kind, c.target])).toEqual([
      ['token', '0007'],
      ['path', '0009-self-hosted-fonts.md'],
    ]);
  });

  // The `docs/adr/…` form is matched OUTSIDE markdown-link syntax on purpose: it appears inside a link
  // in `architecture.{en,pt}.md`, inside a `](./docs/adr/…)` link in `CLAUDE.md`, and as a bare string
  // literal in TypeScript. Keying on `](` would have covered the first two and missed the third.
  it('finds a fully-qualified path that is not inside a markdown link', () => {
    const found = scanText("const p = 'docs/adr/0013-s3-cloudfront-hosting.md';", 'a.ts');
    expect(found.map((c) => c.target)).toEqual(['0013-s3-cloudfront-hosting.md']);
  });

  it('reports the line, so a failure is actionable without opening this module', () => {
    expect(scanText('one\ntwo\nADR-0003\n', 'a.md')[0].line).toBe(3);
  });

  // The hole a MEASUREMENT found, kept as a regression. `~~` and backticks are ordinary characters
  // outside markdown, and pairing them sequentially manufactures spans out of nothing: at the head
  // this landed on, `src/content/generated/diagrams.json` produced one bogus "struck" range 211,935
  // characters wide, covering essentially the whole file. A dangling citation inside it would have
  // been silently excused — a false negative, the one direction a gate must never fail in.
  it('does not apply markdown strike or code-span excuses outside markdown', () => {
    const struckText = '~~ this pointer to ADR-9999 is struck ~~';
    const quotedText = 'the string `ADR-9999` appears here';

    // Same bytes, markdown extension: the conventions apply and the citation is excused.
    expect(scanText(struckText, 'x.md')[0].struck).toBe(true);
    expect(scanText(quotedText, 'x.md')[0].quoted).toBe(true);

    // Same bytes, anywhere else: they are ordinary characters and excuse nothing.
    expect(scanText(struckText, 'x.json')[0].struck).toBe(false);
    expect(scanText(quotedText, 'x.ts')[0].quoted).toBe(false);
  });
});

describe('resolves', () => {
  const index = libraryIndex(adrDir);

  it('resolves a number that has a record and a filename that is a record', () => {
    expect(resolves({ kind: 'token', target: '0003' }, index)).toBe(true);
    expect(resolves({ kind: 'path', target: '0003-trunk-based-single-environment.md' }, index)).toBe(
      true,
    );
  });

  // The asymmetry that makes both spellings worth matching: the NUMBER still resolves after a rename,
  // so a number-only gate is blind to exactly the change the fold slices will make most often.
  it('rejects a filename whose number exists but whose name does not', () => {
    expect(resolves({ kind: 'path', target: '0003-trunk-based.md' }, index)).toBe(false);
    expect(resolves({ kind: 'token', target: '0003' }, index)).toBe(true);
  });

  it('rejects a number no record carries', () => {
    expect(resolves({ kind: 'token', target: '9999' }, index)).toBe(false);
  });

  // The hole a mutation found, kept as a regression. The path regex used to read `[a-z0-9-]+`, so a
  // planted citation to `./0009-self-hosted-fonts-RENAMED.md` was not MATCHED at all and the suite
  // stayed green through a mutation designed to redden it — the gate could not see the citation, so
  // it could not fail on it. Matching is liberal now, resolution is strict.
  it('sees a citation whose filename breaks the library naming convention', () => {
    const found = scanText('[x](./0009-self-hosted-fonts-RENAMED.md)', 'a.md');
    expect(found.map((c) => c.target)).toEqual(['0009-self-hosted-fonts-RENAMED.md']);
    expect(resolves(found[0], index)).toBe(false);
  });
});

describe('struckRanges', () => {
  it('covers a strikethrough that spans lines', () => {
    const text = 'a ~~struck\nover two lines~~ b';
    expect(struckRanges(text)).toEqual([[2, text.indexOf('~~ b') + 2]]);
  });

  // The miss that cost a false failure on the first live run, kept as a regression rather than as a
  // comment: `0043-…md` writes the literal mermaid fence `` `~~~` `` in prose, and counting that as an
  // opening delimiter swallowed an 8,573-character span — including a struck ADR pointer 8,000
  // characters later, which the gate then reported as a defect. One stray delimiter mis-classifies
  // everything after it.
  it('ignores a ~~ that is quoted as code, which would otherwise shift every pair after it', () => {
    const text = 'the fence `~~~` is prose. ~~really struck~~ tail';
    expect(struckRanges(text)).toEqual([[text.indexOf('~~really'), text.indexOf('~~ tail') + 2]]);
  });
});

describe('quotedRanges', () => {
  it('covers an inline code span and a fenced block', () => {
    const text = 'a `code` b\n\n```\nfenced\n```\n';
    const ranges = quotedRanges(text);
    expect(ranges.some(([a, b]) => a <= text.indexOf('code') && b >= text.indexOf('code'))).toBe(
      true,
    );
    expect(
      ranges.some(([a, b]) => a <= text.indexOf('fenced') && b >= text.indexOf('fenced')),
    ).toBe(true);
  });
});

describe('auditFiles', () => {
  // The three excuse lists exist to keep a declined failure VISIBLE. This proves each one actually
  // catches its own case and, critically, that nothing lands in more than one bucket or in none —
  // an unresolved citation that fell out of every list would be a silent pass.
  it('routes every unresolved citation into exactly one named list', () => {
    // The whole repo, not a fixture: this is the property that makes the four lists a partition
    // rather than four overlapping filters. An unresolved citation that fell into NO list would be a
    // silent pass, and one that fell into two would make `dangling` look smaller than it is.
    const index = libraryIndex(adrDir);
    const unresolved = audit.citations.filter((c) => !resolves(c, index));
    expect(unresolved.length).toBe(
      audit.dangling.length + audit.crossRepo.length + audit.struck.length + audit.quoted.length,
    );
    // …and the sum is not zero, or the equality above is 0 === 0. The struck ADR-0044 pointer in
    // `0043-…md` is what makes it non-vacuous today; if the library ever holds no unresolved citation
    // at all this reddens and the assertion has to be re-argued rather than quietly checking nothing.
    expect(unresolved.length).toBeGreaterThan(0);
  });

  it('scans a subset when given one, so the gate is usable on part of the tree', () => {
    const one = auditFiles(
      repoRoot,
      ['docs/adr/0043-harness-inventory-derived-from-plugin-repo.md'],
      adrDir,
    );
    expect(one.citations.length).toBeGreaterThan(0);
    expect(one.struck).toHaveLength(1);
    expect(one.dangling).toEqual([]);
  });

  it('reports a dangling citation with its file and line', () => {
    const text = 'nothing here is ADR-9999.';
    const cites = scanText(text, 'x.md');
    expect(resolves(cites[0], libraryIndex(adrDir))).toBe(false);
    expect(describeCitation(cites[0])).toBe('x.md:1 cites ADR-9999');
  });

  // The cross-repo excuse is narrow BY DESIGN: `-io` cites the plugin's methodology library with the
  // same spelling, and today those numbers collide with real local records so nothing fires. After a
  // fold they will not. The window is one clause, because a wide one turns any paragraph mentioning
  // the plugin into a blind spot.
  it('excuses a cross-repo citation but not a bare one further down the paragraph', () => {
    const index = libraryIndex(adrDir);
    const excused = scanText('per methodology ADR-9999 the loop merges.', 'x.md')[0];
    const notExcused = scanText(
      'The plugin does many things. A separate sentence cites ADR-9999.',
      'x.md',
    )[0];
    expect(resolves(excused, index)).toBe(false);
    expect(resolves(notExcused, index)).toBe(false);
    // Both fail to resolve; only the first carries the qualifier in its own clause.
    expect(/\b(?:methodology|skills|plugin'?s?|dev-loop)\b[^.!?\n]{0,40}$/i.test(excused.lead)).toBe(
      true,
    );
    expect(
      /\b(?:methodology|skills|plugin'?s?|dev-loop)\b[^.!?\n]{0,40}$/i.test(notExcused.lead),
    ).toBe(false);
  });
});

describe('selfCitations', () => {
  it('reports a record citing its own number, in either spelling', () => {
    const cites = [
      { kind: 'token', file: 'docs/adr/0007-tailwind-no-shadcn-own-components.md', target: '0007' },
      { kind: 'token', file: 'docs/adr/0007-tailwind-no-shadcn-own-components.md', target: '0008' },
      { kind: 'path', file: 'docs/adr/0007-tailwind-no-shadcn-own-components.md', target: '0007-x.md' },
      { kind: 'token', file: 'CLAUDE.md', target: '0007' },
    ];
    expect(selfCitations(cites).map((c) => c.target)).toEqual(['0007', '0007-x.md']);
  });
});
