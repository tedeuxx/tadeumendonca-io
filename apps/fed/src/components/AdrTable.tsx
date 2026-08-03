// The decision index on /architecture, compiled from `docs/adr/` at build time (#318).
//
// WHY A COMPONENT AND NOT A MARKDOWN TABLE. The page's own principle is that it LINKS canonical detail
// rather than restating it — that is what keeps it drift-safe. An index is the one case where linking
// means reproducing a list, so the list is reproduced by a machine reading the same directory the links
// point at. A hand-typed table would be a fourth copy of something that has already drifted once here,
// and the page's whole thesis is that its claims are checkable.
//
// The staleness guard is in Node (scripts/adr-source.test.mjs), not here: it compares the committed
// artifact against the library and fails the build on a missing, orphaned or re-statused record. This
// component only renders what that guard has already vouched for.
import { adrHref, adrRecords, type AdrRecord } from '../content/adrs';
import { useLocale } from '../i18n';

export function AdrTable() {
  const { t } = useLocale();
  const records = adrRecords();

  const label = (record: AdrRecord) => {
    const base = t(`adrTable.${record.status}`);
    return record.amended ? `${base} · ${t('adrTable.amended')}` : base;
  };

  return (
    // Scrolls INSIDE its own box. The page body must never scroll sideways — the 320px sweep asserts
    // that, and a 41-row table with a long title column is the first thing that would break it.
    <div className="my-8 overflow-x-auto border border-border">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="border-b border-border p-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {t('adrTable.caption')}
        </caption>
        <thead>
          <tr className="border-b border-border font-mono text-xs uppercase tracking-wider">
            <th scope="col" className="p-3">
              {t('adrTable.colId')}
            </th>
            <th scope="col" className="p-3">
              {t('adrTable.colTitle')}
            </th>
            <th scope="col" className="p-3">
              {t('adrTable.colStatus')}
            </th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id} className="border-b border-border last:border-b-0">
              {/* `th scope="row"` rather than a fourth `td`: the number is what identifies the row, and
                  a screen reader reading the status cell should announce which decision it belongs to.
                  A table of 41 rows is unusable otherwise. */}
              <th scope="row" className="p-3 font-mono font-normal align-top whitespace-nowrap">
                {record.id}
              </th>
              <td className="p-3 align-top">
                {/* The link is on the TITLE, not on the number. The title is the thing a reader is
                    deciding whether to open, and a bare four-digit link target is a poor accessible
                    name — "0034" tells a screen-reader user nothing about where it goes. */}
                <a href={adrHref(record)} target="_blank" rel="noopener noreferrer">
                  {record.title}
                </a>
              </td>
              <td className="p-3 align-top whitespace-nowrap text-muted-foreground">
                {label(record)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
