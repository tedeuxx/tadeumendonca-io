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
  issued_date: string;
  credential_url?: string;
}

export interface Profile {
  profile_id: string;
  name: string;
  headline: string;
  summary?: string;
  location?: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  skills: Record<string, string[]>;
  metadata: Record<string, string>;
  updated_at?: string;
}
