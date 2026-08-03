// Writes the committed ADR index artifact. A thin shell around adr-source.mjs, which holds every
// decision this script makes — see the header there for why the index is generated at all.
//
// Run: npm run gen-adrs (from apps/fed)
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { collectRecords } from './adr-source.mjs';

const FED = dirname(dirname(fileURLToPath(import.meta.url)));
const ADR_DIR = join(FED, '..', '..', 'docs', 'adr');
const OUT = join(FED, 'src', 'content', 'generated', 'adrs.json');

const records = collectRecords(ADR_DIR);

// Sorted by id, and stated rather than left to readdir: the artifact is committed and reviewed as a
// diff, so a stable order is what makes "one ADR was re-statused" a one-line change instead of a
// reshuffle nobody can read.
records.sort((a, b) => a.id.localeCompare(b.id));

writeFileSync(OUT, `${JSON.stringify(records, null, 2)}\n`);
console.log(`Wrote src/content/generated/adrs.json with ${records.length} record(s).`);
