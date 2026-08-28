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
   * Index into `highlights` of the ONE the print edition keeps for a role (#161). The compressed CV
   * drops the highlight lists wholesale, which left every AI statement in the PDF as self-description
   * or a certification while the role bodies read landing zones and CRM integration — the positioning
   * asserted rather than shown.
   *
   * ~~SET ON THE CURRENT ROLE AGAIN SINCE #542 (2026-08-27) — index 3, the one bullet of that role's
   * six written as building.~~ STRUCK 2026-08-28 (#566), and it was false TWICE rather than stale
   * once. (1) The index is **4** — it moved on the owner's own reading of the printed CV, because
   * index 3 is a one-off engagement in a sector he does not work in. (2) `the one bullet` was the
   * load-bearing half and it died independently of the number: the same slice restored the current
   * role's fifth bullet to the ongoing verb he wrote (`Developing` / `Desenvolvendo`), so **two** of
   * that role's six are now written as building — index 3 (`Built, hands-on,`) and index 4. A reader
   * opening this file to learn the rule met a false statement of the current state first, which is why
   * this is struck in place rather than quietly corrected.
   *
   * SET ON THE CURRENT ROLE SINCE #542 (2026-08-27), AT INDEX 4 SINCE #566 (2026-08-28).
   * It was unset on every role between #522 and #542 for the measured reason
   * below, and what changed is not the measurement but the ceiling: the owner lifted ADR-0034's
   * two-page budget («pode aumentar sem problemas»), the artifact is three pages, and a printed bullet
   * fits. Read the next paragraph as the record of the constraint, which still binds at its own number.
   *
   * WAS UNSET ON EVERY ROLE SINCE #522, and the reason was a measured page budget rather than a change
   * of mind. #522 gave every `description` a fixed-shape practice line; a practice line and a printed
   * bullet cost about the same, and the two-page budget (`e2e/cv-pdf.spec.ts`) fits one of them. Built
   * and counted rather than inferred: practice lines with any bullet at all — including the SHORTEST
   * one in the array — render 3 pages; practice lines with none render 2. The practice line wins,
   * because it is the only field that exists identically on `/me`, `/cv.pdf` and LinkedIn.
   *
   * THE RULE FOR SETTING IT SURVIVES, for whenever the budget moves: print the item the role's
   * practice line does NOT already carry, and prefer a COMPLETED artifact — a printed CV whose sole
   * evidence for a role is something still in progress understates the role. Both were paid for: the
   * current role once printed a bullet naming the same unfinished item its practice line named.
   * Setting this on any role changes the page count, so rebuild and count before doing it.
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
