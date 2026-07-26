import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { Hero } from './Hero';
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

  it('offers the two content CTAs as landing anchors', () => {
    renderHero();
    expect(screen.getByRole('link', { name: /Artigos/ })).toHaveAttribute('href', '#artigos');
    expect(screen.getByRole('link', { name: /Portfólio/ })).toHaveAttribute('href', '#portfolio');
  });

  it('offers the ramp-up page as a real route (client-side nav, not a landing anchor)', () => {
    renderHero();
    // The route link stays within the active locale (ADR-0036); the anchors above stay bare hashes.
    expect(screen.getByRole('link', { name: /Ramp-up/ })).toHaveAttribute('href', '/pt/ramp-up');
  });

  it('renders the subject marquee once for assistive tech (the loop copy is hidden)', () => {
    renderHero();
    const marquee = screen.getByLabelText('Assuntos');
    expect(marquee).toBeInTheDocument();
    expect(screen.getAllByText('Agentic AI')).toHaveLength(2); // visual loop needs two tracks
    expect(marquee.querySelectorAll('[aria-hidden="true"] > span').length).toBeGreaterThan(0);
  });
});
