import {
  Injectable,
  BadRequestException,
  Inject,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import { Express, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.constants';
import { UploadsService } from '../uploads/uploads.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ResumeParserService } from './resume-parser.service';
import type { ResumeParsed } from './schemas/user.schema';

// --- NEW: Import SmsService ---
import { SmsService } from '../sms/sms.service';

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

  // --- NEW: In-memory OTP Store ---
  // In production, consider using Redis or PostgreSQL for this.
  private otpStore = new Map<string, { code: string; expiresAt: number }>();

  constructor(
    @Inject(PG_POOL)
    private readonly pool: Pool,
    private readonly uploadsService: UploadsService,
    private readonly jwtService: JwtService,
    private readonly resumeParserService: ResumeParserService,
    // --- NEW: Inject SmsService ---
    private readonly smsService: SmsService,
  ) {
    this.schemaReady = this.ensureSchema();
  }

  // --- NEW: TWILIO OTP LOGIC ---
  async sendOtp(phone: string) {
    // 1. Generate a random 4-digit code
    const otpCode = randomInt(1000, 10000).toString();

    // 2. Store the OTP in memory (expires in 10 minutes)
    const expiresAt = Date.now() + 10 * 60 * 1000;
    this.otpStore.set(phone, { code: otpCode, expiresAt });

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
    // 1. Check if the OTP exists for this phone number
    const record = this.otpStore.get(phone);

    if (!record) {
      throw new BadRequestException(
        'No OTP found for this number or it has expired.',
      );
    }

    // 2. Check if it expired
    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(phone);
      throw new BadRequestException(
        'OTP has expired. Please request a new one.',
      );
    }

    // 3. Check if the code matches
    if (record.code !== otp) {
      throw new BadRequestException('Invalid OTP code.');
    }

    // 4. Success! Delete the OTP so it can't be used again
    this.otpStore.delete(phone);
    return { success: true, message: 'Phone number verified successfully' };
  }
  // -----------------------------

  async create(body: CreateUserDto, file: Express.Multer.File) {
    await this.schemaReady;
    const dbInfo = await this.pool.query(`
      SELECT current_database() AS db,
             current_schema() AS schema,
             inet_server_addr() AS host,
             inet_server_port() AS port,
             current_user AS user;
    `);
    console.log('DB INFO:', dbInfo.rows[0]);
    const cols = await this.pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name IN ('resume_text','resume_parsed')
      ORDER BY column_name;
    `);
    console.log('DB COLS:', cols.rows);

    if (!file) {
      throw new BadRequestException('Resume file required');
    }
    console.debug(
      `Resume upload: file=${file.originalname} mime=${file.mimetype} size=${file.size} bytes`,
    );
    if (file.mimetype && !file.mimetype.includes('pdf')) {
      throw new BadRequestException('Please upload a text-based PDF resume.');
    }
    if (file.buffer && file.buffer.length > 0) {
      const snippet = file.buffer.toString(
        'utf8',
        0,
        Math.min(8000, file.buffer.length),
      );
      const hasText = /[A-Za-z0-9]/.test(snippet);
      if (!hasText) {
        throw new BadRequestException('Please upload a text-based PDF resume.');
      }
    }

    const normalizedEmail = body.email.trim().toLowerCase();

    const { resumeText, resumeParsed } =
      await this.resumeParserService.parseFromFile(file);

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

    const result = await this.pool.query<UserRow>(insertQuery, [
      body.firstName,
      body.middleName || null,
      body.lastName,
      normalizedEmail,
      body.phone,
      resumeText,
      JSON.stringify(resumeParsed),
    ]);

    const userId = result.rows[0].id;

    const { url: resumeUrl, key: resumeKey } =
      await this.uploadsService.uploadResume(file, userId);

    await this.pool.query(
      `UPDATE users SET resume_url = $1, resume_key = $2, updated_at = now() WHERE id = $3`,
      [resumeUrl, resumeKey, userId],
    );

    return this.mapUser(result.rows[0]);
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
      ...existingParsed,  // keep existing enrichment fields
      ...resumeParsed,    // overwrite with freshly parsed fields
      // Preserve manual enrichment fields only if the parser didn't produce them
      current_role:
        resumeParsed.current_role ?? existingParsed.current_role,
      location:
        resumeParsed.location ?? existingParsed.location,
      industry:
        resumeParsed.industry ?? existingParsed.industry,
      summary:
        resumeParsed.summary ?? existingParsed.summary,
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

      const googleResponse = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!googleResponse.ok) {
        throw new UnauthorizedException('Invalid Google token');
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

          const result = await this.pool.query<UserRow>(insertQuery, [
            firstName,
            lastName,
            normalizedEmail,
            '0000000000',
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
    } catch (error) {
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

  async downloadResume(candidateId: string, res: Response) {
    await this.schemaReady;
    const user = await this.findById(candidateId);

    if (!user || !user.resumeKey) {
      throw new NotFoundException('Resume not found for this candidate');
    }

    const signedUrl = await this.uploadsService.getSignedResumeUrl(
      user.resumeKey,
    );

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
        phone TEXT NOT NULL,
        resume_url TEXT,
        resume_key TEXT,
        resume_text TEXT,
        resume_parsed JSONB,
        email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
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
