import { describe, it, expect } from 'vitest';
import { join, resolve } from 'node:path';
import { recordFiles } from './adr-source.mjs';
import { auditCapabilities, capabilityField, checkPartition, parseCapabilityTable } from './adr-capabilities.mjs';

const adrDir = join(resolve(import.meta.dirname, '..', '..', '..'), 'docs', 'adr');

// Built by concatenation on purpose. The citation gate scans every tracked file, this one included, and
// a literal record link to a made-up file would turn it red. Split this way, no line of this source
// contains a link-shaped string.
const link = (n) => '[' + n + '](./' + n + '-x.md)';
const table = (rows) =>
  [
    '## Capabilities',
    '',
    'prose',
    '',
    '| Capability | Anchor | Folds in | Not an ADR | Deactivation records | How |',
    '|---|---|---|---|---|---|',
    ...rows,
    '',
    '## Next',
    '| not | this | table |',
  ].join('\n');
const rec = (id, capability, status = 'accepted') => ({ id, status, capability, problem: null });

describe('the live library', () => {
  const audit = auditCapabilities(adrDir);

  // CALIBRATED ON THE SUBJECT before it was trusted (#456 S2): removing one record's Capability line,
  // changing one record's line to another row, and listing a record in a second row each turned this
  // red naming the record. Restoring each turned it green.
  it('has a capability table and record fields that agree, with every record in exactly one cell', () => {
    expect(audit.problems).toEqual([]);
  });

  // Guards the gate against passing vacuously. If the table parse returned nothing, every record would
  // be reported as sitting in no cell, so the list above would already be red. This pins the shape too.
  it('reads every record file and nine capability rows', () => {
    expect(audit.records).toHaveLength(recordFiles(adrDir).length);
    expect(audit.table.rows.map((r) => r.capability)).toEqual([
      'site-platform',
      'hosting-and-trust',
      'delivery-and-gates',
      'locale-and-routing',
      'design-system-and-figures',
      'publication-and-distribution',
      'presence-and-cv',
      'harness-self-description',
      'decision-library',
    ]);
    const placed = audit.table.rows.flatMap((r) => [...r.anchor, ...r.folds, ...r.notAdr, ...r.deactivation]);
    expect(placed.toSorted()).toEqual(audit.records.map((r) => r.id).toSorted());
  });
});

describe('capabilityField', () => {
  it('reads one backticked name', () => {
    expect(capabilityField('- **Status:** accepted\n- **Capability:** `site-platform`\n')).toEqual({
      capability: 'site-platform',
      problem: null,
    });
  });

  it('reports a record with no line', () => {
    expect(capabilityField('- **Status:** accepted\n').problem).toBe('has no Capability line');
  });

  it('reports a second line, even a malformed one', () => {
    expect(capabilityField('- **Capability:** `a`\n- **Capability:** b\n').problem).toBe(
      'has 2 Capability lines',
    );
  });

  it('refuses a bare name and a name with trailing text', () => {
    expect(capabilityField('- **Capability:** site-platform\n').problem).toMatch(/not one backticked/);
    expect(capabilityField('- **Capability:** `a` (anchor)\n').problem).toMatch(/not one backticked/);
  });
});

describe('parseCapabilityTable', () => {
  it('reads each record column and ignores the commentary column and later tables', () => {
    const t = parseCapabilityTable(
      table([`| \`a\` | ${link('0002')} | ${link('0004')} · ${link('0006')} | — | ${link('0025')} | 0099 here |`]),
    );
    expect(t.problems).toEqual([]);
    expect(t.rows).toEqual([
      { capability: 'a', anchor: ['0002'], folds: ['0004', '0006'], notAdr: [], deactivation: ['0025'] },
    ]);
  });

  it('fails on a number written bare in a record cell, instead of dropping it', () => {
    const t = parseCapabilityTable(table([`| \`a\` | ${link('0002')} | 0004 | — | — | |`]));
    expect(t.problems).toEqual(['a: the folds cell holds something that is not a record link']);
  });

  it('fails on a link whose text and target disagree', () => {
    const t = parseCapabilityTable(table(['| `a` | [0002](./' + '0003-x.md) | — | — | — | |']));
    expect(t.problems).toEqual(['a: a link reads 0002 but points at 0003']);
  });

  it('fails on a row with no backticked name', () => {
    const t = parseCapabilityTable(table([`| a | ${link('0002')} | — | — | — | |`]));
    expect(t.problems[0]).toMatch(/does not start with a backticked capability name/);
  });

  it('fails when the section or its rows are missing', () => {
    expect(parseCapabilityTable('# README\n').problems).toEqual([
      'the README has no "## Capabilities" section',
    ]);
    expect(parseCapabilityTable(table([])).problems).toEqual(['the capability table has no rows']);
  });
});

describe('checkPartition', () => {
  const t = parseCapabilityTable(
    table([
      `| \`a\` | ${link('0002')} | ${link('0004')} | — | ${link('0025')} | |`,
      `| \`b\` | ${link('0013')} | — | ${link('0046')} | — | |`,
    ]),
  );
  const good = [rec('0002', 'a'), rec('0004', 'a'), rec('0025', 'a', 'superseded'), rec('0013', 'b'), rec('0046', 'b')];

  it('passes when the fields and the table agree (the control for every case below)', () => {
    expect(checkPartition(good, t)).toEqual([]);
  });

  it('reports a field that names another row', () => {
    const records = good.map((r) => (r.id === '0004' ? rec('0004', 'b') : r));
    expect(checkPartition(records, t)).toEqual(['0004 says it is b, the table puts it in a']);
  });

  it('reports a record in no cell, and a cell naming a number with no file', () => {
    expect(checkPartition([...good, rec('0099', 'a')], t)).toEqual(['0099 sits in no cell of the capability table']);
    expect(checkPartition(good.filter((r) => r.id !== '0046'), t)).toEqual(['the table names 0046, which has no file']);
  });

  it('reports a record in two cells', () => {
    const dup = parseCapabilityTable(
      table([
        `| \`a\` | ${link('0002')} | ${link('0004')} | — | ${link('0025')} | |`,
        `| \`b\` | ${link('0013')} | ${link('0004')} | ${link('0046')} | — | |`,
      ]),
    );
    expect(checkPartition(good, dup)).toEqual(['0004 sits in 2 cells (a/folds, b/folds)']);
  });

  it('reports a row with no anchor or two, and a duplicated row', () => {
    const bad = parseCapabilityTable(
      table([
        `| \`a\` | ${link('0002')} · ${link('0004')} | — | — | ${link('0025')} | |`,
        `| \`b\` | — | ${link('0013')} | ${link('0046')} | — | |`,
        `| \`b\` | — | — | — | — | |`,
      ]),
    );
    expect(checkPartition(good, bad)).toEqual([
      'a has 2 anchors, not one',
      'b has 0 anchors, not one',
      'b has more than one row',
      'b has 0 anchors, not one',
    ]);
  });

  it('keeps the deactivation column and the superseded status in step, both ways', () => {
    const records = good.map((r) =>
      r.id === '0025' ? rec('0025', 'a', 'accepted') : r.id === '0004' ? rec('0004', 'a', 'superseded') : r,
    );
    expect(checkPartition(records, t)).toEqual([
      '0004 is superseded but sits in the folds column',
      '0025 is in the deactivation column but its status is accepted',
    ]);
  });

  it('carries a record field problem through, naming the record', () => {
    const records = good.map((r) => (r.id === '0013' ? { ...r, capability: null, problem: 'has no Capability line' } : r));
    expect(checkPartition(records, t)).toEqual(['0013 has no Capability line']);
  });
});
