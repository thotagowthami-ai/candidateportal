import { MatchJdDto } from './dto/match-jd.dto';
import { MatchService } from './match.service';
export declare class MatchController {
    private readonly matchService;
    constructor(matchService: MatchService);
    matchJd(body: MatchJdDto): Promise<{
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
    matchJdForMe(body: MatchJdDto, req: {
        user: {
            email: string;
        };
    }): Promise<{
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
    matchJdForUser(body: MatchJdDto, userId: string): Promise<{
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
