// Profile (/me) — the canonical reference of the owner's experience, and the only place the personal
// name and bio appear (the landing is the brand, not the person). Static profile (../data/profile),
// so there is no loading or error path. The route is /me, per-locale (/pt/me, /en/me). There are no
// /cv or /profile back-compat redirects — they were dropped pre-launch in #234 (ADR-0010's 2026-07-24
// amendment); this comment claimed otherwise until #262.
//
// The experience is rendered by CVSection: numbered sticky blocks, separate Formação and Certificações,
// certifications as badges.
import { useProfile } from '../hooks/useProfile';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { CVSection } from '../components/CVSection';
import { JourneyStrip } from '../components/JourneyStrip';
import { Empty } from '../components/Column';
import { absoluteUrl } from '../lib/site';
import { useLocalePath, useT } from '../i18n';

export function ProfilePage() {
  const t = useT();
  const lp = useLocalePath();
  const { data: profile } = useProfile();

  useDocumentHead({
    // ADR-0045: leads with the `nav.profile` label — the word the reader clicked — and appends the name,
    // which is the secondary half the convention allows. It reads the nav key DIRECTLY rather than
    // through a `profile.title`, because the personal name is data (src/data/profile.ts), not chrome, so
    // the composition cannot live in the catalog. That is why `profile` is the one section without a
    // `title` leaf, and why messages.test.ts's derived check does not cover it — ProfilePage.test.tsx does.
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

  // The journey photographs sit OUTSIDE `CVSection` rather than inside it (#127), and the reason is the
  // print edition: `CVSection` is the `[data-print="cv"]` tree that `/cv.pdf` is printed from, and its
  // page budget is guarded at two A4 sheets. A decorative strip inside that tree would be a third sheet's
  // worth of content held to a CV's budget. Outside it, the strip is web-only chrome and says so with the
  // same `data-print="hide"` hook the metadata row already uses.
  //
  // It renders BELOW the CV on purpose: this page is a hiring surface first, and the four photographs are
  // rapport, which is what a reader wants after the claims rather than before them.
  return (
    <>
      <CVSection profile={profile} />
      <JourneyStrip />
    </>
  );
}
