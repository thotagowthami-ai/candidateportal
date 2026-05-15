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
};
