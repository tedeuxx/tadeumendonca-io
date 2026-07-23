// The CV profile model, in two shapes.
//
// `ProfileSource` is what `data/profile.ts` AUTHORS: the translatable leaves carry both locales,
// everything structural (dates, employers, URLs) is written once. `Profile` is what COMPONENTS read:
// a flat, single-locale view produced by `resolveProfile`. Keeping the two apart means the bilingual
// CV shares its structure instead of mirroring it — a parallel pt/en copy of the whole object would
// duplicate every date and employer and trip the duplication gate (the lesson from `i18n/messages.ts`).
//
// snake_case at the data boundary is ADR-0012.

/** A value authored in both locales; `resolveProfile` flattens it to the active one. */
export type Localized<T> = { pt: T; en: T };

export interface ExperienceItem {
  company: string;
  title: string;
  start_date: string;
  end_date: string | null;
  description?: string;
  highlights?: string[];
}

export interface EducationItem {
  institution: string;
  degree: string;
  field?: string;
  start_date: string;
  end_date: string | null;
}

export interface CertificationItem {
  name: string;
  issuer: string;
  issued_date?: string;
  credential_url?: string;
  /** Official badge image (Credly). Absent → the CV falls back to a typographic seal. */
  badge_image_url?: string;
  /** Two short lines for the fallback seal, e.g. 'SA\nPRO'. */
  badge_label?: string;
}

export interface Profile {
  profile_id: string;
  name: string;
  headline: string;
  /** Portrait shown on /cv (the landing stays impersonal apart from the small aside avatar). */
  avatar_url?: string;
  summary?: string;
  location?: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  skills: Record<string, string[]>;
  metadata: Record<string, string>;
  updated_at?: string;
}

// ---- Authoring shapes (bilingual source) ----
//
// Employers, official job titles, certification names and technical terms stay ENGLISH in both
// locales: they are proper nouns, and a pt-BR senior CV reads them in English. Only prose,
// category labels and spoken languages localize.

export interface ExperienceSource {
  company: string;
  /** The official job title — English in both locales. */
  title: string;
  start_date: string;
  end_date: string | null;
  description?: Localized<string>;
  highlights?: Localized<string[]>;
}

export interface EducationSource {
  institution: string;
  degree: Localized<string>;
  field?: Localized<string>;
  start_date: string;
  end_date: string | null;
}

export interface SkillGroupSource {
  label: Localized<string>;
  /** Technical terms are English in both, so they are written once; prose-like groups localize. */
  items: string[] | Localized<string[]>;
}

export interface ProfileSource {
  profile_id: string;
  name: string;
  headline: Localized<string>;
  avatar_url?: string;
  summary?: Localized<string>;
  location?: Localized<string>;
  experience: ExperienceSource[];
  education: EducationSource[];
  /** Official certification names — English in both locales. */
  certifications: CertificationItem[];
  skills: SkillGroupSource[];
  metadata: Record<string, string>;
  updated_at?: string;
}
