// Portfolio page (/portfolio) — the curated catalog of projects the site links out to on GitHub.
// No auth, no backend (static ../data/catalog).
import { PortfolioSection } from '../components/PortfolioSection';
import { ColumnHeader } from '../components/Column';

export function PortfolioPage() {
  return (
    <div>
      <ColumnHeader title="Portfólio" description="Automações e projetos — o catálogo no GitHub." />
      <PortfolioSection embedded={false} />
    </div>
  );
}
