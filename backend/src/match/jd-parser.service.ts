import { Injectable } from '@nestjs/common';

@Injectable()
export class JdParserService {
  private readonly knownSkills = [
    'javascript',
    'typescript',
    'react',
    'node.js',
    'node',
    'nestjs',
    'express',
    'java',
    'spring boot',
    'python',
    'django',
    'flask',
    'sql',
    'mysql',
    'postgresql',
    'mongodb',
    'aws',
    'azure',
    'docker',
    'kubernetes',
    'git',
    'rest api',
    'graphql',
    'html',
    'css',
    'tailwind',
    'power bi',
    'excel',
  ];

  extractRequiredSkills(description: string): string[] {
    const lower = description.toLowerCase();
    const out: string[] = [];

    for (const skill of this.knownSkills) {
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`\\b${escaped}\\b`, 'i').test(lower)) {
        out.push(this.normalizeSkill(skill));
      }
    }

    return [...new Set(out)];
  }

  private normalizeSkill(skill: string): string {
    if (skill === 'node') return 'node.js';
    return skill.toLowerCase();
  }
}
