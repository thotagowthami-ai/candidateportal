import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import mammoth from 'mammoth';
import {
  ResumeEducationEntry,
  ResumeExperienceEntry,
  ResumeParsed,
} from './schemas/user.schema';

@Injectable()
export class ResumeParserService {
  private readonly logger = new Logger(ResumeParserService.name);

  private pdfParseFn: ((data: Buffer) => Promise<{ text?: string }>) | null =
    null;

  private readonly knownSkills = [
    // Web
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
    // Backend
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
    // Database
    'sql',
    'mysql',
    'postgresql',
    'mongodb',
    'redis',
    'oracle',
    'sqlite',
    'dynamodb',
    'cassandra',
    // Cloud & DevOps
    'aws',
    'azure',
    'gcp',
    'docker',
    'kubernetes',
    'terraform',
    'jenkins',
    'github actions',
    'ci/cd',
    // Data & BI
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
    // Tools
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
    // Mobile
    'flutter',
    'react native',
    'android',
    'ios',
    'swift',
    'kotlin',
  ];

  async parseFromFile(file: Express.Multer.File): Promise<{
    resumeText: string;
    resumeParsed: ResumeParsed;
  }> {
    try {
      const resumeText = await this.extractText(file);
      if (process.env.DEBUG_RESUME_PARSER === 'true') {
        this.logger.debug(`Parsed text length: ${resumeText?.length ?? 0}`);
      }

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
    } catch (e) {
      this.logger.warn('Resume parsing failed');
      if (e instanceof BadRequestException) {
        throw e;
      }
      throw new BadRequestException(
        'Failed to parse PDF resume. Use a text-based PDF.',
      );
    }
  }

  private async extractText(file: Express.Multer.File): Promise<string> {
    const lowerName = (file.originalname || '').toLowerCase();
    if (process.env.DEBUG_RESUME_PARSER === 'true') {
      this.logger.debug('ResumeParser: extracting text');
    }

    if (file.mimetype === 'application/pdf' || lowerName.endsWith('.pdf')) {
      try {
        const pdfParse = await this.getPdfParseFn();
        const parsed = await pdfParse(file.buffer);
        const normalized = this.normalizeText(parsed.text ?? '');
        if (!normalized || normalized.startsWith('%PDF-')) {
          throw new BadRequestException(
            'Unable to extract readable text from PDF.',
          );
        }
        return normalized;
      } catch (err) {
        const extension = file.originalname?.includes('.')
          ? (file.originalname.split('.').pop() || 'pdf').toLowerCase()
          : 'pdf';
        const details = {
          fileName: `[redacted].${extension}`,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          error: 'parse error',
        };
        if (process.env.OCR_ENABLED === 'true') {
          try {
            const ocrText = await this.ocrFromPdf(file);
            const normalized = this.normalizeText(ocrText ?? '');
            if (normalized) return normalized;
            throw new BadRequestException(
              'OCR failed to extract text from PDF.',
            );
          } catch {
            // fall through to the general error below if OCR is not configured or fails
          }
        }
        throw new BadRequestException({
          message: 'Failed to parse PDF resume. Use a text-based PDF.',
          details,
        } as any);
      }
    }

    if (
      file.mimetype ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      lowerName.endsWith('.docx')
    ) {
      try {
        const parsed = await mammoth.extractRawText({ buffer: file.buffer });
        const normalized = this.normalizeText(parsed.value);
        if (!normalized) {
          throw new BadRequestException(
            'Unable to extract readable text from DOCX.',
          );
        }
        return normalized;
      } catch {
        throw new BadRequestException('Failed to parse DOCX resume.');
      }
    }

    return this.normalizeText(file.buffer.toString('utf8').replace(/\0/g, ' '));
  }

  private async getPdfParseFn() {
    if (this.pdfParseFn) {
      return this.pdfParseFn;
    }

    const pdfParseModule = await import('pdf-parse');
    const pdfParse =
      (pdfParseModule as unknown as { default?: unknown }).default ??
      (pdfParseModule as unknown);

    if (typeof pdfParse !== 'function') {
      throw new BadRequestException('PDF parser is not available.');
    }

    this.pdfParseFn = pdfParse as (data: Buffer) => Promise<{ text?: string }>;
    return this.pdfParseFn;
  }

