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
import { Markdown } from '../components/Markdown';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { absoluteUrl } from '../lib/site';
import { ShareButton } from '../components/ShareButton';
import { useLocale, type Locale } from '../i18n';

const BODIES: Record<Locale, string> = { en: architectureEn, pt: architecturePt };

export function ArchitecturePage() {
  const { locale, t } = useLocale();

  useDocumentHead({
    title: t('architecture.title'),
    description: t('architecture.metaDescription'),
    canonicalPath: '/architecture',
    type: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: t('architecture.title'),
      url: absoluteUrl('/architecture'),
      author: { '@type': 'Person', name: 'Luiz Tadeu Mendonça' },
    },
  });

  return (
    <div className="mx-auto w-full max-w-5xl">
      <article className="px-[--gutter] py-6">
        <header className="mb-[clamp(1.8rem,3vw,2.6rem)] border-b-2 border-border-strong pb-[clamp(1.4rem,3vw,2rem)]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
            <span>{t('architecture.kicker')}</span>
            {/* ShareButton prepends the origin — it takes a PATH, not an absolute URL. */}
            <ShareButton title={t('architecture.title')} url="/architecture" size="sm" />
          </div>
          <h1 className="mt-4 max-w-[22ch] text-balance text-[clamp(2rem,5.5vw,4rem)] font-bold leading-none tracking-[-0.035em]">
            {t('architecture.heading')}
          </h1>
        </header>

        <div className="max-w-none text-[17px] leading-relaxed text-foreground/90">
          <Markdown>{BODIES[locale]}</Markdown>
        </div>
      </article>
    </div>
  );
}
