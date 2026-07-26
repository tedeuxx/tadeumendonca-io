// Profile (/me) — the canonical reference of the owner's experience, and the only place the personal
// name and bio appear (the landing is the brand, not the person). Static profile (../data/profile),
// so there is no loading or error path. The route is /me; /cv and /profile redirect here (back-compat).
//
// The experience is rendered by CVSection: numbered sticky blocks, separate Formação and Certificações,
// certifications as badges.
import { useProfile } from '../hooks/useProfile';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { CVSection } from '../components/CVSection';
import { Empty } from '../components/Column';
import { absoluteUrl } from '../lib/site';
import { useLocalePath, useT } from '../i18n';

export function ProfilePage() {
  const t = useT();
  const lp = useLocalePath();
  const { data: profile } = useProfile();

  useDocumentHead({
    title: profile ? `${t('nav.profile')} — ${profile.name}` : t('nav.profile'),
    description: profile?.summary,
    canonicalPath: '/me',
    jsonLd: profile
      ? {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: profile.name,
          jobTitle: profile.headline,
          url: absoluteUrl(lp('/me')),
          sameAs: Object.values(profile.metadata),
          ...(profile.location ? { address: profile.location } : {}),
        }
      : undefined,
  });

  if (!profile) return <Empty>{t('cv.unavailable')}</Empty>;

  return <CVSection profile={profile} />;
}
