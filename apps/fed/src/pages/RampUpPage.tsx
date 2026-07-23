// Ramp-up page (/ramp-up) — the fourth public surface alongside the CV, the portfolio and the blog.
// It is the owner's plan for moving into AI Engineering, in the open: the reasoning, the roadmap, and
// the exact sources.
//
// The body is markdown-in-repo (../content/rampup.md) rendered by the shared <Markdown>, which means
// the YouTube links in it become click-to-load <VideoEmbed> facades for free — nothing third-party
// loads until the reader asks. Fully static, no backend.
//
// The page is authored in ENGLISH ONLY for now, like the long-form articles: ADR-0032 puts long-form
// content i18n outside the locale layer's scope, so this joins the article parity slice rather than
// the chrome catalog. Only the surrounding chrome localizes.
import rampUpBody from '../content/rampup.md?raw';
import { Markdown } from '../components/Markdown';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { absoluteUrl } from '../lib/site';
import { ShareButton } from '../components/ShareButton';
import { useT } from '../i18n';

export function RampUpPage() {
  const t = useT();

  useDocumentHead({
    title: t('rampup.title'),
    description: t('rampup.metaDescription'),
    canonicalPath: '/ramp-up',
    type: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: t('rampup.title'),
      url: absoluteUrl('/ramp-up'),
      author: { '@type': 'Person', name: 'Luiz Tadeu Mendonça' },
    },
  });

  return (
    <div className="mx-auto w-full max-w-3xl">
      <article className="px-[--gutter] py-6">
        <header className="mb-[clamp(1.8rem,3vw,2.6rem)] border-b-2 border-border-strong pb-[clamp(1.4rem,3vw,2rem)]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
            <span>{t('rampup.kicker')}</span>
            {/* ShareButton prepends the origin — it takes a PATH, not an absolute URL. */}
            <ShareButton title={t('rampup.title')} url="/ramp-up" size="sm" />
          </div>
          <h1 className="mt-4 max-w-[22ch] text-balance text-[clamp(2rem,5.5vw,4rem)] font-bold leading-none tracking-[-0.035em]">
            {t('rampup.heading')}
          </h1>
        </header>

        <div className="max-w-prose text-[17px] leading-relaxed text-foreground/90">
          <Markdown>{rampUpBody}</Markdown>
        </div>
      </article>
    </div>
  );
}
