// Portfolio page (/portfolio) — the full curated catalog the site links out to on GitHub. Same
// cards as the landing's section, without the shortlist limit; the section carries its own heading,
// so there is no separate page header. No auth, no backend (static ../data/catalog).
import { PortfolioSection } from '../components/PortfolioSection';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { useT } from '../i18n';

export function PortfolioPage() {
  const t = useT();
  useDocumentHead({
    title: t('portfolio.heading'),
    description: t('portfolio.metaDescription'),
    canonicalPath: '/portfolio',
  });

  // `showBar` is opted into here and nowhere else: the curation standard belongs on the dedicated page,
  // not on the landing's four-item teaser (the shape proposed in PR #251, where it is ratified).
  return <PortfolioSection showBar />;
}
