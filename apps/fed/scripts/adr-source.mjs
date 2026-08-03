// The pure half of the ADR-index pipeline (#318): find the decision records, read what each one says
// about itself, and decide whether the committed artifact still matches them.
//
// Split from gen-adrs.mjs for the same reason diagram-source.mjs is split from gen-diagrams.mjs: the
// generator writes a file, which is a side effect; everything that DECIDES what the index contains is
// logic, and lives here where it is testable without touching disk beyond a read.
//
// WHY THIS IS GENERATED AND NOT TYPED BY HAND. `/architecture` is an orientation layer — it LINKS
// canonical detail rather than restating it, which is what keeps it drift-safe. A hand-copied ADR table
// would be a fourth copy of a list that has already drifted once in this repo. Generated, an ADR added,
// retired or re-statused either updates the page or breaks the build. Hand-copied, it is stale within a
// week and nothing says so.
import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

/** `NNNN-kebab-title.md`, and nothing else in the directory (README.md, template.md are not records). */
const RECORD = /^(\d{4})-[a-z0-9-]+\.md$/;

export function recordFiles(adrDir) {
  return readdirSync(adrDir)
    .filter((f) => RECORD.test(f))
    .sort()
    .map((f) => join(adrDir, f));
}

/**
 * The STATUS CLASS, not the status prose.
 *
 * The prose is unbounded and it drifts by design — this library carries statuses like
 * "accepted · **amended 2026-08-01** (`share-sheet` loses its only emitter when #314 unifies…)" and
 * "superseded by [ADR-0004](./0004-…) (2026-07)". Rendering that verbatim into a table column produces
 * a column that is unreadable at a glance, which defeats the point of an index.
 *
 * So the class is the first word, and it is matched against a CLOSED set. An unrecognised status is an
 * error rather than a passthrough: this repo's ADR practice has four states, and a fifth appearing is
 * either a typo or a change to the practice — both of which someone should hear about, and neither of
 * which should silently become a table cell.
 *
 * `amended` is kept as a separate flag rather than folded into the class, because "accepted" and
 * "accepted, and revised since" are materially different things for a reader deciding what to open, and
 * collapsing them loses the one bit that says this decision has moved.
 */
const CLASSES = ['accepted', 'superseded', 'proposed', 'rejected'];

export function parseStatus(line) {
  const raw = line.replace(/^-\s*\*\*Status:\*\*\s*/, '').trim();
  const cls = CLASSES.find((c) => raw.toLowerCase().startsWith(c));
  if (!cls) throw new Error(`unrecognised ADR status class: "${raw.slice(0, 60)}"`);
  return { status: cls, statusLineAmended: /\bamended\b/i.test(raw) };
}

/**
 * Whether the record carries an amendment — read from the BODY, not only from the Status line.
 *
 * The first version read the Status line alone, and that was wrong for most of the library. Three
 * records mention an amendment in their status; **ten more carry `## Amendment` sections and would have
 * published as plain "accepted"**. So the one bit whose stated purpose is *this decision has moved* was
 * false for the majority of decisions that had moved — a derived value with nothing keeping it true,
 * which is the defect class this repo keeps paying for. Found by `quality-assurance`, falsified against
 * `0003-trunk-based-single-environment.md` and its five amendment headings.
 *
 * A heading, not a word search: `\bamended\b` anywhere in a body would fire on any ADR that *discusses*
 * amending something, and several do. The convention in this library is an `## Amendment` heading, so
 * that is what is matched — and if a record ever amends without one, this under-reports rather than
 * over-reports, which is the safer direction for a claim about someone else's document.
 */
export function hasAmendment(text, statusLineAmended) {
  return statusLineAmended || /^#{2,3}\s*Amendment\b/im.test(text);
}

/**
 * One record's index entry.
 *
 * The number and title come from the H1 — what the document says about ITSELF — while the href comes
 * from the filename, which is what actually resolves on GitHub. Those two can disagree, and this asserts
 * they do not: a file renamed without its heading (or vice versa) is a real inconsistency in the
 * library, and this is the only place in the repo positioned to notice it.
 */
export function parseRecord(file) {
  const text = readFileSync(file, 'utf8');
  const name = basename(file);

  const heading = /^#\s*(\d{4})\.\s*(.+?)\s*$/m.exec(text);
  if (!heading) throw new Error(`${name}: no "# NNNN. Title" heading`);

  const [, headingId, title] = heading;
  const fileId = RECORD.exec(name)[1];
  if (headingId !== fileId) {
    throw new Error(`${name}: heading says ${headingId}, filename says ${fileId}`);
  }

  const statusLine = /^-\s*\*\*Status:\*\*.*$/m.exec(text);
  if (!statusLine) throw new Error(`${name}: no Status line`);

  const { status, statusLineAmended } = parseStatus(statusLine[0]);
  return { id: fileId, title, file: name, status, amended: hasAmendment(text, statusLineAmended) };
}

export function collectRecords(adrDir) {
  return recordFiles(adrDir).map(parseRecord);
}

/**
 * Compare the authored records against the committed artifact, BOTH ways and field by field.
 *
 * Both directions, for the reasons diagram-source.mjs already learned. `missing` is the staleness case —
 * an ADR was added or re-statused and nobody regenerated, so the page publishes a decision library that
 * is not the one in the repo. On a page whose entire thesis is that its claims are checkable, a stale
 * index is worse than no index. `orphaned` is the accumulation case — nothing renders wrong, which is
 * exactly why it is never noticed.
 *
 * `changed` is the third case and the one a set comparison alone would miss: the same ADR present on
 * both sides with a different status. That is the MOST likely drift here, because re-statusing an ADR
 * edits a line rather than adding or removing a file.
 */
export function diffAgainstArtifact(records, artifact) {
  const committed = new Map(artifact.map((r) => [r.id, r]));
  const authored = new Set(records.map((r) => r.id));

  return {
    missing: records.filter((r) => !committed.has(r.id)),
    orphaned: artifact.filter((r) => !authored.has(r.id)),
    // `file` is compared too, and its omission was found by BOTH gatekeepers independently. It is the
    // href: a hand-edit or a bad merge to a filename in the committed artifact left every assertion
    // green and published a row that 404s. The header called this comparison "field by field" while
    // skipping the one field a reader clicks — the same shape as every other defect this week, where
    // the check did not cover the field that mattered.
    changed: records.filter((r) => {
      const c = committed.get(r.id);
      return (
        c &&
        (c.title !== r.title ||
          c.status !== r.status ||
          c.amended !== r.amended ||
          c.file !== r.file)
      );
    }),
  };
}
