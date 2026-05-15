"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchService = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
const database_constants_1 = require("../database/database.constants");
const jd_parser_service_1 = require("./jd-parser.service");
let MatchService = class MatchService {
    pool;
    jdParserService;
    constructor(pool, jdParserService) {
        this.pool = pool;
        this.jdParserService = jdParserService;
    }
    async matchByJd(body) {
        const threshold = body.threshold ?? 60;
        const limit = body.limit ?? 100;
        const requiredSkills = this.jdParserService.extractRequiredSkills(body.description);
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
        const rows = await this.pool.query(`
      SELECT id, first_name, last_name, email, resume_parsed
      FROM users
      WHERE resume_parsed IS NOT NULL
      `);
        const scored = rows.rows.map((candidate) => this.scoreCandidate(candidate, requiredSkills));
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
    async matchByJdForEmail(body, email) {
        const requiredSkills = this.jdParserService.extractRequiredSkills(body.description);
        if (!requiredSkills.length) {
            return {
                requiredSkills: [],
                result: null,
                message: 'No known skills detected in the job description.',
            };
        }
        const row = await this.pool.query(`
      SELECT id, first_name, last_name, email, resume_parsed
      FROM users
      WHERE email = $1
      LIMIT 1
      `, [email.trim().toLowerCase()]);
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
    async matchByJdForUserId(body, userId) {
        const requiredSkills = this.jdParserService.extractRequiredSkills(body.description);
        if (!requiredSkills.length) {
            return {
                requiredSkills: [],
                result: null,
                message: 'No known skills detected in the job description.',
            };
        }
        const row = await this.pool.query(`
      SELECT id, first_name, last_name, email, resume_parsed
      FROM users
      WHERE id = $1
      LIMIT 1
      `, [userId]);
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
    normalizeSkills(skills) {
        const mapped = skills.map((skill) => this.normalizeSkill(skill));
        return [...new Set(mapped)];
    }
    normalizeSkill(skill) {
        const normalized = skill.trim().toLowerCase();
        if (normalized === 'node')
            return 'node.js';
        return normalized;
    }
    scoreCandidate(candidate, requiredSkills) {
        const candidateSkills = this.normalizeSkills(candidate.resume_parsed?.skills ?? []);
        const matchedSkills = requiredSkills.filter((skill) => candidateSkills.includes(skill));
        const missingSkills = requiredSkills.filter((skill) => !matchedSkills.includes(skill));
        const matchScore = Math.round((matchedSkills.length / requiredSkills.length) * 100);
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
    async saveMatchesForJob(jobDescriptionId, body) {
        const matchResult = await this.matchByJd(body);
        if (!matchResult.results || matchResult.results.length === 0) {
            return matchResult;
        }
        const client = await this.pool.connect();
        try {
            for (const item of matchResult.results) {
                await client.query(`
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
          `, [
                    jobDescriptionId,
                    item.candidateId,
                    item.matchScore,
                    item.matchedSkills,
                    item.missingSkills,
                    item.candidateSkills,
                ]);
            }
        }
        finally {
            client.release();
        }
        return matchResult;
    }
};
exports.MatchService = MatchService;
exports.MatchService = MatchService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_constants_1.PG_POOL)),
    __metadata("design:paramtypes", [typeof (_a = typeof pg_1.Pool !== "undefined" && pg_1.Pool) === "function" ? _a : Object, jd_parser_service_1.JdParserService])
], MatchService);
//# sourceMappingURL=match.service.js.map