import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { AnalyticsPage } from './AnalyticsPage';
import { renderWithLocale } from '../test-utils';
import { translate } from '../i18n/messages';

const renderPage = (locale: 'pt' | 'en') => renderWithLocale(<AnalyticsPage />, { locale });

// Each edition's own section heading, used to prove WHICH body rendered. Spelled out rather than read
// from the markdown, so a page that rendered the wrong file cannot satisfy it by construction.
const OWN = { pt: /Toda contagem é um piso/, en: /Every count is a floor/ };

describe('AnalyticsPage', () => {
  it.each(['pt', 'en'] as const)('renders the chrome from the catalog and its own body (%s)', (locale) => {
    renderPage(locale);
    expect(screen.getByRole('heading', { level: 1, name: translate(locale, 'analytics.heading') })).toBeInTheDocument();
    expect(screen.getByText(translate(locale, 'analytics.kicker'))).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: OWN[locale] })).toBeInTheDocument();
    // Parity: the other edition's body is ABSENT, not merely this one present.
    expect(screen.queryByRole('heading', { name: OWN[locale === 'pt' ? 'en' : 'pt'] })).toBeNull();
  });

  it.each(['pt', 'en'] as const)('presents each event as its own section heading (%s)', (locale) => {
    renderPage(locale);
    for (const name of ['page_view', 'article_end_reached', 'share_complete', 'nav_click']) {
      expect(screen.getByRole('heading', { level: 3, name })).toBeInTheDocument();
    }
  });

  it('titles the document with the section label, and canonicalises to its own route', () => {
    renderPage('en');
    expect(document.title.startsWith(translate('en', 'analytics.label'))).toBe(true);
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toMatch(/\/en\/analytics$/);
  });
});
