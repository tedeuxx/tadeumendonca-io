import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AboutCard } from './AboutCard';
import { profile } from '../data/profile';

describe('AboutCard', () => {
  it('describes the site and defers the person to /cv', () => {
    const { container } = render(
      <MemoryRouter>
        <AboutCard />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Sobre este site' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Quem escreve/ })).toHaveAttribute('href', '/cv');
    expect(container.textContent).not.toContain(profile.name); // no name on the landing
  });
});
