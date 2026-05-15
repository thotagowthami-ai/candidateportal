import { ResumeParsed } from './schemas/user.schema';
export declare class ResumeParserService {
    private pdfParseFn;
    private readonly knownSkills;
    parseFromFile(file: Express.Multer.File): Promise<{
        resumeText: string;
        resumeParsed: ResumeParsed;
    }>;
    private extractText;
    private getPdfParseFn;
    private extractFullName;
    private extractEmails;
    private extractPhones;
    private extractSkills;
    private extractObjective;
    private extractEducation;
    private extractExperience;
    private extractCertifications;
    private extractProjects;
    private toDisplaySkill;
    private unique;
    private normalizeText;
    private ocrFromPdf;
    private pickSection;
    private extractLinkedin;
    private extractGithub;
}
