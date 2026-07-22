// Presentational CV (/frontend/design-system) — rendered only on /cv, the one place the person
// appears. Brutalist: no cover gradient, no circular avatar, no card. A numbered sticky label column
// carries each block, the body holds the rows. Pure component (data comes from the page).
//
// Formação and Certificações are SEPARATE blocks (they used to share the "education" bucket), and
// certifications render as badges: the official Credly image when the data carries one, otherwise a
// typographic seal. Visible headings are preserved ("Experiência" / "Formação" / "Certificações" /
// "Habilidades") — they are what the tests and the reader anchor on.
import { type ReactNode } from 'react';
import type { CertificationItem, Profile } from '../types/profile';

// "2021 – Atual"; when there's no start (e.g. only a graduation year), show just the end.
const dateRange = (start: string, end: string | null) => (start ? `${start} – ${end ?? 'Atual'}` : (end ?? ''));

// Friendly labels for the metadata link keys (kept lowercase in the data); falls back to the key.
const LINK_LABELS: Record<string, string> = { github: 'GitHub', linkedin: 'LinkedIn', medium: 'Medium', website: 'Website' };

function Block({ index, title, children }: { index: string; title: string; children: ReactNode }) {
  return (
    <section className="border-t border-border md:grid md:grid-cols-12">
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
        <span className="font-medium leading-tight">{cert.name}</span>
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.1em] text-muted-foreground">
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
  const hasEducation = profile.education.length > 0;
  const hasCertifications = profile.certifications.length > 0;

  return (
    <div>
      <header className="px-[--gutter] pb-[clamp(1.5rem,3vw,2.5rem)] pt-[clamp(2rem,5vw,4rem)]">
        <h1 className="text-[clamp(2.4rem,7vw,5.5rem)] font-bold uppercase leading-[0.9] tracking-[-0.04em]">{profile.name}</h1>
        <p className="mt-3 font-mono text-sm uppercase tracking-[0.1em] text-muted-foreground">
          {profile.headline}
          {profile.location ? ` · ${profile.location}` : ''}
        </p>
        {profile.summary && <p className="mt-5 max-w-prose leading-relaxed text-foreground/90">{profile.summary}</p>}
        {Object.keys(profile.metadata).length > 0 && (
          <div className="mt-5 flex flex-wrap">
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
          </div>
        )}
      </header>

      {profile.experience.length > 0 && (
        <Block index="01" title="Experiência">
          <div className="flex flex-col">
            {profile.experience.map((item, i) => (
              <div key={i} className="relative border-l-2 border-border py-3 pl-5">
                <span aria-hidden="true" className="absolute -left-[5px] top-[1.15rem] h-2 w-2 bg-primary" />
                <span className="block font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {dateRange(item.start_date, item.end_date)}
                </span>
                <span className="mt-1 block text-lg font-bold leading-tight">{item.title}</span>
                <span className="block text-muted-foreground">{item.company}</span>
                {item.description && <p className="mt-2 max-w-prose leading-relaxed text-foreground/90">{item.description}</p>}
                {item.highlights && item.highlights.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] text-foreground/90">
                    {item.highlights.map((h, j) => (
                      <li key={j}>{h}</li>
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
        <Block index="02" title="Formação">
          <div className="flex flex-col gap-4">
            {profile.education.map((item, i) => (
              <div key={i}>
                <span className="block font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {dateRange(item.start_date, item.end_date)}
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
        <Block index="03" title="Certificações">
          <div className="grid gap-3 sm:grid-cols-2">
            {profile.certifications.map((cert, i) => (
              <CertBadge key={i} cert={cert} />
            ))}
          </div>
        </Block>
      )}

      {Object.keys(profile.skills).length > 0 && (
        <Block index="04" title="Habilidades">
          <div className="flex flex-col gap-6">
            {Object.entries(profile.skills).map(([category, list]) => (
              <div key={category}>
                <div className="mb-2 font-mono text-xs uppercase tracking-[0.12em] text-primary">{category}</div>
                <div className="flex flex-wrap">
                  {list.map((skill) => (
                    <span key={skill} className="-mb-px -mr-px border border-border px-2.5 py-1.5 font-mono text-xs">
                      {skill}
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
