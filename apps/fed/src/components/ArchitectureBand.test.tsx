import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { ArchitectureBand } from './ArchitectureBand';
import { renderWithLocale } from '../test-utils';
import { translate } from '../i18n/messages';

const render = (locale: 'pt' | 'en' = 'pt') => renderWithLocale(<ArchitectureBand />, { locale });

describe('ArchitectureBand', () => {
  // BOTH LOCALES, EXPLICITLY. This suite renders at `pt` by default and the band is copy — a pt-only
  // assertion would pass on a band whose English edition was never wired at all.
  it.each(['pt', 'en'] as const)('renders the catalog copy for the band (%s)', (locale) => {
    render(locale);
    expect(screen.getByText(translate(locale, 'architecture.bandKicker'))).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: translate(locale, 'architecture.bandHeading') }),
    ).toBeInTheDocument();
  });

  // The control's LABEL is the constraint, not just its presence: the Issue's shape decision is that the
  // band renders the EXISTING `nav.architecture` key, so the reader meets one word for one destination
  // across the nav, the hero row and this band. A band that invented its own label would pass a
  // "there is a link to /architecture" assertion and fail the decision.
  it.each([
    ['pt', 'Arquitetura', '/pt/architecture'],
    ['en', 'Architecture', '/en/architecture'],
  ] as const)('points one control at the section, labelled with the nav key (%s)', (locale, label, href) => {
    const { container } = render(locale);
    expect(translate(locale, 'nav.architecture')).toBe(label);
    const control = screen.getByRole('link', { name: label });
    expect(control).toHaveAttribute('href', href);
    // ONE control, not two. #315 recorded the rule against two controls to one destination on one screen,
    // and the hero row already carries /architecture on this same page.
    expect(container.querySelectorAll('a')).toHaveLength(1);
  });

  // The band is about WHAT THE READER GETS, never about who built it — the Hero's published body ends two
  // blocks above with "quem escreve isso é consequência, não o ponto", so a band leading with the owner
  // would contradict a sentence the reader can see without scrolling. Asserted mechanically on the owner's
  // name because that is the checkable half of the constraint.
  it.each(['pt', 'en'] as const)('does not put the owner in the band (%s)', (locale) => {
    const { container } = render(locale);
    expect(container.textContent).not.toMatch(/Tadeu/i);
  });

  // The band carries NO word whose truth depends on the date (DECISION 1 on #450): it is what buys the
  // band a life with no retirement step, and nothing else in this repo would ever raise a stale "new".
  it.each(['pt', 'en'] as const)('carries no time-bound word (%s)', (locale) => {
    const { container } = render(locale);
    expect(container.textContent).not.toMatch(/\b(novo|nova|lançamento|recém|agora|new|just shipped|launch)\b/i);
  });

  it('is a labelled region, so the section is reachable as one thing', () => {
    render('pt');
    expect(screen.getByRole('region', { name: translate('pt', 'architecture.bandHeading') })).toBeInTheDocument();
  });
});
