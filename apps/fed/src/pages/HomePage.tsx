// Landing (/) — reframe-first: leads with the CV, then the portfolio catalog. The profile is static
// (../data/profile via useProfile), so there's no BFF call and no loading/error path. The product
// (feed, blog, posts) still exists, just de-emphasized in the nav.
import { useProfile } from '../hooks/useProfile';
import { ProfileView } from '../components/ProfileView';
import { PortfolioSection } from '../components/PortfolioSection';
import { Empty } from '../components/Column';

export function HomePage() {
  const { data: profile } = useProfile();

  if (!profile) return <Empty>Perfil ainda não disponível.</Empty>;

  return (
    <div>
      <ProfileView profile={profile} />
      <PortfolioSection />
    </div>
  );
}
