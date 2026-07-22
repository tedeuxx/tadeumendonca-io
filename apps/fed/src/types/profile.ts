// Mirrors the BFF Profile entity (snake_case — no mapping layer, /frontend/framework-react).
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
