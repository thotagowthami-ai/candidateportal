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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const pg_1 = require("pg");
const database_constants_1 = require("../database/database.constants");
const uploads_service_1 = require("../uploads/uploads.service");
const resume_parser_service_1 = require("./resume-parser.service");
const sms_service_1 = require("../sms/sms.service");
let UsersService = class UsersService {
    pool;
    uploadsService;
    jwtService;
    resumeParserService;
    smsService;
    schemaReady;
    otpStore = new Map();
    constructor(pool, uploadsService, jwtService, resumeParserService, smsService) {
        this.pool = pool;
        this.uploadsService = uploadsService;
        this.jwtService = jwtService;
        this.resumeParserService = resumeParserService;
        this.smsService = smsService;
        this.schemaReady = this.ensureSchema();
    }
    async sendOtp(phone) {
        const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000;
        this.otpStore.set(phone, { code: otpCode, expiresAt });
        console.log(`Generated OTP for ${phone}: ${otpCode}`);
        const message = `Your RecruitApp verification code is: ${otpCode}. Valid for 10 minutes.`;
        const result = await this.smsService.sendCandidateSMS(phone, message);
        if (!result.success) {
            throw new common_1.BadRequestException('Failed to send OTP via SMS. Check phone number.');
        }
        return { success: true, message: 'OTP sent to mobile device' };
    }
    async verifyOtp(phone, otp) {
        const record = this.otpStore.get(phone);
        if (!record) {
            throw new common_1.BadRequestException('No OTP found for this number or it has expired.');
        }
        if (Date.now() > record.expiresAt) {
            this.otpStore.delete(phone);
            throw new common_1.BadRequestException('OTP has expired. Please request a new one.');
        }
        if (record.code !== otp) {
            throw new common_1.BadRequestException('Invalid OTP code.');
        }
        this.otpStore.delete(phone);
        return { success: true, message: 'Phone number verified successfully' };
    }
    async create(body, file) {
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
            throw new common_1.BadRequestException('Resume file required');
        }
        console.debug(`Resume upload: file=${file.originalname} mime=${file.mimetype} size=${file.size} bytes`);
        if (file.mimetype && !file.mimetype.includes('pdf')) {
            throw new common_1.BadRequestException('Please upload a text-based PDF resume.');
        }
        if (file.buffer && file.buffer.length > 0) {
            const snippet = file.buffer.toString('utf8', 0, Math.min(8000, file.buffer.length));
            const hasText = /[A-Za-z0-9]/.test(snippet);
            if (!hasText) {
                throw new common_1.BadRequestException('Please upload a text-based PDF resume.');
            }
        }
        const normalizedEmail = body.email.trim().toLowerCase();
        const { resumeText, resumeParsed } = await this.resumeParserService.parseFromFile(file);
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
        const result = await this.pool.query(insertQuery, [
            body.firstName,
            body.middleName || null,
            body.lastName,
            normalizedEmail,
            body.phone,
            resumeText,
            JSON.stringify(resumeParsed),
        ]);
        const userId = result.rows[0].id;
        const { url: resumeUrl, key: resumeKey } = await this.uploadsService.uploadResume(file, userId);
        await this.pool.query(`UPDATE users SET resume_url = $1, resume_key = $2, updated_at = now() WHERE id = $3`, [resumeUrl, resumeKey, userId]);
        return this.mapUser(result.rows[0]);
    }
    async replaceResume(email, file) {
        await this.schemaReady;
        if (!file) {
            throw new common_1.BadRequestException('Resume file required');
        }
        if (file.mimetype && !file.mimetype.includes('pdf')) {
            throw new common_1.BadRequestException('Please upload a text-based PDF resume.');
        }
        const normalizedEmail = email.trim().toLowerCase();
        const userResult = await this.pool.query(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [normalizedEmail]);
        if (!userResult.rows.length) {
            throw new common_1.NotFoundException('User not found.');
        }
        const userId = userResult.rows[0].id;
        const { resumeText, resumeParsed } = await this.resumeParserService.parseFromFile(file);
        const { url: resumeUrl, key: resumeKey } = await this.uploadsService.uploadResume(file, userId);
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
        const result = await this.pool.query(updateQuery, [
            resumeUrl,
            resumeKey,
            resumeText,
            JSON.stringify(resumeParsed),
            userId,
        ]);
        return {
            message: 'Resume replaced successfully',
            resumeParsed: result.rows[0].resume_parsed,
        };
    }
    async findByEmail(email) {
        await this.schemaReady;
        const result = await this.pool.query(`SELECT * FROM users WHERE email = $1 LIMIT 1`, [email.trim().toLowerCase()]);
        if (!result.rows.length)
            return null;
        return this.mapUser(result.rows[0]);
    }
    async findById(id) {
        await this.schemaReady;
        const result = await this.pool.query(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [id]);
        if (!result.rows.length)
            return null;
        return this.mapUser(result.rows[0]);
    }
    async googleLogin(token) {
        try {
            await this.schemaReady;
            const googleResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!googleResponse.ok) {
                throw new common_1.UnauthorizedException('Invalid Google token');
            }
            const googleUser = await googleResponse.json();
            const normalizedEmail = googleUser.email.trim().toLowerCase();
            let userWithResume;
            try {
                userWithResume = await this.getCurrentUser(normalizedEmail);
            }
            catch (error) {
                if (error instanceof common_1.NotFoundException) {
                    const firstName = googleUser.given_name || googleUser.name || 'Google';
                    const lastName = googleUser.family_name || 'User';
                    const insertQuery = `
            INSERT INTO users (
              first_name, last_name, email, phone, email_verified
            ) VALUES ($1, $2, $3, $4, TRUE) RETURNING *;
          `;
                    const result = await this.pool.query(insertQuery, [
                        firstName,
                        lastName,
                        normalizedEmail,
                        '0000000000',
                    ]);
                    userWithResume = await this.getCurrentUser(normalizedEmail);
                }
                else {
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
        }
        catch (error) {
            console.error('Google Login failed:', error);
            throw new common_1.UnauthorizedException('Google authentication failed');
        }
    }
    async updateProfile(email, updateData) {
        await this.schemaReady;
        const normalizedEmail = email.trim().toLowerCase();
        await this.pool.query(`UPDATE users 
       SET first_name = COALESCE($1, first_name), 
           last_name = COALESCE($2, last_name), 
           updated_at = now() 
       WHERE email = $3`, [updateData.firstName, updateData.lastName, normalizedEmail]);
        const result = await this.pool.query(`SELECT resume_parsed FROM users WHERE email = $1`, [normalizedEmail]);
        if (result.rows.length === 0) {
            throw new common_1.NotFoundException('User not found');
        }
        const existingParsed = result.rows[0].resume_parsed || {};
        let expYears = existingParsed.experience_years;
        if (updateData.experience) {
            const parsedExp = parseFloat(updateData.experience.replace(/[^0-9.]/g, ''));
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
            skills: updateData.skills || existingParsed.skills,
        };
        await this.pool.query(`UPDATE users SET resume_parsed = $1::jsonb, updated_at = now() WHERE email = $2`, [JSON.stringify(updatedParsed), normalizedEmail]);
        return { message: 'Profile updated successfully' };
    }
    async login(email) {
        const userWithResume = await this.getCurrentUser(email.trim().toLowerCase());
        const accessToken = await this.jwtService.signAsync({
            sub: userWithResume.id,
            email: userWithResume.email,
        });
        return {
            accessToken,
            user: userWithResume,
        };
    }
    async getCurrentUser(email) {
        await this.schemaReady;
        const result = await this.pool.query(`SELECT * FROM users WHERE email = $1 LIMIT 1`, [email.trim().toLowerCase()]);
        const row = result.rows[0];
        if (!row) {
            throw new common_1.NotFoundException('User not found. Please register first.');
        }
        let signedResumeUrl = null;
        if (row.resume_url) {
            const resumeKey = row.resume_key ?? this.extractResumeKey(row.resume_url);
            if (!resumeKey) {
                throw new common_1.BadRequestException('Could not resolve resume key.');
            }
            signedResumeUrl = await this.uploadsService.getSignedResumeUrl(resumeKey);
        }
        const mapped = this.mapUser(row);
        return {
            ...mapped,
            resumeUrl: signedResumeUrl,
        };
    }
    async devCreateTestUser(payload) {
        const { firstName, middleName, lastName, email, phone, resumeUrl } = payload;
        await this.schemaReady;
        const normalizedEmail = email.trim().toLowerCase();
        const res = await this.pool.query(`INSERT INTO users (
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
      RETURNING *;`, [
            firstName,
            middleName || null,
            lastName,
            normalizedEmail,
            phone,
            resumeUrl ?? null,
        ]);
        return this.mapUser(res.rows[0]);
    }
    async downloadResume(candidateId, res) {
        await this.schemaReady;
        const user = await this.findById(candidateId);
        if (!user || !user.resumeKey) {
            throw new common_1.NotFoundException('Resume not found for this candidate');
        }
        const signedUrl = await this.uploadsService.getSignedResumeUrl(user.resumeKey);
        return res.redirect(signedUrl);
    }
    async getSemanticProfile(email) {
        await this.schemaReady;
        const result = await this.pool.query(`SELECT * FROM users WHERE email = $1 LIMIT 1`, [email.trim().toLowerCase()]);
        const row = result.rows[0];
        if (!row) {
            throw new common_1.NotFoundException('User not found. Please register first.');
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
    async ensureSchema() {
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
    mapUser(row) {
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
    extractResumeKey(resumeUrl) {
        try {
            const parsed = new URL(resumeUrl);
            const parts = parsed.pathname.split('/').filter(Boolean);
            if (parts.length >= 2) {
                return decodeURIComponent(parts.slice(1).join('/'));
            }
            return null;
        }
        catch {
            return null;
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_constants_1.PG_POOL)),
    __metadata("design:paramtypes", [typeof (_a = typeof pg_1.Pool !== "undefined" && pg_1.Pool) === "function" ? _a : Object, uploads_service_1.UploadsService,
        jwt_1.JwtService,
        resume_parser_service_1.ResumeParserService,
        sms_service_1.SmsService])
], UsersService);
//# sourceMappingURL=users.service.js.map