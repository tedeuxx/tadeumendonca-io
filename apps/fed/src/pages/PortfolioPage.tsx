// Portfolio page (/portfolio) — the full curated catalog the site links out to on GitHub. Same
// cards as the landing's section, without the shortlist limit; the section carries its own heading,
// so there is no separate page header. No auth, no backend (static ../data/catalog).
import { PortfolioSection } from '../components/PortfolioSection';
import { useDocumentHead } from '../hooks/useDocumentHead';

export function PortfolioPage() {
  useDocumentHead({
    title: 'Portfólio',
    description: 'Automações, agentes e projetos — o catálogo no GitHub.',
    canonicalPath: '/portfolio',
  });

  return <PortfolioSection />;
}
