// Domain entity types. snake_case everywhere (DynamoDB attribute = TS field = JSON) — no mapping
// layer (/backend/dynamodb). Phase 1 ships `profile`; posts/articles/subscriptions/audits follow.

export interface ExperienceItem {
  company: string;
  title: string;
  start_date: string; // ISO yyyy-mm
  end_date: string | null; // null = current
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
  profile_id: string; // "me" — single-item table
  name: string;
  headline: string;
  summary?: string;
  location?: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  skills: Record<string, string[]>; // category → skills
  metadata: Record<string, string>; // links (github, linkedin, …)
  updated_at?: string;
}
