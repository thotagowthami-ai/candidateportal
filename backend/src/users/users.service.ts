import {
  Injectable,
  BadRequestException,
  Inject,
  NotFoundException,
  UnauthorizedException,
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash, randomInt } from 'crypto';
import { Express, Response as ExpressResponse } from 'express';
import { JwtService } from '@nestjs/jwt';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.constants';
import { UploadsService } from '../uploads/uploads.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ResumeParserService } from './resume-parser.service';
import type { ResumeParsed } from './schemas/user.schema';

// --- NEW: Import SmsService ---
import { SmsService } from '../sms/sms.service';
import { TokenStoreService } from '../database/token-store.service';

type UserRow = {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string;
  phone: string;
  resume_url: string | null;
  resume_key: string | null;
  resume_text: string | null;
  resume_parsed: ResumeParsed | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class UsersService {
  private readonly schemaReady: Promise<void>;

  constructor(
    @Inject(PG_POOL)
    private readonly pool: Pool,
    private readonly uploadsService: UploadsService,
    private readonly jwtService: JwtService,
    private readonly resumeParserService: ResumeParserService,
    private readonly smsService: SmsService,
    private readonly tokenStore: TokenStoreService,
  ) {
    this.schemaReady = this.ensureSchema();
  }

  private hashOtp(otp: string): string {
    return createHash('sha256').update(otp).digest('hex');
  }

  // --- NEW: TWILIO OTP LOGIC ---
  async sendOtp(phone: string) {
    // 1. Generate a random 4-digit code
    const otpCode = randomInt(1000, 10000).toString();

    // 2. Store the hashed OTP in PostgreSQL (expires in 10 minutes)
    const hashedOtp = this.hashOtp(otpCode);
    await this.tokenStore.set(
      `user_otp:${phone}`,
      { hash: hashedOtp, attempts: 0 },
      10 * 60,
    );

    console.log(`Generated OTP for ${phone}`);

    // 3. Send the actual text message via Twilio
    const message = `Your RecruitApp verification code is: ${otpCode}. Valid for 10 minutes.`;
    const result = await this.smsService.sendCandidateSMS(phone, message);

    if (!result.success) {
      throw new BadRequestException(
        'Failed to send OTP via SMS. Check phone number.',
      );
    }

    return { success: true, message: 'OTP sent to mobile device' };
  }

  async verifyOtp(phone: string, otp: string) {
    const key = `user_otp:${phone}`;
    // 1. Check if the OTP exists for this phone number
    const record = await this.tokenStore.get(key);

    if (!record) {
      throw new BadRequestException(
        'No OTP found for this number or it has expired.',
      );
    }

    // 2. Check if too many attempts
    if (record.attempts >= 5) {
      await this.tokenStore.delete(key);
      throw new BadRequestException(
        'Too many invalid OTP attempts. Please request a new one.',
      );
    }

    // 3. Check if the code matches (compare hashes)
    if (record.hash !== this.hashOtp(otp)) {
      // Increment attempts and persist
      record.attempts = (record.attempts || 0) + 1;

      if (record.attempts >= 5) {
        await this.tokenStore.delete(key);
        throw new BadRequestException(
          'Too many invalid OTP attempts. Please request a new one.',
        );
      }

      // We don't have an easy way to get "remaining TTL" from tokenStore.get
      // but we can just use a fixed 10 min from now, or better, the tokenStore
      // implementation should ideally handle TTL updates if we want to be precise.
      // For now, we'll reset to 10 mins as a reasonable compromise for the updated attempts.
      await this.tokenStore.set(key, record, 10 * 60);

      throw new BadRequestException('Invalid OTP code.');
    }

    // 4. Success! Delete the OTP so it can't be used again
    await this.tokenStore.delete(key);
    return { success: true, message: 'Phone number verified successfully' };
  }
  // -----------------------------

  async create(body: CreateUserDto, file: Express.Multer.File) {
    await this.schemaReady;
    if (!file) {
      throw new BadRequestException('Resume file required');
    }
    console.debug(
      `Resume upload: mime=${file.mimetype} size=${file.size} bytes`,
    );
    if (file.mimetype && !file.mimetype.includes('pdf')) {
      throw new BadRequestException('Please upload a text-based PDF resume.');
    }
    const normalizedEmail = body.email.trim().toLowerCase();

    const { resumeText, resumeParsed } =
      await this.resumeParserService.parseFromFile(file);

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const insertQuery = `
        INSERT INTO users (
          first_name,
          middle_name,
          last_name,
          email,
          phone,
          resume_text,
          resume_parsed,
          email_verified
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,TRUE)
        ON CONFLICT (email)
        DO UPDATE SET
          first_name = EXCLUDED.first_name,
          middle_name = EXCLUDED.middle_name,
          last_name = EXCLUDED.last_name,
          phone = EXCLUDED.phone,
          resume_text = EXCLUDED.resume_text,
          resume_parsed = EXCLUDED.resume_parsed,
          email_verified = TRUE,
          updated_at = now()
        RETURNING *;
      `;

      const result = await client.query<UserRow>(insertQuery, [
        body.firstName,
        body.middleName || null,
        body.lastName,
        normalizedEmail,
        body.phone,
        resumeText,
        JSON.stringify(resumeParsed),
      ]);

      const userId = result.rows[0].id;

      // Note: uploadResume currently uses its own pool reference,
      // so its internal DB updates will be outside this transaction.
      // However, we still COMMIT our part if it succeeds.
      const { url: resumeUrl, key: resumeKey } =
        await this.uploadsService.uploadResume(file, userId);

      const updated = await client.query<UserRow>(
        `UPDATE users SET resume_url = $1, resume_key = $2, updated_at = now() WHERE id = $3 RETURNING *`,
        [resumeUrl, resumeKey, userId],
      );

      await client.query('COMMIT');
      return this.mapUser(updated.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async replaceResume(email: string, file: Express.Multer.File) {
    await this.schemaReady;

    if (!file) {
      throw new BadRequestException('Resume file required');
    }
    if (file.mimetype && !file.mimetype.includes('pdf')) {
      throw new BadRequestException('Please upload a text-based PDF resume.');
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userResult = await this.pool.query<UserRow>(
      `SELECT id, resume_parsed FROM users WHERE email = $1 LIMIT 1`,
      [normalizedEmail],
    );

    if (!userResult.rows.length) {
      throw new NotFoundException('User not found.');
    }

    const userId = userResult.rows[0].id;
    const existingParsed = userResult.rows[0].resume_parsed || {};

    const { resumeText, resumeParsed } =
      await this.resumeParserService.parseFromFile(file);

    // Merge: new parsed data takes priority for parser-extracted fields,
    // but preserve manually-edited profile enrichment fields that the
    // parser does not produce (current_role, location, industry, summary,
    // experience_years).
    const mergedParsed = {
      ...existingParsed, // keep existing enrichment fields
      ...resumeParsed, // overwrite with freshly parsed fields
      // Preserve manual enrichment fields only if the parser didn't produce them
      current_role: resumeParsed.current_role ?? existingParsed.current_role,
      location: resumeParsed.location ?? existingParsed.location,
      industry: resumeParsed.industry ?? existingParsed.industry,
      summary: resumeParsed.summary ?? existingParsed.summary,
      experience_years:
        resumeParsed.experience_years ?? existingParsed.experience_years,
    };

    const { url: resumeUrl, key: resumeKey } =
      await this.uploadsService.uploadResume(file, userId);

    const updateQuery = `
      UPDATE users 
      SET 
        resume_url = $1, 
        resume_key = $2, 
        resume_text = $3, 
        resume_parsed = $4::jsonb, 
        updated_at = now() 
      WHERE id = $5
      RETURNING *;
    `;

    const result = await this.pool.query<UserRow>(updateQuery, [
      resumeUrl,
      resumeKey,
      resumeText,
      JSON.stringify(mergedParsed),
      userId,
    ]);

    return {
      message: 'Resume replaced successfully',
      resumeParsed: result.rows[0].resume_parsed,
    };
  }

  async findByEmail(email: string) {
    await this.schemaReady;
    const result = await this.pool.query<UserRow>(
      `SELECT * FROM users WHERE email = $1 LIMIT 1`,
      [email.trim().toLowerCase()],
    );
    if (!result.rows.length) return null;
    return this.mapUser(result.rows[0]);
  }

  async findById(id: string) {
    await this.schemaReady;
    const result = await this.pool.query<UserRow>(
      `SELECT * FROM users WHERE id = $1 LIMIT 1`,
      [id],
    );
    if (!result.rows.length) return null;
    return this.mapUser(result.rows[0]);
  }

  async googleLogin(token: string) {
    try {
      await this.schemaReady;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      let googleResponse: globalThis.Response;
      try {
        googleResponse = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          },
        );
      } catch (err: any) {
        if (err.name === 'AbortError') {
          throw new ServiceUnavailableException(
            'Google userinfo request timed out',
          );
        }
        throw new BadGatewayException(
          'Failed to connect to Google: ' + err.message,
        );
      } finally {
        clearTimeout(timeout);
      }

      if (!googleResponse.ok) {
        const errorText = await googleResponse.text().catch(() => 'Unknown');
        throw new BadGatewayException(
          `Google userinfo responded with ${googleResponse.status}: ${errorText}`,
        );
      }

      const googleUser = await googleResponse.json();
      const normalizedEmail = googleUser.email.trim().toLowerCase();

      let userWithResume: any;

      try {
        userWithResume = await this.getCurrentUser(normalizedEmail);
      } catch (error) {
        if (error instanceof NotFoundException) {
          const firstName =
            googleUser.given_name || googleUser.name || 'Google';
          const lastName = googleUser.family_name || 'User';

          const insertQuery = `
            INSERT INTO users (
              first_name, last_name, email, phone, email_verified
            ) VALUES ($1, $2, $3, $4, TRUE) RETURNING *;
          `;

          await this.pool.query<UserRow>(insertQuery, [
            firstName,
            lastName,
            normalizedEmail,
            null,
          ]);

          userWithResume = await this.getCurrentUser(normalizedEmail);
        } else {
          throw error;
        }
      }

      const accessToken = await this.jwtService.signAsync({
        sub: userWithResume.id,
        email: userWithResume.email,
      });

      return {
        accessToken,
        user: userWithResume,
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new UnauthorizedException('Google userinfo request timed out');
      }
      console.error('Google Login failed:', error);
      throw new UnauthorizedException('Google authentication failed');
    }
  }

  async updateProfile(email: string, updateData: any) {
    await this.schemaReady;
    const normalizedEmail = email.trim().toLowerCase();

    await this.pool.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name), 
           last_name = COALESCE($2, last_name), 
           updated_at = now() 
       WHERE email = $3`,
      [updateData.firstName, updateData.lastName, normalizedEmail],
    );

    const result = await this.pool.query(
      `SELECT resume_parsed FROM users WHERE email = $1`,
      [normalizedEmail],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('User not found');
    }

    const existingParsed = result.rows[0].resume_parsed || {};

    let expYears = existingParsed.experience_years;
    if (updateData.experience) {
      const parsedExp = parseFloat(
        updateData.experience.replace(/[^0-9.]/g, ''),
      );
      if (!isNaN(parsedExp)) {
        expYears = parsedExp;
      }
    }

    const updatedParsed = {
      ...existingParsed,
      current_role: updateData.headline || existingParsed.current_role,
      location: updateData.location || existingParsed.location,
      experience_years: expYears,
      industry: updateData.industry || existingParsed.industry,
      summary: updateData.summary || existingParsed.summary,
      // --- THIS LINE ENSURES SKILLS ARE PERMANENTLY SAVED ---
      skills: updateData.skills || existingParsed.skills,
    };

    await this.pool.query(
      `UPDATE users SET resume_parsed = $1::jsonb, updated_at = now() WHERE email = $2`,
      [JSON.stringify(updatedParsed), normalizedEmail],
    );

    return { message: 'Profile updated successfully' };
  }

  async login(email: string) {
    const userWithResume = await this.getCurrentUser(
      email.trim().toLowerCase(),
    );

    const accessToken = await this.jwtService.signAsync({
      sub: userWithResume.id,
      email: userWithResume.email,
    });

    return {
      accessToken,
      user: userWithResume,
    };
  }

  async getCurrentUser(email: string) {
    await this.schemaReady;
    const result = await this.pool.query<UserRow>(
      `SELECT * FROM users WHERE email = $1 LIMIT 1`,
      [email.trim().toLowerCase()],
    );
    const row = result.rows[0];

    if (!row) {
      throw new NotFoundException('User not found. Please register first.');
    }

    let signedResumeUrl: string | null = null;

    if (row.resume_url) {
      const resumeKey = row.resume_key ?? this.extractResumeKey(row.resume_url);

      if (!resumeKey) {
        throw new BadRequestException('Could not resolve resume key.');
      }

      signedResumeUrl = await this.uploadsService.getSignedResumeUrl(resumeKey);
    }

    const mapped = this.mapUser(row);
    return {
      ...mapped,
      resumeUrl: signedResumeUrl,
    };
  }

  async devCreateTestUser(payload: {
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    phone: string;
    resumeUrl?: string;
  }) {
    const { firstName, middleName, lastName, email, phone, resumeUrl } =
      payload;
    await this.schemaReady;
    const normalizedEmail = email.trim().toLowerCase();
    const res = await this.pool.query(
      `INSERT INTO users (
        first_name, middle_name, last_name, email, phone, resume_url, resume_text, resume_parsed, email_verified
      ) VALUES ($1,$2,$3,$4,$5,$6,NULL,NULL,TRUE)
      ON CONFLICT (email)
      DO UPDATE SET
        first_name = EXCLUDED.first_name,
        middle_name = EXCLUDED.middle_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone,
        resume_url = COALESCE(EXCLUDED.resume_url, users.resume_url),
        resume_text = COALESCE(EXCLUDED.resume_text, users.resume_text),
        resume_parsed = COALESCE(EXCLUDED.resume_parsed, users.resume_parsed),
        email_verified = TRUE,
        updated_at = now()
      RETURNING *;`,
      [
        firstName,
        middleName || null,
        lastName,
        normalizedEmail,
        phone,
        resumeUrl ?? null,
      ],
    );
    return this.mapUser(res.rows[0]);
  }

  async downloadResume(candidateId: string, res: ExpressResponse) {
    await this.schemaReady;
    const user = await this.findById(candidateId);

    const resumeKey =
      user?.resumeKey ??
      (user?.resumeUrl ? this.extractResumeKey(user.resumeUrl) : null);

    if (!user || !resumeKey) {
      throw new NotFoundException('Resume not found for this candidate');
    }

    const signedUrl = await this.uploadsService.getSignedResumeUrl(resumeKey);

    return res.redirect(signedUrl);
  }

  async getSemanticProfile(email: string) {
    await this.schemaReady;
    const result = await this.pool.query<UserRow>(
      `SELECT * FROM users WHERE email = $1 LIMIT 1`,
      [email.trim().toLowerCase()],
    );
    const row = result.rows[0];

    if (!row) {
      throw new NotFoundException('User not found. Please register first.');
    }

    return {
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      resumeParsed: row.resume_parsed ?? {
        emails: [],
        phones: [],
        skills: [],
        education: [],
        experience: [],
        certifications: [],
        projects: [],
      },
    };
  }

  private async ensureSchema() {
    await this.pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        first_name TEXT NOT NULL,
        middle_name TEXT,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        resume_url TEXT,
        resume_key TEXT,
        resume_text TEXT,
        resume_parsed JSONB,
        email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // Ensure existing tables allow NULL for phone
    await this.pool
      .query(
        `
      ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
    `,
      )
      .catch(() => {
        /* Ignore errors if column doesn't exist yet */
      });
  }

  private mapUser(row: UserRow) {
    return {
      id: row.id,
      firstName: row.first_name,
      middleName: row.middle_name ?? '',
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      resumeUrl: row.resume_url,
      resumeKey: row.resume_key,
      resumeText: row.resume_text,
      resumeParsed: row.resume_parsed,
      emailVerified: row.email_verified,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private extractResumeKey(resumeUrl: string) {
    try {
      const parsed = new URL(resumeUrl);
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        return decodeURIComponent(parts.slice(1).join('/'));
      }
      return null;
    } catch {
      return null;
    }
  }
}
