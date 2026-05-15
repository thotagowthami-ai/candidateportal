import { Pool } from 'pg';
import { ResumeParserService } from '../users/resume-parser.service';
export declare class UploadsService {
    private readonly pool;
    private readonly resumeParserService;
    private r2Client;
    constructor(pool: Pool, resumeParserService: ResumeParserService);
    uploadResume(file: Express.Multer.File, userId: string): Promise<{
        key: string;
        url: string;
        resumeParsed: import("../users/schemas/user.schema").ResumeParsed;
    }>;
    getSignedResumeUrl(key: string): Promise<string>;
}
