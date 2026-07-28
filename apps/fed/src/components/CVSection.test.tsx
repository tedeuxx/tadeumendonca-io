import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { CVSection } from './CVSection';
import type { Profile } from '../types/profile';
import { renderWithLocale } from '../test-utils';

const profile: Profile = {
  profile_id: 'me',
  name: 'Tadeu Mendonça',
  headline: 'AI Engineer',
  summary: 'Builds agents.',
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
  skills: { cloud: [{ name: 'AWS', level: 4 }, { name: 'Terraform', level: 3 }] },
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
    // Each leveled skill shows the 4-square proficiency meter (AWS L100–L400 model).
    expect(screen.getAllByRole('img', { name: /Proficiency level/ }).length).toBeGreaterThan(0);
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

  // The one-page PDF (#161) keeps exactly one highlight — the one showing something agentic actually
  // BUILT — because dropping the lists wholesale left every AI statement in the CV as self-description
  // or a certification. The stylesheet finds it by this attribute; the attribute comes from the DATA,
  // so it names a meaning rather than a position that shifts when the list is reordered.
  it('marks only the authored highlight for the print edition', () => {
    const p: Profile = {
      ...profile,
      experience: [
        { ...profile.experience[0], highlights: ['adopted a thing', 'BUILT a thing'], print_highlight_index: 1 },
        // A role that names none keeps its highlights on screen and marks nothing for print.
        { ...profile.experience[0], company: 'Elsewhere', highlights: ['also relevant'] },
      ],
    };
    renderWithLocale(<CVSection profile={p} />);
    expect(screen.getByText('adopted a thing')).not.toHaveAttribute('data-print-keep');
    expect(screen.getByText('also relevant')).not.toHaveAttribute('data-print-keep');
    expect(screen.getByText('BUILT a thing')).toHaveAttribute('data-print-keep');
    expect(document.querySelectorAll('[data-print-keep]')).toHaveLength(1);
  });

  // Reflowed inline for print, the 4-square meter is dropped — which printed a level-1 keyword beside a
  // level-4 one as equals, flattening a deliberate honesty device into an over-claim. The low levels get
  // print-only wording; 3 and 4 stay bare, because they are not what the flattening exaggerated.
  it('words only the low proficiency levels for print', () => {
    const p: Profile = {
      ...profile,
      skills: {
        cloud: [
          { name: 'AWS Lambda', level: 4 },
          { name: 'Terraform', level: 3 },
          { name: 'Prompt Engineering', level: 2 },
          { name: 'Amazon Bedrock', level: 1 },
        ],
      },
    };
    // English: the PDF is printed from the English canonical edition (ADR-0024).
    renderWithLocale(<CVSection profile={p} />, { locale: 'en' });
    // Leading space is part of the node — it separates the wording from the skill name in print.
    expect(screen.getByText('(working)', { exact: false })).toHaveClass('print:inline');
    expect(screen.getByText('(foundational)', { exact: false })).toHaveClass('print:inline');
    // Two wordings for four skills — the levels that already read honestly are left alone.
    expect(document.querySelectorAll('.print\\:inline')).toHaveLength(2);
  });

  // The print edition drops the issuer line to fit one page (#161) — free for "AWS Certified …", a real
  // loss for a credential whose name does not name its issuer, which unattributed reads as a self-styled
  // title. So the issuer is carried into the NAME exactly where the name lacks it. Print-only, hence the
  // class assertions: jsdom has no print media, so visibility here is expressed by `hidden print:inline`.
  it('attributes only the credentials whose name does not already name the issuer', () => {
    const p: Profile = {
      ...profile,
      certifications: [
        // Acronym in parentheses, present in the name → no attribution added.
        { name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services (AWS)' },
        // Same issuer, but the name never says AWS → attributed.
        { name: 'AI-DLC Ambassador', issuer: 'Amazon Web Services (AWS)' },
        // No parentheses → falls back to the issuer's first word, which the name carries.
        { name: 'Google Cloud Architect', issuer: 'Google Cloud' },
      ],
    };
    renderWithLocale(<CVSection profile={p} />);
    const attributed = screen.getByText('— Amazon Web Services (AWS)', { exact: false });
    expect(attributed).toHaveClass('print:inline');
    expect(attributed.parentElement?.textContent).toContain('AI-DLC Ambassador');
    // Exactly one of the three is attributed.
    expect(document.querySelectorAll('.print\\:inline')).toHaveLength(1);
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

  it('offers a static Download-CV link to the build-time PDF, localized in both locales (#140)', () => {
    // The PDF is a static asset emitted at build (scripts/prerender.mjs), reached by a plain <a download>
    // — no runtime JS (ADR-0002). The label is chrome, so it localizes with the rest of the section.
    const { unmount } = renderWithLocale(<CVSection profile={profile} />, { locale: 'en' });
    const en = screen.getByRole('link', { name: 'Download CV (PDF)' });
    expect(en).toHaveAttribute('href', '/cv.pdf');
    expect(en).toHaveAttribute('download', 'luiz-tadeu-mendonca-cv.pdf');
    unmount();

    renderWithLocale(<CVSection profile={profile} />, { locale: 'pt' });
    const pt = screen.getByRole('link', { name: 'Baixar CV (PDF)' });
    expect(pt).toHaveAttribute('href', '/cv.pdf');
    expect(pt).toHaveAttribute('download', 'luiz-tadeu-mendonca-cv.pdf');
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
