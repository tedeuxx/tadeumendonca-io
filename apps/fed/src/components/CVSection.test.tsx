import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { CVSection } from './CVSection';
import type { Profile } from '../types/profile';
import type { JourneyFrame } from '../data/journey';
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
    // "Skills", not "Habilidades" — the heading is deliberately untranslated in the pt edition
    // (owner, 2026-07-31), because English IS the pt-BR usage for this section of a CV.
    expect(screen.getByText('Skills')).toBeInTheDocument();
    // Each leveled skill shows the 4-square proficiency meter (AWS L100–L400 model).
    expect(screen.getAllByRole('img', { name: /Proficiency level/ }).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /github/i })).toHaveAttribute('href', 'https://github.com/tedeuxx');
  });

  it('numbers the credential sequence 01–04, each on its own block', () => {
    const { container } = renderWithLocale(<CVSection profile={profile} />);
    // `Block`'s `index` was widened to `string | null` at #127 so `JourneyStrip` could render an
    // unnumbered fifth block, and narrowed back to `string` at #516 when that component was deleted. This
    // is what held through both: the four blocks that ARE credentials — Experience, Education,
    // Certifications, Skills — carry their numeral and their print hook. Read off the DOM in document
    // order rather than checked one by one, so a block that loses its number, gains one, or is reordered
    // all read as the same failure.
    const numbered = [...container.querySelectorAll('[data-print-block]')];
    expect(numbered.map((s) => s.getAttribute('data-print-block'))).toEqual(['01', '02', '03', '04']);
    // The hook and the visible numeral are two different things — the hook is for the print stylesheet,
    // the numeral is what the reader sees on the rail — and either can be lost without the other.
    expect(numbered.map((s) => s.querySelector('span')?.textContent)).toEqual(['01', '02', '03', '04']);
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

  // ONE CALIBRATION DEVICE, NOT TWO (#317). This test used to assert the opposite — that levels 1 and 2
  // carry print-only wording (`(working)` / `(foundational)`) and 3–4 print bare. That was right while
  // the meter was HIDDEN in print for the one-page budget: with the graphic gone, a level-1 keyword
  // printed beside a level-4 one as equals, and the words restored the calibration.
  //
  // The meter is back on the sheet, so the words became a second device saying the same thing — and a
  // one-sided one, since only the diminishing halves were ever worded. Every level-2 entry printed
  // `(working)` while every 3 and 4 printed bare, which on a recruiter artifact reads as hedging the
  // bottom of the list rather than rating all of it.
  //
  // Asserted as an ABSENCE plus a presence, because deleting the old test would have left nothing
  // saying which device won: the meter must be there for EVERY levelled skill, and no print-only
  // wording may come back beside it.
  it('rates every skill with the meter alone — no second, one-sided wording', () => {
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
    const { container } = renderWithLocale(<CVSection profile={p} />, { locale: 'en' });
    expect(container.querySelectorAll('[role="img"]')).toHaveLength(4); // one meter per skill
    expect(screen.queryByText('(working)', { exact: false })).toBeNull();
    expect(screen.queryByText('(foundational)', { exact: false })).toBeNull();
    // The print-only span is the shape the retired gloss used. Nothing in this section may reintroduce
    // it — a second device would have to be argued, not slipped back in beside the meter.
    expect(container.querySelectorAll('.print\\:inline')).toHaveLength(0);
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
    expect(screen.queryByText('Skills')).not.toBeInTheDocument();
  });
});

// The journey photographs, fitted inside the work-experience entries (#516 slice 2b).
//
// WHAT THIS FILE CAN AND CANNOT PROVE. jsdom has no layout engine and no cascade: it reports zero-sized
// rects and applies no print stylesheet, so "the figure sits below the prose at 1280" and "the figure is
// absent from the PDF" are not assertable here. Those live in `e2e/journey-photos.spec.ts` and
// `e2e/cv-pdf.spec.ts`. What IS assertable here is everything structural: which entry a frame lands in,
// where in that entry, the attributes that reserve the box, the two prose jobs kept apart, and the print
// hook being EMITTED — which is a different claim from it being WIRED, and both are needed.
//
// The fixtures are this file's own, deliberately. Importing the real four would make every assertion below
// agree with the shipped data by construction and say nothing about the component.
const FRAME_A: JourneyFrame = {
  photo: { src: '/photos/a.jpg', width: 660, height: 880 },
  engagement: { company: 'tadeumendonca.io', start_date: '2026-01' },
  alt: 'A man at a desk',
  caption: 'Why it is on the page',
};
const FRAME_ORPHAN: JourneyFrame = {
  ...FRAME_A,
  photo: { src: '/photos/orphan.jpg', width: 660, height: 880 },
  engagement: { company: 'Nowhere Ltd', start_date: '1999-01' },
};

