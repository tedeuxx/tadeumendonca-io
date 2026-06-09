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
    expect(screen.getByText('Experience')).toBeInTheDocument();
    expect(screen.getByText('Hono')).toBeInTheDocument(); // experience highlight
    expect(screen.getAllByText(/Terraform/).length).toBeGreaterThan(0); // in highlights + skills
    expect(screen.getByText('Education')).toBeInTheDocument();
    expect(screen.getByText('Certifications')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /github/i })).toHaveAttribute(
      'href',
      'https://github.com/tedeuxx',
    );
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
    expect(screen.queryByText('Experience')).not.toBeInTheDocument();
    expect(screen.queryByText('Skills')).not.toBeInTheDocument();
  });
});
