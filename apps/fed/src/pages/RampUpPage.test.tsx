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
    // No iframe, and the only YouTube request is the thumbnail, which is lazy.
    expect(container.querySelector('iframe')).toBeNull();
    const thumbs = container.querySelectorAll('img[src^="https://i.ytimg.com/"]');
    expect(thumbs).toHaveLength(3); // one facade per curated video
    thumbs.forEach((img) => expect(img).toHaveAttribute('loading', 'lazy'));

    // …and clicking one does swap in the player, so the facade is a facade and not a dead thumbnail.
    // Target the facade by its label — the page also renders a ShareButton, so index 0 is not it.
    fireEvent.click(screen.getAllByRole('button', { name: /Reproduzir vídeo/ })[0]);
    expect(container.querySelector('iframe')?.getAttribute('src')).toMatch(
      /^https:\/\/www\.youtube-nocookie\.com\/embed\//,
    );
  });

  it('links the sources out to their public canonical URLs', () => {
    renderPage();
    // O'Reilly links must point at the public catalog, never the logged-in reader.
    const book = screen.getByRole('link', { name: 'AI Engineering' });
    expect(book).toHaveAttribute('href', 'https://www.oreilly.com/library/view/ai-engineering/9781098166298/');
    expect(screen.queryByRole('link', { name: /learning\.oreilly/ })).toBeNull();
  });
});
