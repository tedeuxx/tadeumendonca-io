// The capability gate for the decision library (#456, slice S2).
//
// WHAT THIS EXISTS FOR. The library is partitioned into one document per capability, and the partition
// lives in ONE place: the `## Capabilities` table in `docs/adr/README.md`. Every record repeats its
// own row in a `- **Capability:**` line, so a fresh context that opens one record knows which document
// it belongs to without opening the index. Two copies of one fact drift unless something compares
// them. This module compares them, both ways, and the live assertion is one call in
// `adr-capabilities.test.mjs`.
//
// WHAT IT CANNOT SAY. It checks that the table and the fields agree, that every record sits in exactly
// one cell, and that the deactivation column holds exactly the `superseded` records. It cannot say a
// record is in the RIGHT capability. That is a reading of what the record decides, and the fold slice
// that moves the record is where it is done.
//
// Split the same way as `adr-source.mjs` and `adr-citations.mjs`: everything that DECIDES is pure and
// takes text, so the failure cases are unit-testable without fixtures on disk.
import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parseRecord, recordFiles } from './adr-source.mjs';

/** Any line that claims to be the field, well-formed or not, so a malformed second copy still counts. */
const FIELD_ANY = /^-\s*\*\*Capability:\*\*.*$/gm;
/** The one accepted shape: a single backticked kebab-case name and nothing after it. */
const FIELD_VALUE = /^-\s*\*\*Capability:\*\*\s*`([a-z0-9-]+)`\s*$/;

/**
 * One record's capability, or why it has none.
 *
 * Returns rather than throws: the gate reports every problem in the library in one run, and a throw on
 * the first bad record would hide the rest.
 */
export function capabilityField(text) {
  const lines = text.match(FIELD_ANY) ?? [];
  if (lines.length === 0) return { capability: null, problem: 'has no Capability line' };
  if (lines.length > 1) return { capability: null, problem: `has ${lines.length} Capability lines` };
  const m = FIELD_VALUE.exec(lines[0]);
  if (!m) return { capability: null, problem: 'has a Capability line that is not one backticked name' };
  return { capability: m[1], problem: null };
}

export const TABLE_HEADING = /^## Capabilities\b/;

/**
 * The record columns, in table order. The first column is the capability name; a sixth column, if
 * present, is commentary and is never read, so prose there cannot be mistaken for a member.
 */
export const RECORD_COLUMNS = ['anchor', 'folds', 'notAdr', 'deactivation'];

/** `[NNNN](./NNNN-name.md)`: the link text and the file it points at must carry the same number. */
const CELL_LINK = /\[(\d{4})\]\(\.\/(\d{4})-[^)\s]*\.md\)/g;
/** What a record cell may hold besides its links: separators and the empty mark. */
const CELL_FILLER = /^[\s·—]*$/;

/**
 * The capability table, read from the README's text.
 *
 * Fails CLOSED on its own shape. A cell that carries anything besides record links is a problem rather
 * than ignored text, because a number written bare, or a link whose text and target disagree, would
 * otherwise drop a record out of the partition silently. That is the one direction this gate must
 * never fail in.
 */
export function parseCapabilityTable(readme) {
  const lines = readme.split('\n');
  const start = lines.findIndex((l) => TABLE_HEADING.test(l));
  if (start === -1) return { rows: [], problems: ['the README has no "## Capabilities" section'] };

  const section = [];
  for (const l of lines.slice(start + 1)) {
    if (/^## /.test(l)) break;
    section.push(l);
  }
  // The first table in the section is the partition; a header row and its separator come first.
  const table = section.slice(section.findIndex((l) => l.startsWith('|')));
  const body = [];
  for (const l of table) {
    if (!l.startsWith('|')) break;
    body.push(l);
  }

  const rows = [];
  const problems = [];
  for (const raw of body.slice(2)) {
    const cells = raw.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
    const name = /^`([a-z0-9-]+)`$/.exec(cells[0] ?? '');
    if (!name) {
      problems.push(`a table row does not start with a backticked capability name: ${raw.slice(0, 60)}`);
      continue;
    }
    const row = { capability: name[1] };
    RECORD_COLUMNS.forEach((col, i) => {
      const cell = cells[i + 1] ?? '';
      const ids = [];
      for (const m of cell.matchAll(CELL_LINK)) {
        if (m[1] !== m[2]) problems.push(`${name[1]}: a link reads ${m[1]} but points at ${m[2]}`);
        ids.push(m[2]);
      }
      if (!CELL_FILLER.test(cell.replace(CELL_LINK, ''))) {
        problems.push(`${name[1]}: the ${col} cell holds something that is not a record link`);
      }
      row[col] = ids;
    });
    rows.push(row);
  }
  if (rows.length === 0 && problems.length === 0) problems.push('the capability table has no rows');
  return { rows, problems };
}

/**
 * The table against the records, both ways.
 *
 * `records` is `{ id, status, capability, problem }` per file on disk. Every problem is a sentence a
 * person can act on without opening this module.
 */
export function checkPartition(records, table) {
  const problems = [...table.problems];
  const byId = new Map(records.map((r) => [r.id, r]));

  // Where the table puts each number: every (row, column) it appears in.
  const placed = new Map();
  const seenRows = new Set();
  for (const row of table.rows) {
    if (seenRows.has(row.capability)) problems.push(`${row.capability} has more than one row`);
    seenRows.add(row.capability);
    if (row.anchor.length !== 1) {
      problems.push(`${row.capability} has ${row.anchor.length} anchors, not one`);
    }
    for (const col of RECORD_COLUMNS) {
      for (const id of row[col]) {
        if (!placed.has(id)) placed.set(id, []);
        placed.get(id).push({ capability: row.capability, col });
      }
    }
  }

  for (const [id, cells] of placed) {
    if (!byId.has(id)) problems.push(`the table names ${id}, which has no file`);
    if (cells.length > 1) {
      const where = cells.map((c) => `${c.capability}/${c.col}`).join(', ');
      problems.push(`${id} sits in ${cells.length} cells (${where})`);
    }
  }

  for (const r of records) {
    if (r.problem) {
      problems.push(`${r.id} ${r.problem}`);
    }
    const cells = placed.get(r.id);
    if (!cells) {
      problems.push(`${r.id} sits in no cell of the capability table`);
      continue;
    }
    const [cell] = cells;
    if (r.capability && r.capability !== cell.capability) {
      problems.push(`${r.id} says it is ${r.capability}, the table puts it in ${cell.capability}`);
    }
    const superseded = r.status === 'superseded';
    if (cell.col === 'deactivation' && !superseded) {
      problems.push(`${r.id} is in the deactivation column but its status is ${r.status}`);
    }
    if (cell.col !== 'deactivation' && superseded) {
      problems.push(`${r.id} is superseded but sits in the ${cell.col} column`);
    }
  }
  return problems;
}

/** The live library, in one call: the README's table against every record file on disk. */
export function auditCapabilities(adrDir) {
  const table = parseCapabilityTable(readFileSync(join(adrDir, 'README.md'), 'utf8'));
  const records = recordFiles(adrDir).map((file) => {
    const { id, status } = parseRecord(file);
    return { id, file: basename(file), status, ...capabilityField(readFileSync(file, 'utf8')) };
  });
  return { table, records, problems: checkPartition(records, table) };
}
