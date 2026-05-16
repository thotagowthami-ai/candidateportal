import {
  Inject,
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.constants';
import { ResumeParserService } from '../users/resume-parser.service';

@Injectable()
export class UploadsService {
  private readonly r2Endpoint: string;
  private readonly r2Bucket: string;
  private readonly r2Client: S3Client;

  constructor(
    @Inject(PG_POOL)
    private readonly pool: Pool,
    private readonly resumeParserService: ResumeParserService,
  ) {
    const required = [
      'R2_ENDPOINT',
      'R2_ACCESS_KEY',
      'R2_SECRET_KEY',
      'R2_BUCKET',
    ];
    const missing = required.filter((k) => !process.env[k]);
    if (missing.length) {
      throw new Error(`Missing required R2 env vars: ${missing.join(', ')}`);
    }
    this.r2Endpoint = process.env.R2_ENDPOINT!;
    this.r2Bucket = process.env.R2_BUCKET!;

    this.r2Client = new S3Client({
      region: 'auto',
      endpoint: this.r2Endpoint,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY!,
        secretAccessKey: process.env.R2_SECRET_KEY!,
      },
      forcePathStyle: true,
    });
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/^\.+/, '')
      .slice(0, 255);
  }

  async uploadResume(file: Express.Multer.File, userId: string) {
    if (!userId) {
      throw new UnauthorizedException('Missing user identity');
    }
    if (!file) {
      throw new BadRequestException('Resume file is required');
    }
    if (!file.originalname || !file.buffer) {
      throw new BadRequestException('Invalid resume file');
    }
    const sanitizedName = this.sanitizeFilename(file.originalname);
    const fileKey = `resumes/${randomUUID()}-${sanitizedName}`;

    let uploaded = false;
    try {
      console.log('R2 upload starting, endpoint:', this.r2Endpoint);
      console.log('R2 bucket:', this.r2Bucket);

      // 1. Upload file to R2
      await this.r2Client.send(
        new PutObjectCommand({
          Bucket: this.r2Bucket,
          Key: fileKey,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
      uploaded = true;
      console.log('R2 upload success:', fileKey);
    } catch (err) {
      const error = err as Error;
      console.error('R2 upload FAILED:', error.message, error.stack);
      throw new InternalServerErrorException(
        'File upload to R2 failed: ' + error.message,
      );
    }

    try {
      // 2. Parse resume with existing parser
      const { resumeParsed } =
        await this.resumeParserService.parseFromFile(file);

      // 3. Store parsed data + file key in users table
      await this.pool.query(
        `UPDATE users SET resume_key = $1, resume_parsed = $2, updated_at = now() WHERE id = $3`,
        [fileKey, JSON.stringify(resumeParsed), userId],
      );

      // 4. Get tenant_id from env
      const tenantId = process.env.RECRUITING_TENANT_ID;

      if (!tenantId) {
        console.warn('RECRUITING_TENANT_ID not set, skipping resumes insert');
        return {
          key: fileKey,
          url: `${this.r2Endpoint}/${this.r2Bucket}/${fileKey}`,
          resumeParsed,
        };
      }

      // 5. Insert into resumes table so recruiting platform can find it
      const parsed = resumeParsed as any;
      const resumeId = randomUUID();

      const extension = file.originalname.includes('.')
        ? (file.originalname.split('.').pop() || 'pdf').toLowerCase()
        : 'pdf';

      await this.pool.query(
        `INSERT INTO resumes (
          id, tenant_id, uploaded_by, candidate_name, candidate_email,
          candidate_phone, file_path, file_name, file_type,
          skills, experience_years, education, "current_role",
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, now(), now()
        ) ON CONFLICT DO NOTHING`,
        [
          resumeId,
          tenantId,
          userId,
          parsed.name || file.originalname,
          parsed.email || null,
          parsed.phone || null,
          fileKey,
          file.originalname,
          extension,
          parsed.skills && parsed.skills.length > 0 ? parsed.skills : [],
          parsed.experience_years || null,
          parsed.education || null,
          parsed.current_role || null,
        ],
      );

      return {
        key: fileKey,
        url: `${this.r2Endpoint}/${this.r2Bucket}/${fileKey}`,
        resumeParsed,
      };
    } catch (err) {
      const error = err as Error;
      if (uploaded) {
        console.warn('Attempting rollback for orphaned object:', fileKey);
        await this.r2Client
          .send(
            new DeleteObjectCommand({
              Bucket: this.r2Bucket,
              Key: fileKey,
            }),
          )
          .catch((delErr) =>
            console.error('Rollback deletion FAILED:', delErr.message),
          );
      }
      console.error('Post-upload step FAILED:', error.message, error.stack);
      throw new InternalServerErrorException(
        'Post upload processing failed: ' + error.message,
      );
    }
  }

  async getSignedResumeUrl(key: string) {
    const command = new GetObjectCommand({
      Bucket: this.r2Bucket,
      Key: key,
    });
    return getSignedUrl(this.r2Client, command, { expiresIn: 60 * 60 });
  }
}
