export type ResumeEducationEntry = {
  degree: string;
  institution?: string;
  year?: string;
};

export type ResumeExperienceEntry = {
  role?: string;
  company?: string;
  duration?: string;
};

export type ResumeParsed = {
  fullName?: string;
  objective?: string;
  linkedin?: string;
  github?: string;
  emails: string[];
  phones: string[];
  skills: string[];
  education: ResumeEducationEntry[];
  experience: ResumeExperienceEntry[];
  certifications: string[];
  projects: string[];
  // Profile enrichment fields (set via updateProfile / preserved on re-upload)
  current_role?: string;
  location?: string;
  industry?: string;
  summary?: string;
  experience_years?: number;
  [key: string]: unknown; // allow additional dynamic fields
};