  private extractFullName(text: string): string | undefined {
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

  private extractEmails(text: string): string[] {
    const matches = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
    return this.unique(matches.map((email) => email.toLowerCase()));
  }

  private extractPhones(text: string): string[] {
    const matches = text.match(/(?:\+?\d[\d\s\-()]{8,18}\d)/g) ?? [];

    return this.unique(
      matches
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
        }),
    );
  }

  private extractSkills(text: string): string[] {
    const normalized = ` ${text.toLowerCase()} `;
    const found: string[] = [];

    for (const skill of this.knownSkills) {
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const matcher = new RegExp(
        `(?<![A-Za-z0-9_])${escaped}(?![A-Za-z0-9_])`,
        'iu',
      );
      if (matcher.test(normalized)) {
        found.push(this.toDisplaySkill(skill));
      }
    }

    return this.unique(found);
  }

  private extractObjective(text: string): string | undefined {
    const objectiveText = this.pickSection(
      text,
      ['objective', 'summary', 'profile'],
      ['education', 'technical skills', 'skills', 'experience', 'projects'],
    )
      .split(/[\r\n]+/)
      .map((line) => line.trim())
      .filter((line) => line && !/^(objective|summary|profile)$/i.test(line))
      .join(' ')
      .trim();

    return objectiveText ? objectiveText.slice(0, 250) : undefined;
  }

  private extractEducation(text: string): ResumeEducationEntry[] {
    const educationText = this.pickSection(
      text,
      ['education', 'academic background'],
      [
        'technical skills',
        'experience',
        'projects',
        'certifications',
        'declaration',
      ],
    );

    const lines = educationText
      .split(/[\r\n]+/)
      .map((line) => line.trim())
      .filter(Boolean);

    const degreePattern =
      /\b(b\.?\s?tech|b\.?\s?e\b|b\.?\s?sc|bca|m\.?\s?tech|m\.?\s?e\b|m\.?\s?sc|mca|mba|phd|bachelor|master|b\.?\s?s\b|m\.?\s?s\b|university|college|associate|diploma|degree)\b/i;
    const yearPattern = /(19|20)\d{2}/;

    const entries: ResumeEducationEntry[] = [];

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

  private extractExperience(text: string): ResumeExperienceEntry[] {
    const experienceText = this.pickSection(
      text,
      ['experience', 'work experience', 'professional experience'],
      ['projects', 'certifications', 'extra-curricular', 'declaration'],
    );

    const lines = experienceText
      .split(/[\r\n]+/)
      .map((line) => line.trim())
      .filter(Boolean);

    const entries: ResumeExperienceEntry[] = [];

    for (const line of lines) {
      if (line.startsWith('•')) {
        continue;
      }

      if (
        /(workshop|certification|participated|managed|coordinated|activities?)/i.test(
          line,
        )
      ) {
        continue;
      }

      if (
        !/(engineer|developer|intern|analyst|manager|lead|consultant|specialist)/i.test(
          line,
        )
      ) {
        continue;
      }

      const duration = line.match(
        /(\d+\+?\s*(years?|yrs?|months?|mos?))/i,
      )?.[0];

      entries.push({
        role: line.slice(0, 120),
        duration,
      });
    }

    return entries.slice(0, 8);
  }

  private extractCertifications(text: string): string[] {
    const certificationText = this.pickSection(
      text,
      ['certifications', 'certification'],
      ['extra-curricular', 'declaration', 'projects'],
    );

    return certificationText
      .split(/[\r\n]+/)
      .map((line) => line.replace(/^[-•\s]+/, '').trim())
      .filter((line) => line.length > 8 && !/^certifications?$/i.test(line))
      .slice(0, 12);
  }

  private extractProjects(text: string): string[] {
    const projectText = this.pickSection(
      text,
      ['projects', 'project'],
      ['certifications', 'extra-curricular', 'declaration'],
    );

    return projectText
      .split(/[\r\n]+/)
      .map((line) => line.replace(/^[-•\s]+/, '').trim())
      .filter((line) => line.length > 6 && !/^projects?$/i.test(line))
      .slice(0, 10);
  }

  private toDisplaySkill(skill: string): string {
    return skill
      .split(' ')
      .map((part) => {
        if (part === 'aws') return 'AWS';
        if (part === 'sql') return 'SQL';
        if (part === 'css') return 'CSS';
        if (part === 'html') return 'HTML';
        if (part === 'api') return 'API';
        if (part.includes('.')) return part.toUpperCase();
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(' ');
  }

  private unique(values: string[]): string[] {
    return [...new Set(values)];
  }

  private normalizeText(value: string): string {
    return value
      .replace(/\u0000/g, ' ')
      .replace(/[^\S\r\n]+/g, ' ')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .slice(0, 50000);
  }

  private async ocrFromPdf(_file: Express.Multer.File): Promise<string> {
    throw new BadRequestException(
      'OCR not configured. Please upload a text-based PDF resume.',
    );
  }

  private pickSection(
    text: string,
    startMarkers: string[],
    endMarkers: string[],
  ): string {
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

  private extractLinkedin(text: string): string | undefined {
    const match = text.match(
      /(https?:\/\/(?:www\.)?linkedin\.com\/[^\s]+|linkedin:\s*[^\s]+)/i,
    );

    if (!match?.[0]) {
      return undefined;
    }

    const value = match[0].replace(/^linkedin:\s*/i, '');
    return value.startsWith('http') ? value : `https://${value}`;
  }

  private extractGithub(text: string): string | undefined {
    const match = text.match(
      /(https?:\/\/(?:www\.)?github\.com\/[^\s]+|github:\s*[^\s]+)/i,
    );

    if (!match?.[0]) {
      return undefined;
    }

    const value = match[0].replace(/^github:\s*/i, '');
    return value.startsWith('http') ? value : `https://${value}`;
  }
}
