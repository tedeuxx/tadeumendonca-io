// Presentational CV (/frontend/design-system) — rendered only on /me, the one place the person
// appears. Brutalist: no cover gradient, no card. The portrait is the ONE carved exception to
// radius 0 (`.avatar-round`, ADR-0008 amendment). A numbered sticky label column
// carries each block, the body holds the rows. Pure component (data comes from the page).
//
// Formação and Certificações are SEPARATE blocks (they used to share the "education" bucket), and
// certifications render as badges: the official Credly image when the data carries one, otherwise a
// typographic seal. Visible headings are preserved ("Experiência" / "Formação" / "Certificações" /
// "Habilidades") — they are what the tests and the reader anchor on.
import { type ReactNode } from 'react';
import type { CertificationItem, Profile } from '../types/profile';
import { useT } from '../i18n';
import { SITE_URL } from '../lib/site';

// "2021 – Atual"; when there's no start (e.g. only a graduation year), show just the end. `present`
// is the localized "ongoing" label (Atual / Present) — the section chrome localizes; the CV *data*
// (profile.ts) does not.
const dateRange = (start: string, end: string | null, present: string) =>
  start ? `${start} – ${end ?? present}` : (end ?? '');

// Friendly labels for the metadata link keys (kept lowercase in the data); falls back to the key.
const LINK_LABELS: Record<string, string> = { github: 'GitHub', linkedin: 'LinkedIn', x: 'X', medium: 'Medium', website: 'Website' };

function Block({ index, title, children }: { index: string; title: string; children: ReactNode }) {
  return (
    // `data-print-block` gives the print stylesheet a stable per-section hook (#161). Targeting
    // `section:nth-of-type(n)` instead would silently re-target the moment a block is added or reordered,
    // and the failure would only show up in a PDF nobody re-reads.
    <section data-print-block={index} className="border-t border-border md:grid md:grid-cols-12">
      <div className="px-[--gutter] pb-4 pt-[clamp(2rem,4vw,3.5rem)] md:col-span-3 md:pr-6">
        <div className="md:sticky md:top-[calc(var(--header-h)+2rem)]">
          <span className="block font-mono text-[clamp(2rem,4vw,3.4rem)] font-bold leading-none tracking-tight text-primary">{index}</span>
          <h2 className="mt-2 label-mono text-foreground">{title}</h2>
        </div>
      </div>
      <div className="px-[--gutter] pb-[clamp(2.5rem,5vw,4rem)] md:col-span-9 md:border-l md:border-border md:pl-8 md:pt-[clamp(2rem,4vw,3.5rem)]">
        {children}
      </div>
    </section>
  );
}

/** Credly badge when the data has the image, otherwise a typographic seal built from the label. */
// A 4-square proficiency meter (AWS L100–L400 model): `level` squares filled, the rest muted. Mono,
// radius-0 squares — on-brand, and read as a recognized competency ladder, not an arbitrary self-bar.
function LevelMeter({ level }: { level: number }) {
  return (
    <span className="inline-flex gap-px" role="img" aria-label={`Proficiency level ${level} of 4`}>
      {[1, 2, 3, 4].map((i) => (
        <span key={i} className={`h-2 w-2 ${i <= level ? 'bg-foreground' : 'bg-border'}`} />
      ))}
    </span>
  );
}

// Does the credential's own NAME already identify who issued it? "AWS Certified Solutions Architect"
// does; "AI-DLC Ambassador" does not. The print edition suppresses the issuer line to fit one page
// (#161), which is free for the seven names carrying "AWS" and a real loss for the one that doesn't —
// unattributed, the credential closest to the AI-Engineer positioning reads as a self-styled title.
// So the issuer is dropped by MEANING rather than in bulk: matched on the acronym in parentheses
// ("Amazon Web Services (AWS)" → AWS), falling back to the issuer's first word.
const nameCarriesIssuer = (cert: CertificationItem): boolean => {
  const token = /\(([^)]+)\)/.exec(cert.issuer)?.[1] ?? cert.issuer.split(' ')[0];
  return cert.name.toLowerCase().includes(token.toLowerCase());
};

