// Presentational CV (/frontend/design-system) — X-style profile: a cover strip + overlapping avatar,
// identity block, then Experience / Education / Certifications / Skills sections. Pure component
// (data comes from the page), so it's trivially testable.
import { type ReactNode } from 'react';
import { MapPin, ExternalLink, Briefcase, GraduationCap, Award, Sparkles } from 'lucide-react';
import type { Profile } from '../types/profile';

// "2021-01 – Atual"; when there's no start (e.g. only a graduation year), show just the end.
const dateRange = (start: string, end: string | null) => (start ? `${start} – ${end ?? 'Atual'}` : (end ?? ''));

// Friendly labels for the metadata link keys (kept lowercase in the data); falls back to the key.
const LINK_LABELS: Record<string, string> = { github: 'GitHub', linkedin: 'LinkedIn', medium: 'Medium', website: 'Website' };

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="border-t border-border px-4 py-5">
      <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
        <span className="text-primary">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function ProfileView({ profile }: { profile: Profile }) {
  return (
    <div>
      {/* Cover + avatar */}
      <div className="h-28 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
      <div className="px-4">
        <div className="-mt-10 flex items-end justify-between">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-background bg-primary text-3xl font-bold text-primary-foreground">
            {profile.name[0]?.toUpperCase()}
          </div>
        </div>
        <div className="mt-3">
          <h1 className="font-display text-3xl font-extrabold leading-tight">{profile.name}</h1>
          <p className="text-muted-foreground">{profile.headline}</p>
        </div>
        {profile.summary && <p className="mt-3 text-[15px] leading-relaxed text-foreground/90">{profile.summary}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {profile.location && (
            <span className="flex items-center gap-1">
              <MapPin size={15} /> {profile.location}
            </span>
          )}
          {Object.entries(profile.metadata).map(([key, url]) => (
            <a key={key} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium text-primary hover:underline">
              <ExternalLink size={15} /> {LINK_LABELS[key] ?? key}
            </a>
          ))}
        </div>
        <div className="h-4" />
      </div>

      {profile.experience.length > 0 && (
        <Section icon={<Briefcase size={18} />} title="Experiência">
          <div className="space-y-5">
            {profile.experience.map((item, i) => (
              <div key={i} className="relative border-l-2 border-border pl-4">
                <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                <div className="font-semibold">
                  {item.title} · <span className="text-muted-foreground">{item.company}</span>
                </div>
                <div className="text-sm text-muted-foreground">{dateRange(item.start_date, item.end_date)}</div>
                {item.description && <p className="mt-1 text-[15px] leading-relaxed text-foreground/90">{item.description}</p>}
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
        </Section>
      )}

      {profile.education.length > 0 && (
        <Section icon={<GraduationCap size={18} />} title="Formação">
          <div className="space-y-4">
            {profile.education.map((item, i) => (
              <div key={i}>
                <div className="font-semibold">
                  {item.degree}
                  {item.field ? `, ${item.field}` : ''} · <span className="text-muted-foreground">{item.institution}</span>
                </div>
                <div className="text-sm text-muted-foreground">{dateRange(item.start_date, item.end_date)}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {profile.certifications.length > 0 && (
        <Section icon={<Award size={18} />} title="Certificações">
          <ul className="space-y-2 text-[15px]">
            {profile.certifications.map((item, i) => (
              <li key={i}>
                {item.credential_url ? (
                  <a href={item.credential_url} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">
                    {item.name}
                  </a>
                ) : (
                  <span className="font-semibold">{item.name}</span>
                )}
                <span className="text-muted-foreground">
                  {' '}
                  · {item.issuer} ({item.issued_date})
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {Object.keys(profile.skills).length > 0 && (
        <Section icon={<Sparkles size={18} />} title="Habilidades">
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(profile.skills).map(([category, list]) => (
              <div key={category}>
                <div className="mb-2 text-sm font-semibold text-muted-foreground">{category}</div>
                <div className="flex flex-wrap gap-2">
                  {list.map((skill) => (
                    <span key={skill} className="rounded-md bg-muted px-2.5 py-0.5 text-sm text-foreground">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
