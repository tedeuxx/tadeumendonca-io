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
  /**
   * Index into `highlights` of the ONE the print edition keeps, per role (#161). The one-page CV drops
   * the highlight lists wholesale, which left every AI statement in the PDF as self-description or a
   * certification while the role bodies read landing zones and CRM integration — the positioning
   * asserted rather than shown.
   *
   * #161 set this on ONE role only, and its rationale was that the kept entry named the single
   * highlight carrying built evidence. #522 superseded that: every role sets it, because a role
   * printing no bullet reads as a thin role, and the selection rule is now `print the item the role's
   * practice line does NOT already carry` — the `description` opens with a fixed-shape practice line
   * that already states the arc and the function, so a bullet repeating it spends the only printed
   * line on a restatement. Prefer a COMPLETED artifact: a printed CV whose sole evidence for a role is
   * something still in progress understates the role.
   *
   * An index, not a copy of the text: the highlight is authored once, bilingually, and the two
   * editions cannot drift. Positional in the array but SEMANTIC in intent — which is why it lives in
   * the data beside the highlights it points into, rather than as an `nth-child` in the stylesheet
   * that would silently point at different prose the first time the list is reordered.
   */
  print_highlight_index?: number;
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
  /** Portrait shown on /me (the landing stays impersonal apart from the small aside avatar). */
  avatar_url?: string;
  summary?: string;
  location?: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  skills: Record<string, SkillItem[]>;
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
  /** See `ExperienceItem.print_highlight_index` — locale-independent, the arrays are parallel. */
  print_highlight_index?: number;
}

export interface EducationSource {
  institution: string;
  degree: Localized<string>;
  field?: Localized<string>;
  start_date: string;
  end_date: string | null;
}

/** Skill proficiency on a 4-level scale, mirroring AWS's own L100–L400 ladder: 1 = foundational,
 * 4 = expert. Deliberately caps AI skills below 4 (the field is too new for anyone to be an expert). */
export type SkillLevel = 1 | 2 | 3 | 4;

/** A resolved skill: a name, optionally with a proficiency level. Spoken languages carry no level —
 * their name already says "Native" / "Advanced". */
export interface SkillItem {
  name: string;
  level?: SkillLevel;
}

/** Authoring shape for a leveled technical skill (the name is English in both locales). */
export interface SkillItemSource {
  /**
   * Written ONCE for technical skills, because `Python` is `Python` in both editions — that is the
   * common case and it stays a plain string.
   *
   * `Localized<string>` exists for the one group where the name genuinely differs: spoken languages
   * (`Português` / `Portuguese`). Before 2026-07-31 that group avoided this by using the prose shape
   * below and encoding the level IN the name ("Português (nativo)"), which meant it was the only
   * category on the page without the proficiency meter. Putting it on the same 100–400 scale as
   * everything else is what forced the name to localize.
   */
  name: string | Localized<string>;
  level: SkillLevel;
}

export interface SkillGroupSource {
  label: Localized<string>;
  /** Leveled technical skills (English names, written once), OR a localized string list for
   * prose-like groups (spoken languages), which carry no level. */
  items: SkillItemSource[] | Localized<string[]>;
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
