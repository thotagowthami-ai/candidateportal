import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.constants';
import { MatchJdDto } from './dto/match-jd.dto';
import { JdParserService } from './jd-parser.service';

type CandidateRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  resume_parsed: {
    skills?: string[];
  } | null;
};

@Injectable()
export class MatchService {
  constructor(
    @Inject(PG_POOL)
    private readonly pool: Pool,
    private readonly jdParserService: JdParserService,
  ) {}

  async matchByJd(body: MatchJdDto) {
    const threshold = body.threshold ?? 60;
    const limit = body.limit ?? 100;

    const requiredSkills = this.jdParserService.extractRequiredSkills(
      body.description,
    );
    if (!requiredSkills.length) {
      return {
        requiredSkills: [],
        threshold,
        totalResumes: 0,
        matchedCount: 0,
        results: [],
        message: 'No known skills detected in the job description.',
      };
    }

    const rows = await this.pool.query<CandidateRow>(
      `
      SELECT id, first_name, last_name, email, resume_parsed
      FROM users
      WHERE resume_parsed IS NOT NULL
      `,
    );

    const scored = rows.rows.map((candidate) =>
      this.scoreCandidate(candidate, requiredSkills),
    );

    const sorted = scored.sort((a, b) => b.matchScore - a.matchScore);
    const filtered = sorted
      .filter((item) => item.matchScore >= threshold)
      .slice(0, limit);

    return {
      requiredSkills,
      threshold,
      totalResumes: rows.rows.length,
      matchedCount: filtered.length,
      results: filtered,
    };
  }

  async matchByJdForEmail(body: MatchJdDto, email: string) {
    const requiredSkills = this.jdParserService.extractRequiredSkills(
      body.description,
    );
    if (!requiredSkills.length) {
      return {
        requiredSkills: [],
        result: null,
        message: 'No known skills detected in the job description.',
      };
    }

    const row = await this.pool.query<CandidateRow>(
      `
      SELECT id, first_name, last_name, email, resume_parsed
      FROM users
      WHERE email = $1
      LIMIT 1
      `,
      [email.trim().toLowerCase()],
    );

    if (!row.rows.length) {
      return {
        requiredSkills,
        result: null,
        message: 'User not found.',
      };
    }

    return {
      requiredSkills,
      result: this.scoreCandidate(row.rows[0], requiredSkills),
    };
  }

  async matchByJdForUserId(body: MatchJdDto, userId: string) {
    const requiredSkills = this.jdParserService.extractRequiredSkills(
      body.description,
    );
    if (!requiredSkills.length) {
      return {
        requiredSkills: [],
        result: null,
        message: 'No known skills detected in the job description.',
      };
    }

    const row = await this.pool.query<CandidateRow>(
      `
      SELECT id, first_name, last_name, email, resume_parsed
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [userId],
    );

    if (!row.rows.length) {
      return {
        requiredSkills,
        result: null,
        message: 'User not found.',
      };
    }

    return {
      requiredSkills,
      result: this.scoreCandidate(row.rows[0], requiredSkills),
    };
  }

  private normalizeSkills(skills: string[]): string[] {
    const mapped = skills.map((skill) => this.normalizeSkill(skill));
    return [...new Set(mapped)];
  }

  private normalizeSkill(skill: string): string {
    const normalized = skill.trim().toLowerCase();
    if (normalized === 'node') return 'node.js';
    return normalized;
  }

  private scoreCandidate(candidate: CandidateRow, requiredSkills: string[]) {
    const candidateSkills = this.normalizeSkills(
      candidate.resume_parsed?.skills ?? [],
    );
    const matchedSkills = requiredSkills.filter((skill) =>
      candidateSkills.includes(skill),
    );
    const missingSkills = requiredSkills.filter(
      (skill) => !matchedSkills.includes(skill),
    );
    const matchScore = Math.round(
      (matchedSkills.length / requiredSkills.length) * 100,
    );

    return {
      candidateId: candidate.id,
      firstName: candidate.first_name,
      lastName: candidate.last_name,
      email: candidate.email,
      matchScore,
      matchedSkills,
      missingSkills,
      candidateSkills,
    };
  }

  // NEW: save match results into matches table for a job_description_id
  async saveMatchesForJob(jobDescriptionId: string, body: MatchJdDto) {
    const matchResult = await this.matchByJd(body);

    if (!matchResult.results || matchResult.results.length === 0) {
      return matchResult;
    }

    const client = await this.pool.connect();
    try {
      for (const item of matchResult.results) {
        await client.query(
          `
          INSERT INTO matches (
            job_description_id,
            candidate_id,
            match_score,
            matched_skills,
            missing_skills,
            candidate_skills
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT DO NOTHING
          `,
          [
            jobDescriptionId,
            item.candidateId,
            item.matchScore,
            item.matchedSkills,
            item.missingSkills,
            item.candidateSkills,
          ],
        );
      }
    } finally {
      client.release();
    }

    return matchResult;
  }
}
