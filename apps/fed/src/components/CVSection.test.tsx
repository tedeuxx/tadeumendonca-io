import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { CVSection } from './CVSection';
import type { Profile } from '../types/profile';
import { renderWithLocale } from '../test-utils';

const profile: Profile = {
  profile_id: 'me',
  name: 'Tadeu Mendonça',
  headline: 'AI Engineer',
  summary: 'Builds agentic systems.',
  location: 'Brazil',
  experience: [
    {
      company: 'tadeumendonca.io',
      title: 'Engineer',
      start_date: '2026-01',
      end_date: null,
      description: 'Platform work.',
      highlights: ['Terraform', 'Hono'],
    },
  ],
  education: [{ institution: 'Uni', degree: 'BSc', field: 'CS', start_date: '2014', end_date: '2018' }],
  certifications: [{ name: 'AWS SAA', issuer: 'AWS', issued_date: '2025', credential_url: 'https://x', badge_label: 'SA\nASC' }],
  skills: { cloud: ['AWS', 'Terraform'] },
  metadata: { github: 'https://github.com/tedeuxx' },
};

describe('CVSection', () => {
  it('renders the CV blocks — Formação and Certificações are separate', () => {
    renderWithLocale(<CVSection profile={profile} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Tadeu Mendonça' })).toBeInTheDocument();
    expect(screen.getByText('Experiência')).toBeInTheDocument();
    expect(screen.getByText('Hono')).toBeInTheDocument(); // experience highlight
    expect(screen.getAllByText(/Terraform/).length).toBeGreaterThan(0); // in highlights + skills
    expect(screen.getByText('Formação')).toBeInTheDocument();
    expect(screen.getByText('Certificações')).toBeInTheDocument();
    expect(screen.getByText('Habilidades')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /github/i })).toHaveAttribute('href', 'https://github.com/tedeuxx');
  });

  it('shows the portrait beside the name when the profile carries one', () => {
    const { container } = renderWithLocale(<CVSection profile={{ ...profile, avatar_url: '/avatar.jpg' }} />);
    const portrait = container.querySelector('img');
    expect(portrait).toHaveAttribute('src', '/avatar.jpg');
    expect(portrait).toHaveAttribute('aria-hidden', 'true'); // the h1 beside it names the person
    // The one carved exception to radius 0 (ADR-0008 amendment). Pinned here because the Tailwind
    // radius scale is collapsed to 0, so losing this class would silently square the portrait.
    expect(portrait).toHaveClass('avatar-round');
  });

  it('links a certification to its credential and falls back to the typographic seal', () => {
    const { container } = renderWithLocale(<CVSection profile={profile} />);
    expect(screen.getByRole('link', { name: /AWS SAA/ })).toHaveAttribute('href', 'https://x');
    // no avatar_url and no badge_image_url → nothing renders as an image at all
    expect(container.querySelector('img')).toBeNull();
  });

  it('renders the official Credly image when the data carries one', () => {
    const withBadge: Profile = {
      ...profile,
      certifications: [{ ...profile.certifications[0], badge_image_url: 'https://images.credly.com/x.png' }],
    };
    const { container } = renderWithLocale(<CVSection profile={withBadge} />);
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://images.credly.com/x.png');
  });

  it('renders friendly link labels and a dash-less single graduation year', () => {
    const p: Profile = {
      ...profile,
      education: [{ institution: 'PUC-Rio', degree: "Bachelor's Degree", field: 'IT', start_date: '', end_date: '2010' }],
      // 'twitter' is not in the label map → falls back to the raw key.
      metadata: { linkedin: 'https://www.linkedin.com/in/x/', medium: 'https://x.medium.com', twitter: 'https://x.com/y' },
    };
    renderWithLocale(<CVSection profile={p} />);
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', 'https://www.linkedin.com/in/x/');
    expect(screen.getByRole('link', { name: 'Medium' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'twitter' })).toBeInTheDocument(); // unknown key → raw fallback
    // no start date → just the year, no leading "–"
    expect(screen.getByText('2010')).toBeInTheDocument();
    expect(screen.queryByText('– 2010')).not.toBeInTheDocument();
  });

  it('localizes the section chrome and the ongoing-role label (pt vs en)', () => {
    renderWithLocale(<CVSection profile={profile} />, { locale: 'pt' });
    expect(screen.getByText('Experiência')).toBeInTheDocument();
    expect(screen.getByText(/Atual/)).toBeInTheDocument(); // end_date null → "Atual"
  });

  it('renders the section chrome in English when the locale is en (data stays as-is)', () => {
    renderWithLocale(<CVSection profile={profile} />, { locale: 'en' });
    expect(screen.getByText('Experience')).toBeInTheDocument();
    expect(screen.getByText('Education')).toBeInTheDocument();
    expect(screen.getByText('Certifications')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText(/Present/)).toBeInTheDocument(); // end_date null → "Present"
    // The CV *content* is not translated: the English data renders verbatim.
    expect(screen.getByRole('heading', { level: 1, name: 'Tadeu Mendonça' })).toBeInTheDocument();
  });

  it('omits empty blocks', () => {
    const minimal: Profile = {
      ...profile,
      summary: undefined,
      location: undefined,
      experience: [],
      education: [],
      certifications: [],
      skills: {},
      metadata: {},
    };
    renderWithLocale(<CVSection profile={minimal} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Tadeu Mendonça' })).toBeInTheDocument();
    expect(screen.queryByText('Experiência')).not.toBeInTheDocument();
    expect(screen.queryByText('Certificações')).not.toBeInTheDocument();
    expect(screen.queryByText('Habilidades')).not.toBeInTheDocument();
  });
});
