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
import { resolveJourney } from '../data/journey';
import { Empty } from '../components/Column';
import { absoluteUrl } from '../lib/site';
import { useLocale, useLocalePath, useT } from '../i18n';

export function ProfilePage() {
  const t = useT();
  const lp = useLocalePath();
  // `useLocale()` returns the whole context (`{ locale, setLocale, t }`), not the locale string — the
  // destructuring is load-bearing. Indexing a prose leaf with the context object yields `undefined`,
  // React then omits the attribute entirely, and the page ships four photographs with NO alt text at
  // all: invisible on screen, catastrophic for a screen reader, and green under any assertion that only
  // checks `src`. `CVSection.test.tsx` reads `alt` rather than assuming it, for exactly this.
  const { locale } = useLocale();
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

  // THE JOURNEY PHOTOGRAPHS ARE PASSED IN, ONE PER EXPERIENCE ENTRY (#516). Each frame renders inside the
  // entry its authored attribution names — the owner's ask, in his words: *"as fotos ao longo de cada
  // entrada de work experience"*, bounded by *"manter a estrutura atual do cv, agregando as fotos
  // encaixadas nas experiencias ja validadas"*. Four frames, five entries, and the fifth carries none:
  // a photograph is a figure an entry MAY carry, not a slot every entry must fill.
  //
  // THIS REVERSES A RECORDED DECISION, AND THE OLD ONE IS RESTATED HERE RATHER THAN ERASED. Until this
  // slice the photographs rendered as `JourneyStrip`, an unnumbered block BELOW the CV and outside the
  // `[data-print="cv"]` tree, because /me is a hiring surface first and rapport belongs after the claims
  // — and because a decorative strip inside the print tree would have been a third A4 sheet held to a
  // CV's two-page budget. The first half was overruled by the owner on 2026-08-25, after reading the
  // shipped result. The second half was NOT overruled and is why this is more than a move: the print
  // budget is still guarded, and it holds because every figure carries `data-print="hide"` (see
  // `CVSection`'s `JourneyFigure`), so the printed CV is unchanged by a layout that only exists on screen.
  //
  // WHY THE PAGE RESOLVES THE LOCALE RATHER THAN `CVSection`. That component is pure and presentational:
  // it takes an already-resolved `Profile` and renders it. Reading the locale context inside it, for four
  // strings that happen to live in another module, would make it the one component on this page that does.
  return <CVSection profile={profile} journey={resolveJourney(locale)} />;
}
