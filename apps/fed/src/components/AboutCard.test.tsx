import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AboutCard } from './AboutCard';
import { profile } from '../data/profile';
import { renderWithLocale } from '../test-utils';

describe('AboutCard', () => {
  it('describes the site and defers the person to /cv', () => {
    const { container } = renderWithLocale(
      <MemoryRouter>
        <AboutCard />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Sobre este site' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Quem escreve/ })).toHaveAttribute('href', '/cv');
    expect(container.textContent).not.toContain(profile.name); // no name on the landing
  });

  it('shows the avatar as decoration, not as a second link target', () => {
    const { container } = renderWithLocale(
      <MemoryRouter>
        <AboutCard />
      </MemoryRouter>,
    );
    const avatar = container.querySelector('img');
    expect(avatar).toHaveAttribute('aria-hidden', 'true'); // the link text carries the meaning
    expect(avatar).toHaveAttribute('alt', '');
    expect(screen.getAllByRole('link')).toHaveLength(1); // avatar and label are one target
  });

  // The portrait is the ONE carved exception to radius 0 (ADR-0008 amendment). Asserting it here
  // pins the exception in place: if someone removes the utility, this fails rather than the circle
  // silently going square — the Tailwind scale is collapsed, so nothing else would catch it.
  it('marks the portrait with the carved round-portrait utility', () => {
    const { container } = renderWithLocale(
      <MemoryRouter>
        <AboutCard />
      </MemoryRouter>,
    );
    expect(container.querySelector('img')).toHaveClass('avatar-round');
  });
});