function CertBadge({ cert }: { cert: CertificationItem }) {
  const seal = cert.badge_image_url ? (
    <img src={cert.badge_image_url} alt="" aria-hidden="true" loading="lazy" className="h-16 w-16 shrink-0 object-contain" />
  ) : (
    <span
      aria-hidden="true"
      className="flex h-[68px] w-[62px] shrink-0 items-center justify-center whitespace-pre-line bg-primary text-center font-mono text-xs font-bold leading-tight text-primary-foreground"
      style={{ clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)' }}
    >
      {cert.badge_label ?? cert.issuer.slice(0, 3).toUpperCase()}
    </span>
  );

  const body = (
    <>
      {seal}
      <span className="flex min-w-0 flex-col gap-1">
        <span className="font-medium leading-tight">
          {cert.name}
          {/* Print-only, and only where the name does not already say who issued it. */}
          {!nameCarriesIssuer(cert) && <span className="hidden font-normal print:inline"> — {cert.issuer}</span>}
        </span>
        <span
          data-print-issuer=""
          className="font-mono text-[0.62rem] uppercase tracking-[0.1em] text-muted-foreground"
        >
          {cert.issuer}
          {cert.issued_date ? ` · ${cert.issued_date}` : ''}
        </span>
      </span>
    </>
  );

  const className = 'flex items-center gap-3 border border-border p-3';
  return cert.credential_url ? (
    <a href={cert.credential_url} target="_blank" rel="noreferrer" className={`${className} invert-hover`}>
      {body}
    </a>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function CVSection({ profile }: { profile: Profile }) {
  const t = useT();
  const present = t('cv.present');
  const hasEducation = profile.education.length > 0;
  const hasCertifications = profile.certifications.length > 0;

  return (
    // `data-print="cv"` is the single stable hook the print stylesheet targets to compact this page onto
    // one A4 sheet (#161). One hook, like `data-print="hide"` — the print rules never reach for Tailwind
    // utility classes, which would break on any restyle of the web view.
    <div data-print="cv">
      <header className="px-[--gutter] pb-[clamp(1.5rem,3vw,2.5rem)] pt-[clamp(2rem,5vw,4rem)]">
        {/* The portrait sits beside the name — full colour here, unlike the small greyscale one on
            the landing's aside. It is decorative: the <h1> right next to it already names the person. */}
        <div className="flex flex-wrap items-center gap-[clamp(1rem,3vw,2rem)]">
          {profile.avatar_url && (
            <img
              src={profile.avatar_url}
              alt=""
              aria-hidden="true"
              width={200}
              height={200}
              className="avatar-round h-[clamp(7rem,18vw,12.5rem)] w-[clamp(7rem,18vw,12.5rem)] shrink-0 border-2 border-border-strong object-cover"
            />
          )}
          <h1 className="text-[clamp(2.4rem,7vw,5.5rem)] font-bold uppercase leading-[0.9] tracking-[-0.04em]">{profile.name}</h1>
        </div>
        <p className="mt-3 font-mono text-sm uppercase tracking-[0.1em] text-muted-foreground">
          {profile.headline}
          {profile.location ? ` · ${profile.location}` : ''}
        </p>
        {profile.summary && <p className="mt-5 max-w-prose leading-relaxed text-foreground/90">{profile.summary}</p>}
        {/* Print-only contact line. The PDF used to hide the whole metadata row on the reasoning that
            "the PDF is generated FROM this page, so it must not carry a link back to itself" — sound
            while the PDF was a print of a page the reader was already standing on, and exactly wrong
            now that it is a one-page edition (#161) designed to be detached, attached to an email and
            dropped into an ATS. That artifact carried no email, no profile, and no URL: it made the
            AI-Engineer claim and stripped every pointer to the proof, on the surface that travels
            furthest. A self-link is redundant on screen and is the only route home on paper.
            Rendered as TEXT, not as links — a printed <a> is a dead string, so the URL has to be
            readable and typeable rather than clickable. */}
        <p aria-hidden="true" className="hidden font-mono text-[0.92em] print:block">
          {SITE_URL.replace(/^https?:\/\//, '')}
          {Object.values(profile.metadata).map((url) => ` · ${url.replace(/^https?:\/\/(www\.)?/, '')}`)}
        </p>
        {/* Metadata/contact row + the Download-CV control. Both are web chrome, hidden in the print
            render (#140) — on paper they are replaced by the plain-text line above (an unclickable
            bordered button is noise). The download is a plain static <a> to the build-time asset
            (no runtime JS, ADR-0002). */}
        <div className="mt-5 flex flex-wrap items-stretch" data-print="hide">
          {Object.entries(profile.metadata).map(([key, url]) => (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="-mb-px -mr-px border border-border px-3.5 py-2 font-mono text-xs uppercase tracking-wider invert-hover"
            >
              {LINK_LABELS[key] ?? key}
            </a>
          ))}
          <a
            href="/cv.pdf"
            download="luiz-tadeu-mendonca-cv.pdf"
            data-print="hide"
            className="-mb-px -mr-px border border-primary px-3.5 py-2 font-mono text-xs uppercase tracking-wider text-primary invert-hover"
          >
            {t('cv.download')}
          </a>
        </div>
      </header>

      {profile.experience.length > 0 && (
        <Block index="01" title={t('cv.experience')}>
          <div className="flex flex-col">
            {profile.experience.map((item, i) => (
              <div key={i} className="relative border-l-2 border-border py-3 pl-5">
                <span aria-hidden="true" className="absolute -left-[5px] top-[1.15rem] h-2 w-2 bg-primary" />
                <span className="block font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {dateRange(item.start_date, item.end_date, present)}
                </span>
                <span className="mt-1 block text-lg font-bold leading-tight">{item.title}</span>
                <span className="block text-muted-foreground">{item.company}</span>
                {item.description && <p className="mt-2 max-w-prose leading-relaxed text-foreground/90">{item.description}</p>}
                {item.highlights && item.highlights.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] text-foreground/90">
                    {item.highlights.map((h, j) => (
                      // `data-print-keep` marks the one highlight the print edition keeps (#161). The
                      // stylesheet hides the list and un-hides this; the flag is authored in the data
                      // (see `print_highlight_index`) so it points at a MEANING, not at a position that
                      // silently shifts when the list is reordered.
                      <li key={j} data-print-keep={j === item.print_highlight_index ? '' : undefined}>
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Block>
      )}

      {/* Formação and Certificações are separate blocks: a degree and a credential are not the
          same claim, and the certifications are badges rather than a list. */}
      {hasEducation && (
        <Block index="02" title={t('cv.education')}>
          <div className="flex flex-col gap-4">
            {profile.education.map((item, i) => (
              <div key={i}>
                <span className="block font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {dateRange(item.start_date, item.end_date, present)}
                </span>
                <span className="mt-1 block font-bold leading-tight">
                  {item.degree}
                  {item.field ? `, ${item.field}` : ''}
                </span>
                <span className="block text-muted-foreground">{item.institution}</span>
              </div>
            ))}
          </div>
        </Block>
      )}

      {hasCertifications && (
        <Block index="03" title={t('cv.certifications')}>
          <div className="grid gap-3 sm:grid-cols-2">
            {profile.certifications.map((cert, i) => (
              <CertBadge key={i} cert={cert} />
            ))}
          </div>
        </Block>
      )}

      {Object.keys(profile.skills).length > 0 && (
        <Block index="04" title={t('cv.skills')}>
          <div className="flex flex-col gap-6">
            {Object.entries(profile.skills).map(([category, list]) => (
              <div key={category}>
                <div className="mb-2 font-mono text-xs uppercase tracking-[0.12em] text-primary">{category}</div>
                <div className="flex flex-wrap">
                  {list.map((skill) => (
                    <span
                      key={skill.name}
                      className="-mb-px -mr-px inline-flex items-center gap-2 border border-border px-2.5 py-1.5 font-mono text-xs"
                    >
                      {skill.name}
                      {/* Print-only proficiency wording, low levels only — see the `cv.level1/2`
                          comment in the message catalog for why it exists and why 3–4 stay bare. */}
                      {skill.level === 1 || skill.level === 2 ? (
                        <span className="hidden print:inline"> ({t(`cv.level${skill.level}`)})</span>
                      ) : null}
                      {skill.level ? <LevelMeter level={skill.level} /> : null}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Block>
      )}
    </div>
  );
}
