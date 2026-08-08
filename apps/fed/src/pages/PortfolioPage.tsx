// Portfolio page (/portfolio) — the full curated catalog the site links out to on GitHub. Same
// cards as the landing's section, without the shortlist limit; the section carries its own heading,
// so there is no separate page header. No auth, no backend (static ../data/catalog).
import { PortfolioSection } from '../components/PortfolioSection';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { useT } from '../i18n';

export function PortfolioPage() {
  const t = useT();
  useDocumentHead({
    // `portfolio.title`, not `portfolio.heading` (ADR-0045). Same string today; the point is that a title
    // is not a heading, so it must not be sourced from one — this page was the reference for the
    // convention and was the one place still reading the heading key.
    title: t('portfolio.title'),
    description: t('portfolio.metaDescription'),
    canonicalPath: '/portfolio',
  });

  // `showBar` is opted into here and nowhere else: the curation standard belongs on the dedicated page,
  // not on the landing's four-item teaser (the shape proposed in PR #251; until an owner comment exists
  // there, read this as proposed rather than decided).
  return <PortfolioSection showBar />;
}
