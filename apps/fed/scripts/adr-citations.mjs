// The citation gate for the decision library (#456).
//
// WHAT THIS EXISTS FOR. `adr-source.mjs` reads each record for what it says about ITSELF — number,
// title, status, amendment — and `architecture-links.test.ts` resolves the `docs/` links the two
// `/architecture` editions publish. Between those two there was nothing: **no check anywhere
// tokenized a citation from one record to another, or from application code to a record.** Measured
// before this file existed:
//
//   grep -rn -i "lychee\|markdown-link\|link-check" .github/workflows apps/fed/package.json   -> (nothing)
//
// So a record could be renamed or removed and 1,205 intra-library citations plus 373 citations from
// 116 files elsewhere in the repo would go on pointing at it, silently, with every gate green. That
// is the failure this module makes loud.
//
// WHY IT IS SPLIT the way it is: same split as `adr-source.mjs` / `gen-adrs.mjs` and
// `harness-source.mjs` / `check-harness-drift.mjs` — everything that DECIDES lives here, pure and
// unit-testable; the live assertion over the real tree is one call in `adr-citations.test.mjs`.
//
// NOT BUILT YET, deliberately: the `row 00N must not cite ADR-00N` arm — a record citing itself,
// which is what a cross-record citation BECOMES once its target is folded into it. That arm has
// nothing to catch until a fold has happened (nothing is folded in this repo today), and an arm with
// no possible subject is an assertion that cannot fail. **It comes with the first fold slice**, and
// `selfCitations()` below is the seam it hangs on — already computed, already reported, not yet
// promoted to a failure.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { recordFiles } from './adr-source.mjs';

/**
 * The two citation spellings, and why BOTH are matched.
 *
 * The sister job in `tadeumendonca-skills` found citation defects that one spelling missed and the
 * other caught, which is the whole argument for not picking one: `ADR-0034` is how prose names a
 * decision, `](./0034-build-time-cv-pdf-static-artifact.md)` is how a record links its neighbour, and
 * they fail differently. A number citation survives a RENAME (the number is still right) and dies on
 * a REMOVAL. A path citation dies on both — it carries the filename, so a record renamed without its
 * citations updated is a 404 that the number form cannot see.
 */
const TOKEN_RE = /ADR-(\d{4})/g;

/**
 * `](./NNNN-….md)` — the intra-library form, relative because both files sit in `docs/adr/`.
 *
 * The character class is DELIBERATELY wider than this library's own kebab-case convention, and that
 * width was earned by a mutation rather than reasoned in: the first planted path-form citation used
 * `./0009-self-hosted-fonts-RENAMED.md` and the suite stayed GREEN, because `[a-z0-9-]` does not
 * match an uppercase letter and the regex therefore found no citation at all. **A gate that cannot
 * see a citation cannot fail on it**, so the match side is liberal and the resolve side is strict:
 * anything shaped like a record filename is a claim to be checked, and only a real file satisfies it.
 * The record set itself is still `adr-source.mjs`'s strict `^(\d{4})-[a-z0-9-]+\.md$`, so a
 * mis-cased citation now fails loudly instead of being silently skipped.
 */
