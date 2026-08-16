// Architecture page (/architecture) — the fifth public surface alongside the CV, the portfolio, the blog
// and the ramp-up. It is the orientation layer for the whole build: the shape of the site, the decisions
// that shaped it, and the reusable dev-loop plugin — each pointing OUT to its canonical detail (the ADRs,
// the two public repos, catalog-ready) rather than restating it here.
//
// The body is markdown-in-repo (../content/architecture.{pt,en}.md) rendered by the shared <Markdown>. It
// carries no video embeds — it is an orientation map of outbound links. Fully static, no backend.
//
// Authored in BOTH locales — one markdown file per language, selected here through a Record<Locale, string>
// so a missing translation is a compile error rather than a page that silently falls back (the same
// contract as the ramp-up page).
import architectureEn from '../content/architecture.en.md?raw';
import architecturePt from '../content/architecture.pt.md?raw';
import { MarkdownPage } from '../components/MarkdownPage';
import { useLocale, type Locale } from '../i18n';

const BODIES: Record<Locale, string> = { en: architectureEn, pt: architecturePt };

export function ArchitecturePage() {
  const { locale, t } = useLocale();

  // The architecture body carries no `{{years}}` token — it is passed through as-is (unlike the
  // ramp-up page, which resolves withYears before handing its body to the shared shell).
  return (
    <MarkdownPage
      kicker={t('architecture.kicker')}
      title={t('architecture.title')}
      description={t('architecture.metaDescription')}
      heading={t('architecture.heading')}
      canonicalPath="/architecture"
      jsonLdType="Article"
      body={BODIES[locale]}
      // THE CLOSING BLOCK IS OPT-IN AND THIS IS THE ONLY OPT-IN (#450) — the contact route and the share
      // deeplinks, after the body's closing ask. /ramp-up shares this shell and deliberately does not pass
      // it: a personal plan in progress is not something anyone decided to distribute, and handing it a
      // share block as a side effect of a slice about this page is the change that would never be reviewed
      // as itself. `MarkdownPage.test.tsx` and `RampUpPage.test.tsx` both assert that absence.
      endMatter
    />
  );
}
