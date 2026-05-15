import { Pool } from 'pg';
import { MatchJdDto } from './dto/match-jd.dto';
import { JdParserService } from './jd-parser.service';
export declare class MatchService {
    private readonly pool;
    private readonly jdParserService;
    constructor(pool: Pool, jdParserService: JdParserService);
    matchByJd(body: MatchJdDto): Promise<{
        requiredSkills: never[];
        threshold: number;
        totalResumes: number;
        matchedCount: number;
        results: never[];
        message: string;
    } | {
        requiredSkills: string[];
        threshold: number;
        totalResumes: any;
        matchedCount: any;
        results: any;
        message?: undefined;
    }>;
    matchByJdForEmail(body: MatchJdDto, email: string): Promise<{
        requiredSkills: string[];
        result: null;
        message: string;
    } | {
        requiredSkills: string[];
        result: {
            candidateId: string;
            firstName: string;
            lastName: string;
            email: string;
            matchScore: number;
            matchedSkills: string[];
            missingSkills: string[];
            candidateSkills: string[];
        };
        message?: undefined;
    }>;
    matchByJdForUserId(body: MatchJdDto, userId: string): Promise<{
        requiredSkills: string[];
        result: null;
        message: string;
    } | {
        requiredSkills: string[];
        result: {
            candidateId: string;
            firstName: string;
            lastName: string;
            email: string;
            matchScore: number;
            matchedSkills: string[];
            missingSkills: string[];
            candidateSkills: string[];
        };
        message?: undefined;
    }>;
    private normalizeSkills;
    private normalizeSkill;
    private scoreCandidate;
    saveMatchesForJob(jobDescriptionId: string, body: MatchJdDto): Promise<{
        requiredSkills: never[];
        threshold: number;
        totalResumes: number;
        matchedCount: number;
        results: never[];
        message: string;
    } | {
        requiredSkills: string[];
        threshold: number;
        totalResumes: any;
        matchedCount: any;
        results: any;
        message?: undefined;
    }>;
}
