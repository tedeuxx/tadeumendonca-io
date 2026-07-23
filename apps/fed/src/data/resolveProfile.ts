// Flattens the bilingual `ProfileSource` into the single-locale `Profile` the components read.
// Pure and total: every localized leaf has both locales by construction (the type enforces it), so
// there is no fallback path and no way to ship a half-translated CV — a missing translation is a
// compile error, not a runtime blank. Same guarantee the message catalog gets from its `Entry` type.
import type {
  Localized,
  Profile,
  ProfileSource,
  SkillGroupSource,
} from '../types/profile';
import type { Locale } from '../i18n/config';

const pick = <T,>(value: Localized<T>, locale: Locale): T => value[locale];

/** Localized items ({pt,en}) resolve; a plain array is shared by both locales (technical terms). */
const pickItems = (items: SkillGroupSource['items'], locale: Locale): string[] =>
  Array.isArray(items) ? items : pick(items, locale);

export function resolveProfile(source: ProfileSource, locale: Locale): Profile {
  return {
    profile_id: source.profile_id,
    name: source.name,
    headline: pick(source.headline, locale),
    avatar_url: source.avatar_url,
    summary: source.summary && pick(source.summary, locale),
    location: source.location && pick(source.location, locale),
    experience: source.experience.map((item) => ({
      company: item.company,
      title: item.title,
      start_date: item.start_date,
      end_date: item.end_date,
      description: item.description && pick(item.description, locale),
      highlights: item.highlights && pick(item.highlights, locale),
    })),
    education: source.education.map((item) => ({
      institution: item.institution,
      degree: pick(item.degree, locale),
      field: item.field && pick(item.field, locale),
      start_date: item.start_date,
      end_date: item.end_date,
    })),
    certifications: source.certifications,
    // Insertion order is the display order, and string keys preserve it — the authored group order
    // survives the flattening.
    skills: Object.fromEntries(
      source.skills.map((group) => [pick(group.label, locale), pickItems(group.items, locale)]),
    ),
    metadata: source.metadata,
    updated_at: source.updated_at,
  };
}