const twoRoles: Profile = {
  ...profile,
  experience: [
    profile.experience[0],
    { ...profile.experience[0], company: 'Elsewhere', start_date: '2020-01', end_date: '2025-12' },
  ],
};

describe('CVSection — the journey photographs inside the experience entries', () => {
  it('renders nothing at all when the prop is omitted', () => {
    // THE UNIT HALF OF THE FALSIFIER for the owner's constraint — "nao e esperada alteracao nas entradas
    // de work experiences". With the prop omitted this component must render exactly the tree it rendered
    // before this slice; the other half is `/cv.pdf`, which the E2E page count holds.
    const { container } = renderWithLocale(<CVSection profile={profile} />);
    expect(container.querySelectorAll('[data-journey-photo]')).toHaveLength(0);
    expect(container.querySelectorAll('figure')).toHaveLength(0);
  });

  it('places the frame inside the entry its attribution names, and inside no other', () => {
    const { container } = renderWithLocale(<CVSection profile={twoRoles} journey={[FRAME_A]} />);
    const entries = [...container.querySelectorAll('[data-print-block="01"] > div:last-child > div > div')];
    expect(entries).toHaveLength(2);
    // The first entry is the one FRAME_A names; the second names a different company and start_date.
    expect(entries[0].querySelectorAll('[data-journey-photo]')).toHaveLength(1);
    expect(entries[1].querySelectorAll('[data-journey-photo]')).toHaveLength(0);
  });

  it('renders a frame whose attribution matches no entry nowhere at all', () => {
    // `assertJourneyShape` refuses this at module load, so it cannot happen with the shipped data. Asserted
    // anyway, because the component's own behaviour should not be a property inherited from a guard one
    // module over: a lookup that fell back to "the first entry" would publish a false attribution, and the
    // container is the assertion.
    const { container } = renderWithLocale(<CVSection profile={twoRoles} journey={[FRAME_ORPHAN]} />);
    expect(container.querySelectorAll('[data-journey-photo]')).toHaveLength(0);
  });

  it('is the LAST child of its entry — nothing of the entry reads after the photograph', () => {
    const { container } = renderWithLocale(<CVSection profile={twoRoles} journey={[FRAME_A]} />);
    const entry = container.querySelector('[data-print-block="01"] > div:last-child > div > div')!;
    expect(entry.lastElementChild!.tagName).toBe('FIGURE');
    // And the entry's own children are all still there, in front of it: the date row, the title, the
    // company, the description and the highlight list.
    expect(entry.querySelector('p')!.textContent).toBe('Platform work.');
    expect(entry.querySelectorAll('li')).toHaveLength(2);
  });

  it('is a <figure> and not a <div>, which is what keeps the print role count honest', () => {
    // `e2e/cv-pdf.spec.ts` counts roles with `[data-print-block="01"] > div:last-child > div > div`. A
    // `div` at that depth — a sibling of the entry, or a wrapper around the figure — inflates the
    // on-screen count, hides in print, and reddens that assertion for a reason that has nothing to do with
    // a role. Asserted here so the failure names the cause rather than the page count.
    const { container } = renderWithLocale(<CVSection profile={twoRoles} journey={[FRAME_A]} />);
    const counted = container.querySelectorAll('[data-print-block="01"] > div:last-child > div > div');
    expect(counted).toHaveLength(twoRoles.experience.length);
    expect(container.querySelector('[data-journey-photo]')!.tagName).toBe('FIGURE');
  });

  // ── The move beside the entry (#516 slice 2c) ───────────────────────────────────────────────────
  // WHAT THESE THREE CAN HONESTLY CLAIM. jsdom has no layout engine, so "the figure is to the LEFT of the
  // prose" is not assertable here and is not asserted — that is measured with real rects in
  // `e2e/journey-photos.spec.ts`. What is assertable is the wiring the geometry depends on: which entry
  // becomes a grid, which track each item is placed in, and the one class that must never appear.
  it('turns an entry into a two-track layout ONLY when it carries a frame', () => {
    const { container } = renderWithLocale(<CVSection profile={twoRoles} journey={[FRAME_A]} />);
    const entries = [...container.querySelectorAll('[data-print-block="01"] > div:last-child > div > div')];
    expect(entries[0].className).toContain('md:grid');
    // The photoless role keeps the block it is today. A uniform grid would open the left track on every
    // entry, and a photoless one would carry an empty 14rem gutter that means nothing to a reader.
    //
    // THIS IS NOW THE ONLY PLACE THE PHOTOLESS BRANCH IS EXERCISED (#548): the real CV has a frame on
    // every role, so production data reaches only the other side. The fixture is what keeps the branch
    // honest, and it is why the fixture exists rather than the test running against `resolveJourney`.
    expect(entries[1].className).not.toContain('md:grid');
    // Below `md` neither is a grid at all: the section has no left band there, and a phone keeps the
    // photograph under the entry. Asserted on the ABSENCE of an unprefixed `grid`, which is what a
    // dropped breakpoint prefix would leave behind.
    expect(entries[0].className.split(' ')).not.toContain('grid');
  });

  it('places the figure in the left track of row one, beside the prose rather than under it', () => {
    const { container } = renderWithLocale(<CVSection profile={twoRoles} journey={[FRAME_A]} />);
    const entry = container.querySelector('[data-print-block="01"] > div:last-child > div > div')!;
    const prose = entry.querySelector(':scope > div')!;
    const figure = container.querySelector('[data-journey-photo]')!;
    expect(prose.className).toContain('md:col-start-2');
    expect(figure.className).toContain('md:col-start-1');
    // Without the explicit row the auto-placement cursor, already past row 1 after the prose, would put
    // the figure on row 2 — under the prose, which is the layout this slice replaced.
    expect(figure.className).toContain('md:row-start-1');
    expect(figure.className).toContain('md:self-start');
    // The prose track is ONE grid item, and it is one level below the depth `e2e/cv-pdf.spec.ts` counts
    // roles at. Exactly one direct-child div in an entry that also holds a figure and the rail marker.
    expect(entry.querySelectorAll(':scope > div')).toHaveLength(1);
  });

  it('does not inherit the sticky behaviour of the band it now sits beside', () => {
    // The label column is `md:sticky` (see `Block`). A per-entry photograph carrying that would unpin
    // from the role it documents and travel down the whole section as the reader scrolls — visible only
    // to someone scrolling a built page, which is why it is nailed down here.
    const { container } = renderWithLocale(<CVSection profile={twoRoles} journey={[FRAME_A]} />);
    expect(container.querySelector('[data-journey-photo]')!.className).not.toContain('sticky');
  });

  it('opts out of the print edition through the stable hook', () => {
    // `/cv.pdf` is printed from /en/me and held to two A4 pages. Without this attribute a 3:4 photograph
    // per role lands on a third sheet and that guard goes red — on a test whose own comment warns against
    // raising the number to go green. Asserted on the ATTRIBUTE because jsdom applies no print stylesheet;
    // the rendered effect is the E2E's job, the hook being emitted is this one's.
    const { container } = renderWithLocale(<CVSection profile={twoRoles} journey={[FRAME_A]} />);
    expect(container.querySelector('[data-journey-photo]')).toHaveAttribute('data-print', 'hide');
  });

  it('reserves the box with the committed file\u2019s own intrinsic size, and defers the bytes', () => {
    const { container } = renderWithLocale(<CVSection profile={twoRoles} journey={[FRAME_A]} />);
    const img = container.querySelector('[data-journey-photo] img')!;
    expect(img).toHaveAttribute('width', String(FRAME_A.photo.width));
    expect(img).toHaveAttribute('height', String(FRAME_A.photo.height));
    // Guards the guard: a registry yielding 0 would satisfy the two assertions above while reserving
    // nothing, which is the exact defect the attributes exist to prevent.
    expect(FRAME_A.photo.width).toBeGreaterThan(0);
    expect(FRAME_A.photo.height).toBeGreaterThan(0);
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
  });

  it('gives a reader who cannot see it a description, not the caption', () => {
    const { container } = renderWithLocale(<CVSection profile={twoRoles} journey={[FRAME_A]} />);
    const img = container.querySelector('[data-journey-photo] img')!;
    const figcaption = container.querySelector('[data-journey-photo] figcaption')!;
    expect(img.getAttribute('alt')).toBe(FRAME_A.alt);
    expect(figcaption.textContent).toBe(FRAME_A.caption);
    // Two jobs, two strings. Passing the caption into `alt` would leave a screen-reader user with the
    // editorial line and none of the picture, and every other assertion here would still be green.
    expect(img.getAttribute('alt')).not.toBe(figcaption.textContent);
  });

  it('does not extend the round-portrait exception to a photograph', () => {
    // `.avatar-round` is this design system's single carved exception to radius 0 and belongs to the
    // portrait alone. Asserted rather than assumed because it is the one class an author reaching for
    // "make the photos look nice" would copy.
    const { container } = renderWithLocale(<CVSection profile={twoRoles} journey={[FRAME_A]} />);
    const img = container.querySelector('[data-journey-photo] img')!;
    expect(img).not.toHaveClass('avatar-round');
    expect(img).toHaveClass('border', 'border-border');
  });
});
