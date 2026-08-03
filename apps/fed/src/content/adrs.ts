// The build-time compiled ADR index (#318).
//
// Same shape as diagrams.ts: an artifact generated from authored source, committed, and pinned by a
// Node-side test (scripts/adr-source.test.mjs) rather than re-derived in the browser. The page LINKS
// canonical detail instead of restating it, and this is the one list where "link" means "reproduce the
// index" — so it is reproduced by a machine reading the same directory the links point at.
import generated from './generated/adrs.json';

/** `amended` is a separate bit rather than a fifth status, because a decision that was accepted and has
 *  since been revised is a different thing to a reader choosing what to open. See adr-source.mjs. */
export type AdrStatus = 'accepted' | 'superseded' | 'proposed' | 'rejected';

export interface AdrRecord {
  id: string;
  title: string;
  file: string;
  status: AdrStatus;
  amended: boolean;
}

const records = generated as AdrRecord[];

/** The repo the records live in. Absolute because the table's whole purpose is to leave the page for the
 *  canonical document, and a relative href would resolve against the site. */
const ADR_BASE = 'https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr';

export const adrHref = (record: AdrRecord): string => `${ADR_BASE}/${record.file}`;

/**
 * Every record, id-ascending.
 *
 * Ordering is fixed here rather than left to the artifact, even though the generator also sorts. Two
 * cheap guarantees in different places is not duplication when one of them is a file a human can edit:
 * the artifact is committed, so a hand-edit or a bad merge can reorder it, and a reader would see a
 * shuffled index with nothing failing.
 */
export const adrRecords = (): AdrRecord[] =>
  [...records].sort((a, b) => a.id.localeCompare(b.id));

/**
 * How many decisions were superseded — the count the prose beside this table needs.
 *
 * Exported rather than written into the copy, because the copy already carried a hand-typed "five
 * reversals" that the library outgrew: there are eight superseded records today. A number in prose with
 * nothing keeping it true is the exact defect class this page has now been bitten by twice, and the fix
 * is not a more careful writer.
 */
export const supersededCount = (): number =>
  records.filter((r) => r.status === 'superseded').length;
