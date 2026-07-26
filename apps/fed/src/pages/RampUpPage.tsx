// Ramp-up page (/ramp-up) — the fourth public surface alongside the CV, the portfolio and the blog.
// It is the owner's plan for moving into AI Engineering, in the open: the reasoning, the roadmap, and
// the exact sources.
//
// The body is markdown-in-repo (../content/rampup.{pt,en}.md) rendered by the shared <Markdown>, which means
// the YouTube links in it become click-to-load <VideoEmbed> facades for free — nothing third-party
// loads until the reader asks. Fully static, no backend.
//
// The body is authored in BOTH locales — one markdown file per language, selected here. Long-form prose
// is the one thing the key-first `{ pt, en }` shape used for the CV and the message catalog does not
// suit: a paragraph is not a leaf, and interleaving two languages inside one document would make both
// unreadable to edit. Two files, one contract: every locale in BODIES must have a file, so a missing
// translation is a compile error rather than a page that silently falls back.
import rampUpEn from '../content/rampup.en.md?raw';
import rampUpPt from '../content/rampup.pt.md?raw';
import { MarkdownPage } from '../components/MarkdownPage';
import { useLocale, type Locale } from '../i18n';
import { withYears } from '../data/profile';

const BODIES: Record<Locale, string> = { en: rampUpEn, pt: rampUpPt };

// The page states the owner's years of experience, and the CV states it too. Both read `{{years}}`
// and resolve through the SAME helper, so the two surfaces cannot disagree — which is exactly how
// they DID disagree before (issue #82: "~17" here, "17" on the CV, 18 in the underlying dates).
// The `{{years}}` token is resolved HERE via withYears before the body reaches the shared shell,
// which is body-agnostic (the architecture page passes its body unresolved).

export function RampUpPage() {
  const { locale, t } = useLocale();

  return (
    <MarkdownPage
      kicker={t('rampup.kicker')}
      title={t('rampup.title')}
      description={t('rampup.metaDescription')}
      heading={t('rampup.heading')}
      canonicalPath="/ramp-up"
      jsonLdType="Article"
      body={withYears(BODIES[locale])}
    />
  );
}