const RELATIVE_PATH_RE = /\]\(\.\/(\d{4}-[A-Za-z0-9._-]+\.md)/g;

/**
 * `docs/adr/NNNN-….md` anywhere — the form used from OUTSIDE the library, and deliberately not
 * anchored to markdown-link syntax. It appears inside a markdown link in `architecture.{en,pt}.md`,
 * inside a `](./docs/adr/…)` link in `CLAUDE.md`, and as a bare string literal in TypeScript. Keying
 * on `](` would have covered the first two and missed the third.
 */
const DOCS_PATH_RE = /docs\/adr\/(\d{4}-[A-Za-z0-9._-]+\.md)/g;

/**
 * A citation that names ANOTHER repository's library, which this repo cannot resolve and must not
 * claim to.
 *
 * `-io` cites the `tadeumendonca-skills` methodology library by the same `ADR-NNNN` spelling —
 * "per methodology ADR-0004", "skills ADR-0002", "the plugin's own ADR-0002". Today those numbers
 * happen to collide with real local records, so they resolve by accident and nothing fires. **After
 * any fold they will not**, and a gate that reddens on a correct cross-repo citation is a gate
 * someone deletes.
 *
 * Read from the text BEFORE the token, within one clause (`[^.!?\n]`) and a short window, rather
 * than from the whole line: a wide window turns any paragraph that mentions the plugin into a blind
 * spot, and a blind spot in a gate is worse than a false positive in one. The consulted lead text is
 * kept on every citation so `crossRepo` can be REPORTED rather than silently dropped — see
 * `auditFiles`.
 *
 * This is consulted ONLY for a token that already failed to resolve locally, so widening it can never
 * suppress a citation that was going to pass; it can only suppress a failure, which is why the
 * suppressed set is printed rather than discarded.
 */
const CROSS_REPO_RE = /\b(?:methodology|skills|plugin'?s?|dev-loop)\b[^.!?\n]{0,40}$/i;

/** How much text before a token `CROSS_REPO_RE` may look at. */
const LEAD_WINDOW = 80;

/**
 * A citation inside a `~~struck~~` span is HISTORY, not a live claim.
 *
 * This repo's convention is supersede-never-rewrite: a reversed statement is struck and left in
 * place, because the reader who took a decision from the old text deserves to find out it changed
 * rather than to find it silently gone. `CLAUDE.md` and the library both do this constantly. The
 * first live run of this gate reddened on
 * `0043-harness-inventory-derived-from-plugin-repo.md:1287`, a struck link whose own struck text
 * says *"that record was never written"* — i.e. the gate was arguing with the repo's convention and
 * the convention was right. A gate that fires on correct authoring gets switched off, so the
 * convention is encoded rather than fought.
 *
 * Sequential pairing of `~~` delimiters, which is what a markdown renderer does, and the span may
 * cross lines — the ADR-0043 case spans four. Struck citations are REPORTED, not discarded: a
 * strikethrough is the one place a dead citation is allowed to live, and a silent allowance is how a
 * gate stops covering what it claims to.
 */
export function struckRanges(text, quoted = quotedRanges(text)) {
  // `~~` inside a code span is not a delimiter, and skipping this cost a real miss rather than a
  // theoretical one: `0043-…md` writes the literal mermaid fence `` `~~~` `` in prose at offset
  // 91329, and pairing that as an opening delimiter swallowed an 8,573-character span — including
  // the struck ADR-0044 pointer 8,000 characters later, which the gate then reported as a defect.
  // One stray delimiter mis-classifies everything after it, which is why this filter is not optional.
  const marks = [...text.matchAll(/~~/g)]
    .map((m) => m.index)
    .filter((i) => !within(quoted, i + 1));
  const ranges = [];
  for (let i = 0; i + 1 < marks.length; i += 2) ranges.push([marks[i], marks[i + 1] + 2]);
  return ranges;
}

/**
 * A path inside a CODE SPAN is a quoted string, not a link — and this library quotes dead paths
 * constantly, on purpose.
 *
 * `0043-harness-inventory-derived-from-plugin-repo.md` spends an entire amendment documenting that
 * `./0044-committed-permission-floor-local-overlay-ephemeral.md` **never existed**, quoting the
 * filename in backticks so a reader can see exactly what the struck pointer said. That is the
 * supersede-never-rewrite convention working as intended, and the first live run of this gate called
 * it a defect. It is not one: a code span renders as literal text, so a reader cannot click it and it
 * cannot 404.
 *
 * *The cost, named rather than hidden:* a genuinely broken path a writer INTENDED as a pointer, but
 * wrote in backticks, is not fatal here. That is why quoted citations are returned as their own list
 * and printed by the caller instead of being dropped — the gate reports every citation it declined
 * to fail on, so the excuse is auditable rather than invisible. The alternative (failing on quoted
 * paths) would redden this library on its own convention, and a gate that fires on correct authoring
 * is a gate someone turns off.
 *
 * Fenced blocks first, then inline spans: a fence contains backticks, so scanning inline spans over
 * un-fenced text keeps the two from interleaving.
 */
export function quotedRanges(text) {
  const fenced = [...text.matchAll(/^ {0,3}(`{3,}|~{3,})[\s\S]*?^ {0,3}\1/gm)].map((m) => [
    m.index,
    m.index + m[0].length,
  ]);
  const inFence = (i) => fenced.some(([a, b]) => i >= a && i < b);
  const inline = [...text.matchAll(/(`+)[^\n]*?\1/g)]
    .filter((m) => !inFence(m.index))
    .map((m) => [m.index, m.index + m[0].length]);
  return [...fenced, ...inline];
}

const within = (ranges, index) => ranges.some(([open, close]) => index > open && index < close);

/**
 * The instrument's own files, excluded from the scan.
 *
 * They hold deliberately-dangling citations as FIXTURES — that is what makes the unit tests below
 * able to fail — so scanning them would make the gate red on its own test data. Stated as an explicit
 * two-entry set rather than a pattern: a pattern would quietly grow, and this exclusion is the one
 * place a real dangling citation could hide. A rename of either file does not widen the hole, it
 * closes it loudly — the renamed file is scanned, its fixtures do not resolve, and the gate goes red.
 */
export const SELF_EXCLUDED = [
  'apps/fed/scripts/adr-citations.mjs',
  'apps/fed/scripts/adr-citations.test.mjs',
];

/** Extensions with no text to scan. Kept as a denylist, so a new text extension is scanned by default. */
const BINARY_RE = /\.(?:png|jpe?g|gif|ico|webp|avif|woff2?|ttf|otf|eot|pdf|mp4|webm|zip)$/i;

/**
 * The files to scan, from `git ls-files` rather than a directory walk.
 *
 * The walk was the first version and it was wrong: `node_modules/`, `dist/` and `coverage/` all exist
 * on a developer's disk and none of them is this repo's own text. A skip-list would have to be
 * maintained against every future build output, and the day it misses one the gate starts reporting
 * citations nobody wrote. `git ls-files` IS the definition of "this repository's own files", it needs
 * no maintenance, and it is identical in CI and locally.
 */
export function trackedTextFiles(repoRoot) {
  const out = execFileSync('git', ['-C', repoRoot, 'ls-files', '-z'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return out
    .split('\0')
    .filter(Boolean)
    .filter((p) => !BINARY_RE.test(p))
    .filter((p) => !SELF_EXCLUDED.includes(p));
}

const lineOf = (text, index) => text.slice(0, index).split('\n').length;

/**
 * Every citation in one file's text, in both spellings.
 *
 * `kind` is what the citation NAMES — a number or a filename — and it is what decides how the
 * citation resolves, so it is carried rather than re-derived at the resolution site.
 */
export function scanText(text, file) {
  const found = [];

  // BOTH excuses are MARKDOWN RENDERING conventions, so they are only consulted for markdown, and
  // this restriction closes a hole in the gate that a measurement found rather than a reading.
  // `~~` and `` ` `` are ordinary characters in JSON, TypeScript and HCL — `struckRanges` pairs them
  // sequentially, so an artifact that merely CONTAINS tildes manufactures a span out of nothing.
  // Measured at this head: `src/content/generated/diagrams.json` produced a single bogus "struck"
  // range **211,935 characters** wide, covering essentially the whole file. Any dangling citation
  // inside it would have been silently excused — a false negative in the one direction a gate must
  // never fail. A backtick in a `.ts` file is a template literal, not a code span, and a path inside
  // one is still a real string worth resolving.
  const isMarkdown = /\.md$/i.test(file);
  // Computed once and threaded into `struckRanges`, which otherwise recomputes it as a default
  // argument — this runs over every tracked file in the repo, so scanning each one's code spans twice
  // is the difference between one pass and two over the whole tree.
  const quoted = isMarkdown ? quotedRanges(text) : [];
  const struck = isMarkdown ? struckRanges(text, quoted) : [];
  const push = (kind, match, target) =>
    found.push({
      kind,
      file,
      target,
      line: lineOf(text, match.index),
      lead: text.slice(Math.max(0, match.index - LEAD_WINDOW), match.index),
      struck: within(struck, match.index),
      quoted: within(quoted, match.index),
    });

  for (const m of text.matchAll(TOKEN_RE)) push('token', m, m[1]);
  for (const m of text.matchAll(RELATIVE_PATH_RE)) push('path', m, m[1]);
  for (const m of text.matchAll(DOCS_PATH_RE)) push('path', m, m[1]);
  return found;
}

/** Whether one citation names a record that exists — by number for a token, by filename for a path. */
export function resolves(citation, { numbers, filenames }) {
  return citation.kind === 'token' ? numbers.has(citation.target) : filenames.has(citation.target);
}

/** The record set a citation is resolved against, derived from the directory rather than declared. */
export function libraryIndex(adrDir) {
  const files = recordFiles(adrDir).map((f) => basename(f));
  return { numbers: new Set(files.map((f) => f.slice(0, 4))), filenames: new Set(files) };
}

/**
 * The seam the fold arm hangs on — a record citing ITSELF.
 *
 * Absorption turns a citation between two records into a citation inside one, and that is invisible
 * to every dangling-link check ever written, because the target still exists. It is the defect class
 * the sister job manufactured and then had to go back for. Computed and reported now so the arm is a
 * one-line promotion in the first fold slice rather than a new instrument; **not a failure yet**,
 * because nothing in this repo is folded and an assertion with no possible subject cannot fail.
 */
export function selfCitations(citations) {
  return citations.filter((c) => {
    const source = /^docs\/adr\/(\d{4})-/.exec(c.file);
    if (!source) return false;
    const target = c.kind === 'token' ? c.target : c.target.slice(0, 4);
    return source[1] === target;
  });
}

/**
 * The gate itself: every citation in the repo, and the ones that name nothing.
 *
 * Returns rather than throws, so the caller decides what is fatal — the unit tests need to inspect
 * `crossRepo` and `selfCitations` without the call having already exited.
 */
export function auditFiles(repoRoot, files, adrDir) {
  const index = libraryIndex(adrDir);

  const citations = files.flatMap((rel) => {
    let text;
    try {
      text = readFileSync(join(repoRoot, rel), 'utf8');
    } catch {
      return []; // a tracked path that is not readable text — nothing to cite from
    }
    return scanText(text, rel);
  });

  // Order matters and is the argument, not an implementation detail: a citation is only ever EXCUSED
  // after it has failed to resolve, and each excuse is returned as its own list. Nothing is dropped
  // on the floor — `dangling` is what is left once both excuses have been named, so widening an
  // excuse moves citations between reported lists rather than out of the report.
  const unresolved = citations.filter((c) => !resolves(c, index));
  const isCrossRepo = (c) => c.kind === 'token' && CROSS_REPO_RE.test(c.lead);
  const excused = (c) => isCrossRepo(c) || c.struck || c.quoted;

  return {
    citations,
    // What is left once every excuse has been named. This is the only fatal list.
    dangling: unresolved.filter((c) => !excused(c)),
    crossRepo: unresolved.filter(isCrossRepo),
    struck: unresolved.filter((c) => c.struck && !isCrossRepo(c)),
    quoted: unresolved.filter((c) => c.quoted && !c.struck && !isCrossRepo(c)),
    selfCitations: selfCitations(citations),
  };
}

/** The whole repo, in one call — what both the test and any future runner want. */
export function auditRepo(repoRoot, adrDir) {
  return auditFiles(repoRoot, trackedTextFiles(repoRoot), adrDir);
}

/** One citation, rendered for a failure message that a person can act on without opening the module. */
export const describeCitation = (c) =>
  `${c.file}:${c.line} cites ${c.kind === 'token' ? `ADR-${c.target}` : c.target}`;
