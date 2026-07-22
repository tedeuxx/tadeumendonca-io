// CV (/cv) — the canonical reference of the owner's experience, and the only place the personal
// name and bio appear (the landing is the brand, not the person). Static profile (../data/profile),
// so there is no loading or error path.
//
// Slice 3 gives the route its own head + reading width; the brutalist CVSection (separate Formação
// and Certificações, Credly badges, mono ticks) lands in the CV slice.
import { useProfile } from '../hooks/useProfile';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { ProfileView } from '../components/ProfileView';
import { Empty } from '../components/Column';
import { SITE_URL } from '../lib/site';

export function CvPage() {
  const { data: profile } = useProfile();

  useDocumentHead({
    title: profile ? `CV — ${profile.name}` : 'CV',
    description: profile?.summary,
    canonicalPath: '/cv',
    jsonLd: profile
      ? {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: profile.name,
          jobTitle: profile.headline,
          url: `${SITE_URL}/cv`,
          sameAs: Object.values(profile.metadata),
          ...(profile.location ? { address: profile.location } : {}),
        }
      : undefined,
  });

  if (!profile) return <Empty>Perfil ainda não disponível.</Empty>;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <ProfileView profile={profile} />
    </div>
  );
}
