import { UploadsService } from './uploads.service';
export declare class UploadsController {
    private uploadsService;
    constructor(uploadsService: UploadsService);
    uploadResume(file: Express.Multer.File, req: {
        user: {
            id?: string;
            sub?: string;
        };
    }): Promise<{
        key: string;
        url: string;
        resumeParsed: import("../users/schemas/user.schema").ResumeParsed;
    }>;
}
