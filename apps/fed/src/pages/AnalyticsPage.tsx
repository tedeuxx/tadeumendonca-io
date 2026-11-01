// Analytics schema page (/analytics, #640) — what this site's browser code sends to GA4, event by event,
// and what each event can and cannot establish. A description of the schema, never a figure from it: the
// page carries no GA4 number, makes no network call and holds no credential (the owner's decision 1).
//
// OFF THE MENU (decision 3). It is reached from a link on /architecture, not from `AppShell`'s `NAV`, and
// `NavArea` gains no member for it — so a `nav_click` whose origin is this page reports `from: 'other'`.
// The body says so, because it is a page about what the events can and cannot see.
//
// The body is markdown-in-repo (../content/analytics.{pt,en}.md), one file per language, selected through
// a Record<Locale, string> so a missing translation is a compile error — the same contract as /ramp-up and
// /architecture. The event list in it is NOT trusted as typed: `content/analytics-schema.test.ts` derives
// the emitted set from `lib/analytics.ts` and compares it with what both editions present, both ways.
import analyticsEn from '../content/analytics.en.md?raw';
import analyticsPt from '../content/analytics.pt.md?raw';
import { MarkdownPage } from '../components/MarkdownPage';
import { useLocale, type Locale } from '../i18n';

const BODIES: Record<Locale, string> = { en: analyticsEn, pt: analyticsPt };

export function AnalyticsPage() {
  const { locale, t } = useLocale();

  return (
    <MarkdownPage
      kicker={t('analytics.kicker')}
      title={t('analytics.title')}
      description={t('analytics.metaDescription')}
      heading={t('analytics.heading')}
      canonicalPath="/analytics"
      jsonLdType="Article"
      body={BODIES[locale]}
    />
  );
}
