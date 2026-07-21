// Landing (/) — reframe-first: leads with the CV, then the portfolio catalog. The profile is static
// (../data/profile via useProfile), so there's no BFF call and no loading/error path. The product
// (feed, blog, posts) still exists, just de-emphasized in the nav.
import { useProfile } from '../hooks/useProfile';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { ProfileView } from '../components/ProfileView';
import { PortfolioSection } from '../components/PortfolioSection';
import { Empty } from '../components/Column';
import { SITE_URL } from '../lib/site';

export function HomePage() {
  const { data: profile } = useProfile();

  useDocumentHead({
    title: profile?.name ?? 'tadeumendonca.io',
    description: profile?.summary,
    canonicalPath: '/',
    jsonLd: profile
      ? {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: profile.name,
          jobTitle: profile.headline,
          url: SITE_URL,
          sameAs: Object.values(profile.metadata),
          ...(profile.location ? { address: profile.location } : {}),
        }
      : undefined,
  });

  if (!profile) return <Empty>Perfil ainda não disponível.</Empty>;

  return (
    <div>
      <ProfileView profile={profile} />
      <PortfolioSection />
    </div>
  );
}
