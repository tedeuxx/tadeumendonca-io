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
 * The library's CURATED INDEX, as one URL (#387).
 *
 * The copy-as-markdown payload cannot carry the rendered table — the ` ```adr-index ` fence is EMPTY in
 * source, so a verbatim copy hands the reader three backticks and nothing — and it deliberately does not
 * reproduce 45 rows either. It links the index instead, which is the page's own stated principle applied
 * to itself.
 *
 * `README.md`, NOT the bare directory, and the reason is coherence rather than correctness — both
 * resolve. The body of `architecture.{pt,en}.md:300` ALREADY links the library, as `…/docs/adr/README.md`,
 * so a generated link one level out would put two destinations for one object inside a single copied
 * document — and the generated one would be a filename listing where the prose says "the decision
 * library". The README is also the closer stand-in for the `<AdrTable/>` it replaces: an index, not a
 * directory.
 *
 * Derived from `ADR_BASE` rather than typed again: the directory a row points INTO and the directory the
 * index LIVES IN are the same, and a second literal is a second thing to update on a repo move.
 */
export const ADR_INDEX_URL = `${ADR_BASE}/README.md`;

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

// A `supersededCount` helper lived here and has been removed. It had no consumer outside its own test,
// and its docstring justified itself as the number the prose needs — while the prose deliberately
// carries no number, because a count in copy with nothing keeping it true is the defect this slice was
// fixing. An export whose stated reason is contradicted by the file it points at is worse than an
// absent one: the next reader trusts the docstring.
