// Writes one committed delivery-economics snapshot (#691, ADR-0055). A thin shell around
// economics-source.mjs, which holds every decision this script makes.
//
// Run, on the owner's machine, after a period has closed:
//
//   npm --prefix apps/fed run gen-economics -- --period 2026-10 \
//     --export <worklog-export.json> --attestation <issue-691-capture.json> --refused <ref,ref,...>
//
//   --export       the stdout of `worklog.py export`, composed from `gh issue view <n> --repo <r> --json
//                  url,comments` captures of every Issue in the allowlisted public repositories updated on or
//                  after the period's first day;
//   --attestation  the stdout of `gh issue view 691 --repo tedeuxx/tadeumendonca-io --json url,comments`;
//   --refused      the Issues whose capture the export refused, comma-separated (empty when none).
//
// Every input file is a saved capture in the session scratchpad, never a repository path.
//
// THE BUILD AND CI NEVER RUN THIS. `npm run build` reads the committed snapshot and nothing else (ADR-0002), so
// there is no drift check either: a period, once final, is immutable, and this script refuses to overwrite one.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { ProducerError, buildSnapshot, isFinal, serialize } from './economics-source.mjs';

const FED = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT_DIR = join(FED, 'src', 'content', 'generated', 'economics');

const { values } = parseArgs({
  options: {
    period: { type: 'string' },
    export: { type: 'string' },
    attestation: { type: 'string' },
    refused: { type: 'string', default: '' },
  },
});

try {
  if (!values.period || !values.export || !values.attestation) {
    throw new ProducerError('usage: gen-economics -- --period YYYY-MM --export <file> --attestation <file> [--refused <refs>]');
  }
  const exportText = readFileSync(values.export, 'utf8');
  const snapshot = buildSnapshot({
    periodId: values.period,
    exportData: JSON.parse(exportText),
    exportText,
    attestationCapture: JSON.parse(readFileSync(values.attestation, 'utf8')),
    refused: values.refused.split(',').filter(Boolean),
  });
  const out = join(OUT_DIR, `${snapshot.period.id}.json`);
  if (existsSync(out) && isFinal(JSON.parse(readFileSync(out, 'utf8')))) {
    throw new ProducerError(`${snapshot.period.id} is final; a published period is not rewritten`);
  }
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(out, serialize(snapshot));
  const pending = snapshot.providers.filter((card) => card.spend.state === 'pending-attestation').map((c) => c.provider);
  console.log(`Wrote src/content/generated/economics/${snapshot.period.id}.json.`);
  console.log(pending.length ? `Spend pending attestation: ${pending.join(', ')}.` : 'Every provider is attested; the period is final.');
} catch (error) {
  console.error(error instanceof ProducerError ? `gen-economics: ${error.message}` : error);
  process.exit(1);
}
