// CV (/cv) — the canonical reference of the owner's experience, and the only place the personal
// name and bio appear (the landing is the brand, not the person). Static profile (../data/profile),
// so there is no loading or error path.
//
// The CV is rendered by CVSection: numbered sticky blocks, separate Formação and Certificações,
// certifications as badges.
import { useProfile } from '../hooks/useProfile';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { CVSection } from '../components/CVSection';
import { Empty } from '../components/Column';
import { SITE_URL } from '../lib/site';
import { useT } from '../i18n';

export function CvPage() {
  const t = useT();
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

  if (!profile) return <Empty>{t('cv.unavailable')}</Empty>;

  return <CVSection profile={profile} />;
}
