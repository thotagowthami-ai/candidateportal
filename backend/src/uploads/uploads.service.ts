import {
  Inject,
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  UnauthorizedException,
  Logger,
  HttpException,
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
import type { ResumeParsed } from '../users/schemas/user.schema';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
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
      this.logger.log('R2 upload starting');

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
      this.logger.log('R2 upload success');
    } catch (err) {
      const error = err as Error;
      this.logger.error(`R2 upload failed: ${error.message}`);
      throw new InternalServerErrorException('File upload failed');
    }

    try {
      // 2. Parse resume with existing parser
      const { resumeParsed } =
        await this.resumeParserService.parseFromFile(file);

      // 3. Store parsed data + file key in users table via a single database transaction
      const db = await this.pool.connect();
      try {
        await db.query('BEGIN');

        const updateResult = await db.query(
          `UPDATE users SET resume_key = $1, resume_parsed = $2, updated_at = now() WHERE id = $3`,
          [fileKey, JSON.stringify(resumeParsed), userId],
        );

        if (updateResult.rowCount !== 1) {
          throw new UnauthorizedException('User not found');
        }

        // 4. Get tenant_id from env
        const tenantId = process.env.RECRUITING_TENANT_ID;

        if (!tenantId) {
          this.logger.warn('RECRUITING_TENANT_ID not set, skipping resumes insert');
          await db.query('COMMIT');
          return {
            key: fileKey,
            url: `${this.r2Endpoint}/${this.r2Bucket}/${fileKey}`,
            resumeParsed,
          };
        }

        // 5. Insert into resumes table so recruiting platform can find it
        const parsed: ResumeParsed = resumeParsed;
        const resumeId = randomUUID();

        const extension = file.originalname.includes('.')
          ? (file.originalname.split('.').pop() || 'pdf').toLowerCase()
          : 'pdf';

        await db.query(
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
            parsed.fullName || file.originalname,
            parsed.emails?.[0] || null,
            parsed.phones?.[0] || null,
            fileKey,
            file.originalname,
            extension,
            parsed.skills && parsed.skills.length > 0 ? parsed.skills : [],
            parsed.experience_years || null,
            parsed.education || null,
            parsed.current_role || null,
          ],
        );

        await db.query('COMMIT');
      } catch (dbError) {
        await db.query('ROLLBACK');
        throw dbError;
      } finally {
        db.release();
      }

      return {
        key: fileKey,
        url: `${this.r2Endpoint}/${this.r2Bucket}/${fileKey}`,
        resumeParsed,
      };
    } catch (err) {
      const error = err as Error;
      if (uploaded) {
        this.logger.warn('Attempting rollback for orphaned object');
        await this.r2Client
          .send(
            new DeleteObjectCommand({
              Bucket: this.r2Bucket,
              Key: fileKey,
            }),
          )
          .catch((delErr) =>
            this.logger.error(`Rollback deletion failed: ${delErr.message}`),
          );
      }
      this.logger.error(`Post-upload step failed: ${error.message}`);
      if (
        error instanceof UnauthorizedException ||
        (error instanceof HttpException && error.getStatus() < 500)
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Post-upload processing failed');
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
