"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeParserService = void 0;
const common_1 = require("@nestjs/common");
const mammoth_1 = __importDefault(require("mammoth"));
let ResumeParserService = class ResumeParserService {
    pdfParseFn = null;
    knownSkills = [
        'javascript',
        'typescript',
        'react',
        'angular',
        'vue',
        'node.js',
        'node',
        'nestjs',
        'express',
        'next.js',
        'html',
        'css',
        'tailwind',
        'bootstrap',
        'java',
        'spring',
        'python',
        'django',
        'flask',
        'fastapi',
        'c#',
        'dotnet',
        '.net',
        'php',
        'laravel',
        'ruby',
        'rails',
        'sql',
        'mysql',
        'postgresql',
        'mongodb',
        'redis',
        'oracle',
        'sqlite',
        'dynamodb',
        'cassandra',
        'aws',
        'azure',
        'gcp',
        'docker',
        'kubernetes',
        'terraform',
        'jenkins',
        'github actions',
        'ci/cd',
        'power bi',
        'tableau',
        'excel',
        'dax',
        'power query',
        'pandas',
        'numpy',
        'matplotlib',
        'spark',
        'hadoop',
        'data analysis',
        'machine learning',
        'deep learning',
        'git',
        'rest api',
        'graphql',
        'kafka',
        'rabbitmq',
        'linux',
        'bash',
        'powershell',
        'jira',
        'agile',
        'scrum',
        'flutter',
        'react native',
        'android',
        'ios',
        'swift',
        'kotlin',
    ];
    async parseFromFile(file) {
        try {
            const resumeText = await this.extractText(file);
            console.log('PARSED TEXT LENGTH', resumeText?.length);
            return {
                resumeText,
                resumeParsed: {
                    fullName: this.extractFullName(resumeText),
                    objective: this.extractObjective(resumeText),
                    linkedin: this.extractLinkedin(resumeText),
                    github: this.extractGithub(resumeText),
                    emails: this.extractEmails(resumeText),
                    phones: this.extractPhones(resumeText),
                    skills: this.extractSkills(resumeText),
                    education: this.extractEducation(resumeText),
                    experience: this.extractExperience(resumeText),
                    certifications: this.extractCertifications(resumeText),
                    projects: this.extractProjects(resumeText),
                },
            };
        }
        catch (e) {
            console.error('RESUME PARSE ERROR', e);
            throw new common_1.BadRequestException('Failed to parse PDF resume. Use a text-based PDF.');
        }
    }
    async extractText(file) {
        const lowerName = (file.originalname || '').toLowerCase();
        console.debug(`ResumeParser: extracting text from file="${file.originalname}", mime="${file.mimetype}", size=${file.size}`);
        if (file.mimetype === 'application/pdf' || lowerName.endsWith('.pdf')) {
            try {
                const pdfParse = await this.getPdfParseFn();
                const parsed = await pdfParse(file.buffer);
                const normalized = this.normalizeText(parsed.text ?? '');
                if (!normalized || normalized.startsWith('%PDF-')) {
                    throw new common_1.BadRequestException('Unable to extract readable text from PDF.');
                }
                return normalized;
            }
            catch (err) {
                const details = {
                    fileName: file.originalname,
                    mimeType: file.mimetype,
                    sizeBytes: file.size,
                    error: err?.message ?? 'parse error',
                };
                if (process.env.OCR_ENABLED === 'true') {
                    try {
                        const ocrText = await this.ocrFromPdf(file);
                        const normalized = this.normalizeText(ocrText ?? '');
                        if (normalized)
                            return normalized;
                        throw new common_1.BadRequestException('OCR failed to extract text from PDF.');
                    }
                    catch {
                    }
                }
                throw new common_1.BadRequestException({
                    message: 'Failed to parse PDF resume. Use a text-based PDF.',
                    details,
                });
            }
        }
        if (file.mimetype ===
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            lowerName.endsWith('.docx')) {
            try {
                const parsed = await mammoth_1.default.extractRawText({ buffer: file.buffer });
                const normalized = this.normalizeText(parsed.value);
                if (!normalized) {
                    throw new common_1.BadRequestException('Unable to extract readable text from DOCX.');
                }
                return normalized;
            }
            catch {
                throw new common_1.BadRequestException('Failed to parse DOCX resume.');
            }
        }
        return this.normalizeText(file.buffer.toString('utf8').replace(/\0/g, ' '));
    }
    async getPdfParseFn() {
        if (this.pdfParseFn) {
            return this.pdfParseFn;
        }
        const pdfParseModule = await import('pdf-parse');
        const pdfParse = pdfParseModule.default ??
            pdfParseModule;
        if (typeof pdfParse !== 'function') {
            throw new common_1.BadRequestException('PDF parser is not available.');
        }
        this.pdfParseFn = pdfParse;
        return this.pdfParseFn;
    }
    extractFullName(text) {
        const lines = text
            .split(/[\r\n]+/)
            .map((line) => line.trim())
            .filter(Boolean);
        for (const line of lines.slice(0, 8)) {
            if (/^[A-Za-z][A-Za-z\s.'-]{2,60}$/.test(line)) {
                const words = line.split(/\s+/);
                if (words.length >= 2 && words.length <= 4) {
                    return line;
                }
            }
        }
        return undefined;
    }
    extractEmails(text) {
        const matches = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
        return this.unique(matches.map((email) => email.toLowerCase()));
    }
    extractPhones(text) {
        const matches = text.match(/(?:\+?\d[\d\s\-()]{8,18}\d)/g) ?? [];
        return this.unique(matches
            .map((phone) => phone.replace(/[^\d+]/g, ''))
            .filter((phone) => {
            const digits = phone.replace(/\D/g, '');
            if (digits.length < 10 || digits.length > 15) {
                return false;
            }
            if (/^(\d)\1+$/.test(digits)) {
                return false;
            }
            return true;
        }));
    }
    extractSkills(text) {
        const normalized = ` ${text.toLowerCase()} `;
        const found = [];
        for (const skill of this.knownSkills) {
            const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const matcher = new RegExp(`\\b${escaped}\\b`, 'i');
            if (matcher.test(normalized)) {
                found.push(this.toDisplaySkill(skill));
            }
        }
        return this.unique(found);
    }
    extractObjective(text) {
        const objectiveText = this.pickSection(text, ['objective', 'summary', 'profile'], ['education', 'technical skills', 'skills', 'experience', 'projects'])
            .split(/[\r\n]+/)
            .map((line) => line.trim())
            .filter((line) => line && !/^(objective|summary|profile)$/i.test(line))
            .join(' ')
            .trim();
        return objectiveText ? objectiveText.slice(0, 250) : undefined;
    }
    extractEducation(text) {
        const educationText = this.pickSection(text, ['education', 'academic background'], [
            'technical skills',
            'experience',
            'projects',
            'certifications',
            'declaration',
        ]);
        const lines = educationText
            .split(/[\r\n]+/)
            .map((line) => line.trim())
            .filter(Boolean);
        const degreePattern = /\b(b\.?\s?tech|b\.?\s?e\b|b\.?\s?sc|bca|m\.?\s?tech|m\.?\s?e\b|m\.?\s?sc|mca|mba|phd|bachelor|master)\b/i;
        const yearPattern = /(19|20)\d{2}/;
        const entries = [];
        for (const line of lines) {
            if (!degreePattern.test(line)) {
                continue;
            }
            const yearMatch = line.match(yearPattern);
            entries.push({
                degree: line.slice(0, 120),
                year: yearMatch?.[0],
            });
        }
        return entries.slice(0, 5);
    }
    extractExperience(text) {
        const experienceText = this.pickSection(text, ['experience', 'work experience', 'professional experience'], ['projects', 'certifications', 'extra-curricular', 'declaration']);
        const lines = experienceText
            .split(/[\r\n]+/)
            .map((line) => line.trim())
            .filter(Boolean);
        const entries = [];
        for (const line of lines) {
            if (line.startsWith('•')) {
                continue;
            }
            if (/(workshop|certification|participated|managed|coordinated|activities?)/i.test(line)) {
                continue;
            }
            if (!/(engineer|developer|intern|analyst|manager|lead|consultant|specialist)/i.test(line)) {
                continue;
            }
            const duration = line.match(/(\d+\+?\s*(years?|yrs?|months?|mos?))/i)?.[0];
            entries.push({
                role: line.slice(0, 120),
                duration,
            });
        }
        return entries.slice(0, 8);
    }
    extractCertifications(text) {
        const certificationText = this.pickSection(text, ['certifications', 'certification'], ['extra-curricular', 'declaration', 'projects']);
        return certificationText
            .split(/[\r\n]+/)
            .map((line) => line.replace(/^[-•\s]+/, '').trim())
            .filter((line) => line.length > 8 && !/^certifications?$/i.test(line))
            .slice(0, 12);
    }
    extractProjects(text) {
        const projectText = this.pickSection(text, ['projects', 'project'], ['certifications', 'extra-curricular', 'declaration']);
        return projectText
            .split(/[\r\n]+/)
            .map((line) => line.replace(/^[-•\s]+/, '').trim())
            .filter((line) => line.length > 6 && !/^projects?$/i.test(line))
            .slice(0, 10);
    }
    toDisplaySkill(skill) {
        return skill
            .split(' ')
            .map((part) => {
            if (part === 'aws')
                return 'AWS';
            if (part === 'sql')
                return 'SQL';
            if (part === 'css')
                return 'CSS';
            if (part === 'html')
                return 'HTML';
            if (part === 'api')
                return 'API';
            if (part.includes('.'))
                return part.toUpperCase();
            return part.charAt(0).toUpperCase() + part.slice(1);
        })
            .join(' ');
    }
    unique(values) {
        return [...new Set(values)];
    }
    normalizeText(value) {
        return value
            .replace(/\u0000/g, ' ')
            .replace(/[^\S\r\n]+/g, ' ')
            .replace(/\r/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim()
            .slice(0, 50000);
    }
    async ocrFromPdf(_file) {
        throw new common_1.BadRequestException('OCR not configured. Please upload a text-based PDF resume.');
    }
    pickSection(text, startMarkers, endMarkers) {
        const lower = text.toLowerCase();
        const startIndexes = startMarkers
            .map((marker) => lower.indexOf(marker))
            .filter((index) => index >= 0)
            .sort((a, b) => a - b);
        if (!startIndexes.length) {
            return text;
        }
        const start = startIndexes[0];
        let end = text.length;
        for (const marker of endMarkers) {
            const idx = lower.indexOf(marker, start + 1);
            if (idx >= 0 && idx < end) {
                end = idx;
            }
        }
        return text.slice(start, end);
    }
    extractLinkedin(text) {
        const match = text.match(/(https?:\/\/(?:www\.)?linkedin\.com\/[^\s]+|linkedin:\s*[^\s]+)/i);
        if (!match?.[0]) {
            return undefined;
        }
        const value = match[0].replace(/^linkedin:\s*/i, '');
        return value.startsWith('http') ? value : `https://${value}`;
    }
    extractGithub(text) {
        const match = text.match(/(https?:\/\/(?:www\.)?github\.com\/[^\s]+|github:\s*[^\s]+)/i);
        if (!match?.[0]) {
            return undefined;
        }
        const value = match[0].replace(/^github:\s*/i, '');
        return value.startsWith('http') ? value : `https://${value}`;
    }
};
exports.ResumeParserService = ResumeParserService;
exports.ResumeParserService = ResumeParserService = __decorate([
    (0, common_1.Injectable)()
], ResumeParserService);
//# sourceMappingURL=resume-parser.service.js.map