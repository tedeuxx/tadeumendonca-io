import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RampUpPage } from './RampUpPage';
import { renderWithLocale } from '../test-utils';

const renderPage = (locale: 'pt' | 'en' = 'pt') =>
  renderWithLocale(
    <MemoryRouter>
      <RampUpPage />
    </MemoryRouter>,
    { locale },
  );

describe('RampUpPage', () => {
  it('renders the page heading and the markdown body', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: /Ramp-Up/ })).toBeInTheDocument();
    // A section heading from content/rampup.md — proves the markdown body actually rendered,
    // not just the chrome around it.
    expect(screen.getByRole('heading', { name: /Get the category right first/ })).toBeInTheDocument();
  });

  it('localizes the chrome while the body stays English', () => {
    const { unmount } = renderPage('pt');
    expect(screen.getByText('Plano aberto · em andamento')).toBeInTheDocument();
    unmount();

    renderPage('en');
    expect(screen.getByText('Open plan · in progress')).toBeInTheDocument();
    // The body is authored English-only for now (ADR-0032 scopes long-form content out of the
    // locale layer), so the same section heading is present in both.
    expect(screen.getByRole('heading', { name: /Get the category right first/ })).toBeInTheDocument();
  });

  it('turns the YouTube links into click-to-load facades, not eager iframes', () => {
    const { container } = renderPage();
    // The property that matters: nothing third-party is loaded before the reader asks for it.
    expect(container.querySelector('iframe')).toBeNull();

    // Count facades by their accessible role, not by the thumbnail host — the CDN hostname is an
    // internal of VideoEmbed, and pinning it would fail a rename that changes no behavior.
    const facades = screen.getAllByRole('button', { name: /Reproduzir vídeo/ });
    expect(facades).toHaveLength(3);

    // Pin WHICH videos: these three were each chosen and verified against the channel, so a wrong or
    // silently-swapped id is the failure worth catching. A host-shaped assertion would miss it.
    const thumbs = [...container.querySelectorAll('img[src*="/vi/"]')].map((img) => img.getAttribute('src') ?? '');
    expect(thumbs).toHaveLength(3);
    ['rKV5JcALQoQ', 'fl1DSmwQKKY', 'P1-8da1GgBg'].forEach((id) =>
      expect(thumbs.some((src) => src.includes(`/vi/${id}/`))).toBe(true),
    );
    // The one request the facade does make must not block the page.
    container.querySelectorAll('img[src*="/vi/"]').forEach((img) => expect(img).toHaveAttribute('loading', 'lazy'));

    // …and clicking one does swap in the player, so the facade is a facade and not a dead thumbnail.
    // Target the facade by its label — the page also renders a ShareButton, so index 0 is not it.
    fireEvent.click(facades[0]);
    expect(container.querySelector('iframe')?.getAttribute('src')).toMatch(
      /^https:\/\/www\.youtube-nocookie\.com\/embed\//,
    );
  });

  it('links the sources out to their public canonical URLs', () => {
    const { container } = renderPage();
    const book = screen.getByRole('link', { name: 'AI Engineering' });
    expect(book).toHaveAttribute('href', 'https://www.oreilly.com/library/view/ai-engineering/9781098166298/');

    // Every O'Reilly link must be the PUBLIC catalog, never the subscriber reader. This has to query
    // by href: a link's accessible name is its text ("AI Engineering"), so a name-based query can
    // never see the host and would pass no matter what the hrefs said.
    const oreilly = [...container.querySelectorAll('a[href*="oreilly.com"]')];
    expect(oreilly).toHaveLength(6);
    oreilly.forEach((a) => expect(a.getAttribute('href')).toMatch(/^https:\/\/www\.oreilly\.com\/library\/view\//));
    expect(container.querySelectorAll('a[href*="learning.oreilly.com"]')).toHaveLength(0);
  });
});
