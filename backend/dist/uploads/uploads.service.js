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
exports.UploadsService = void 0;
const common_1 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const crypto_1 = require("crypto");
const pg_1 = require("pg");
const database_constants_1 = require("../database/database.constants");
const resume_parser_service_1 = require("../users/resume-parser.service");
let UploadsService = class UploadsService {
    pool;
    resumeParserService;
    r2Client = new client_s3_1.S3Client({
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY,
            secretAccessKey: process.env.R2_SECRET_KEY,
        },
        forcePathStyle: true,
    });
    constructor(pool, resumeParserService) {
        this.pool = pool;
        this.resumeParserService = resumeParserService;
    }
    async uploadResume(file, userId) {
        if (!userId) {
            throw new common_1.UnauthorizedException('Missing user identity');
        }
        if (!file) {
            throw new common_1.BadRequestException('Resume file is required');
        }
        if (!file.originalname || !file.buffer) {
            throw new common_1.BadRequestException('Invalid resume file');
        }
        const fileKey = `resumes/${(0, crypto_1.randomUUID)()}-${file.originalname}`;
        try {
            console.log('R2 upload starting, endpoint:', process.env.R2_ENDPOINT);
            console.log('R2 bucket:', process.env.R2_BUCKET);
            await this.r2Client.send(new client_s3_1.PutObjectCommand({
                Bucket: process.env.R2_BUCKET,
                Key: fileKey,
                Body: file.buffer,
                ContentType: file.mimetype,
            }));
            console.log('R2 upload success:', fileKey);
        }
        catch (err) {
            const error = err;
            console.error('R2 upload FAILED:', error.message, error.stack);
            throw new common_1.InternalServerErrorException('File upload to R2 failed: ' + error.message);
        }
        try {
            const { resumeParsed } = await this.resumeParserService.parseFromFile(file);
            await this.pool.query(`UPDATE users SET resume_key = $1, resume_parsed = $2, updated_at = now() WHERE id = $3`, [fileKey, JSON.stringify(resumeParsed), userId]);
            const tenantId = process.env.RECRUITING_TENANT_ID;
            if (!tenantId) {
                console.warn('RECRUITING_TENANT_ID not set, skipping resumes insert');
                return {
                    key: fileKey,
                    url: `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}/${fileKey}`,
                    resumeParsed,
                };
            }
            const parsed = resumeParsed;
            const resumeId = (0, crypto_1.randomUUID)();
            await this.pool.query(`INSERT INTO resumes (
          id, tenant_id, uploaded_by, candidate_name, candidate_email,
          candidate_phone, file_path, file_name, file_type,
          skills, experience_years, education, "current_role",
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, now(), now()
        ) ON CONFLICT DO NOTHING`, [
                resumeId,
                tenantId,
                userId,
                parsed.name || file.originalname,
                parsed.email || null,
                parsed.phone || null,
                fileKey,
                file.originalname,
                file.originalname.split('.').pop(),
                parsed.skills && parsed.skills.length > 0 ? parsed.skills : [],
                parsed.experience_years || null,
                parsed.education || null,
                parsed.current_role || null,
            ]);
            return {
                key: fileKey,
                url: `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}/${fileKey}`,
                resumeParsed,
            };
        }
        catch (err) {
            const error = err;
            console.error('Post-upload step FAILED:', error.message, error.stack);
            throw new common_1.InternalServerErrorException('Post upload processing failed: ' + error.message);
        }
    }
    async getSignedResumeUrl(key) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: key,
        });
        return (0, s3_request_presigner_1.getSignedUrl)(this.r2Client, command, { expiresIn: 60 * 60 });
    }
};
exports.UploadsService = UploadsService;
exports.UploadsService = UploadsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_constants_1.PG_POOL)),
    __metadata("design:paramtypes", [typeof (_a = typeof pg_1.Pool !== "undefined" && pg_1.Pool) === "function" ? _a : Object, resume_parser_service_1.ResumeParserService])
], UploadsService);
//# sourceMappingURL=uploads.service.js.map