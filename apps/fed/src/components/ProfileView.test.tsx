import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileView } from './ProfileView';
import type { Profile } from '../types/profile';

const profile: Profile = {
  profile_id: 'me',
  name: 'Tadeu Mendonça',
  headline: 'Software Engineer',
  summary: 'Builds serverless products.',
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
  education: [
    { institution: 'Uni', degree: 'BSc', field: 'CS', start_date: '2014', end_date: '2018' },
  ],
  certifications: [
    { name: 'AWS SAA', issuer: 'AWS', issued_date: '2025', credential_url: 'https://x' },
  ],
  skills: { cloud: ['AWS', 'Terraform'] },
  metadata: { github: 'https://github.com/tedeuxx' },
};

describe('ProfileView', () => {
  it('renders the CV sections', () => {
    render(<ProfileView profile={profile} />);
    expect(screen.getByText('Tadeu Mendonça')).toBeInTheDocument();
    expect(screen.getByText('Experiência')).toBeInTheDocument();
    expect(screen.getByText('Hono')).toBeInTheDocument(); // experience highlight
    expect(screen.getAllByText(/Terraform/).length).toBeGreaterThan(0); // in highlights + skills
    expect(screen.getByText('Formação')).toBeInTheDocument();
    expect(screen.getByText('Certificações')).toBeInTheDocument();
    expect(screen.getByText('Habilidades')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /github/i })).toHaveAttribute(
      'href',
      'https://github.com/tedeuxx',
    );
  });

  it('renders friendly link labels and a dash-less single graduation year', () => {
    const p: Profile = {
      ...profile,
      education: [{ institution: 'PUC-Rio', degree: "Bachelor's Degree", field: 'IT', start_date: '', end_date: '2010' }],
      // 'twitter' is not in the label map → falls back to the raw key.
      metadata: { linkedin: 'https://www.linkedin.com/in/x/', medium: 'https://x.medium.com', twitter: 'https://x.com/y' },
    };
    render(<ProfileView profile={p} />);
    // lowercase keys render with friendly casing
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', 'https://www.linkedin.com/in/x/');
    expect(screen.getByRole('link', { name: 'Medium' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'twitter' })).toBeInTheDocument(); // unknown key → raw fallback
    // no start date → just the year, no leading "–"
    expect(screen.getByText('2010')).toBeInTheDocument();
    expect(screen.queryByText('– 2010')).not.toBeInTheDocument();
  });

  it('omits empty sections', () => {
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
    render(<ProfileView profile={minimal} />);
    expect(screen.getByText('Tadeu Mendonça')).toBeInTheDocument();
    expect(screen.queryByText('Experiência')).not.toBeInTheDocument();
    expect(screen.queryByText('Habilidades')).not.toBeInTheDocument();
  });
});
