import { describe, it, expect } from 'vitest';
import { screen, cleanup } from '@testing-library/react';
import { Hero } from './Hero';
import { AppShell } from './AppShell';
import { profile } from '../data/profile';
import { renderWithLocale } from '../test-utils';

// Hero carries a router Link (the ramp-up CTA); renderWithLocale provides the Router + locale.
function renderHero(locale: 'pt' | 'en' = 'pt') {
  return renderWithLocale(<Hero />, { locale });
}

describe('Hero', () => {
  it('leads with the brand, not the person', () => {
    renderHero();
    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveTextContent('tadeumendonca.io');
    expect(title.textContent).not.toContain(profile.name);
  });

  it('keeps the brand on a single unbreakable line', () => {
    renderHero();
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('whitespace-nowrap');
  });

  it('states the reader-first promise for both audiences (pt-BR chrome)', () => {
    renderHero('pt');
    expect(screen.getByText(/do dia a dia à produção/)).toBeInTheDocument();
    expect(screen.getByText(/vida pessoal com Claude Cowork/)).toBeInTheDocument();
    expect(screen.getByText(/agentic development/)).toBeInTheDocument();
  });

  it('renders the promise in English when the locale is en', () => {
    renderHero('en');
    expect(screen.getByText(/from everyday life to production/)).toBeInTheDocument();
    expect(screen.getByText(/personal life with Claude Cowork/)).toBeInTheDocument();
    expect(screen.getByText(/agentic development/)).toBeInTheDocument();
  });

  it('offers the articles CTA as a landing anchor', () => {
    renderHero();
    expect(screen.getByRole('link', { name: /Artigos/ })).toHaveAttribute('href', '#artigos');
  });

  it('offers the ramp-up page as a real route (client-side nav, not a landing anchor)', () => {
    renderHero();
    // The route link stays within the active locale (ADR-0036); the anchors above stay bare hashes.
    expect(screen.getByRole('link', { name: /Ramp-up/ })).toHaveAttribute('href', '/pt/ramp-up');
  });

  // #315, and this is the assertion that would have caught the defect the routing fix introduced. The
  // Hero and the nav render the SAME `nav.portfolio` key, and the nav is sticky while this row is the
  // first block — so both are on screen together on the landing. Sending them to different places is
  // one word with two behaviours on one screen, which is the kind of thing a reader notices without
  // being able to name.
  //
  // Asserted as an EQUALITY between the two controls rather than as a literal href, so it fails if
  // either side moves alone. A pair of independent literal assertions would both stay green while the
  // two drifted apart, which is exactly what happened here.
  it('sends its Portfolio CTA wherever the nav sends its own — they share a label', () => {
    renderHero();
    const heroTarget = screen.getByRole('link', { name: /Portfólio/ }).getAttribute('href');
    cleanup();
    renderWithLocale(
      <AppShell>
        <div />
      </AppShell>,
      { locale: 'pt' },
    );
    const navTarget = screen.getByRole('link', { name: 'Portfólio' }).getAttribute('href');
    expect(heroTarget).toBe(navTarget);
    expect(heroTarget).toBe('/pt/portfolio');
  });

  // #420, and it is the SAME property #315 pinned for Portfolio rather than a new one: the Hero and the
  // nav render the identical `nav.architecture` key, the nav is sticky and this row is the first block,
  // so both words are on screen together on the landing. Two controls showing one word and going to two
  // places is the defect; asserted as an equality between them so it fails if either side moves alone.
  it('sends its Architecture CTA wherever the nav sends its own — they share a label', () => {
    renderHero();
    const heroTarget = screen.getByRole('link', { name: /Arquitetura/ }).getAttribute('href');
    cleanup();
    renderWithLocale(
      <AppShell>
        <div />
      </AppShell>,
      { locale: 'pt' },
    );
    const navTarget = screen.getByRole('link', { name: 'Arquitetura' }).getAttribute('href');
    expect(heroTarget).toBe(navTarget);
    expect(heroTarget).toBe('/pt/architecture');
  });

  it('localizes the Architecture CTA rather than shipping one edition to both readers', () => {
    renderHero('en');
    expect(screen.getByRole('link', { name: /Architecture/ })).toHaveAttribute(
      'href',
      '/en/architecture',
    );
  });

  // THE ORDER IS THE DECISION, not an accident of the JSX, so it is asserted rather than left to
  // whoever edits the block next. The row runs lighter to heavier commitment and `/architecture` is the
  // deepest read, so it closes the row. Read off the DOM in document order — a set-membership check
  // ("all four are present") is the shape that stays green through exactly the reshuffle this pins.
  it('closes the row with Architecture, after the three that were already there', () => {
    const { container } = renderHero();
    const row = container.querySelector('header > div > div:last-of-type') as HTMLElement;
    const labels = [...row.querySelectorAll('a')].map((a) => a.textContent?.replace('→', '').trim());
    expect(labels).toEqual(['Ramp-up', 'Artigos', 'Portfólio', 'Arquitetura']);
  });

  it('renders the stack marquee once for assistive tech (the loop copy is hidden)', () => {
    renderHero();
    const marquee = screen.getByLabelText('Stack');
    expect(marquee).toBeInTheDocument();
    expect(screen.getAllByText('Agentic AI')).toHaveLength(2); // visual loop needs two tracks
    expect(marquee.querySelectorAll('[aria-hidden="true"] > span').length).toBeGreaterThan(0);
  });

  // The strip is the first part of this component that VARIES BY LOCALE — most entries are proper
  // nouns, but three ordinary technical nouns are Portuguese in the pt edition.
  //
  // BOTH EDITIONS ARE ASSERTED, and that is the point rather than symmetry. The first version of
  // these tests ran under `pt` only, so swapping the two arrays wholesale would have passed every
  // check: the `Record<Locale, …>` type catches a MISSING key, never a wrong value, and 100% coverage
  // on this file is compatible with the `en` strip being entirely wrong — it is data, not a branch.
  // Technical nouns stay English in the pt edition too (owner, 2026-07-31) — the same rule
  // `profile.ts` already follows for individual skill names, so a pt reader does not meet
  // `Observabilidade` here and `Observability` on /me.
  //
  // ASSERTED THROUGH THE RENDER, UNDER BOTH LOCALES, and that is not redundancy now that one list
  // serves both: it pins the RULE rather than the data. If someone reintroduces a translated pt
  // edition, the first of these goes red — which is exactly what happened while this slice was being
  // written, and the reason the assertion is phrased against what a pt reader sees.
  it('keeps technical nouns in English for a pt reader', () => {
    renderHero('pt');
    expect(screen.getAllByText('Observability')).toHaveLength(2);
    expect(screen.getAllByText('Security')).toHaveLength(2);
    expect(screen.getAllByText('Distributed Systems')).toHaveLength(2);
    expect(screen.queryByText('Observabilidade')).toBeNull();
    expect(screen.queryByText('Sistemas Distribuídos')).toBeNull();
  });

  it('renders the same strip and an untranslated label for an en reader', () => {
    renderHero('en');
    expect(screen.getByLabelText('Stack')).toBeInTheDocument();
    expect(screen.getAllByText('Observability')).toHaveLength(2);
    expect(screen.getAllByText('Distributed Systems')).toHaveLength(2);
  });

  // Dropped on 2026-07-31 (owner): too low-level next to the practice terms beside it.
  it('no longer advertises tool-calling', () => {
    renderHero();
    expect(screen.queryByText('Tool-Calling')).toBeNull();
  });
});
