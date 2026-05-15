import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { Pool } from 'pg';
import { UploadsService } from '../uploads/uploads.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ResumeParserService } from './resume-parser.service';
import type { ResumeParsed } from './schemas/user.schema';
import { SmsService } from '../sms/sms.service';
export declare class UsersService {
    private readonly pool;
    private readonly uploadsService;
    private readonly jwtService;
    private readonly resumeParserService;
    private readonly smsService;
    private readonly schemaReady;
    private otpStore;
    constructor(pool: Pool, uploadsService: UploadsService, jwtService: JwtService, resumeParserService: ResumeParserService, smsService: SmsService);
    sendOtp(phone: string): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyOtp(phone: string, otp: string): Promise<{
        success: boolean;
        message: string;
    }>;
    create(body: CreateUserDto, file: Express.Multer.File): Promise<{
        id: string;
        firstName: string;
        middleName: string;
        lastName: string;
        email: string;
        phone: string;
        resumeUrl: string | null;
        resumeKey: string | null;
        resumeText: string | null;
        resumeParsed: ResumeParsed | null;
        emailVerified: boolean;
        createdAt: string;
        updatedAt: string;
    }>;
    replaceResume(email: string, file: Express.Multer.File): Promise<{
        message: string;
        resumeParsed: any;
    }>;
    findByEmail(email: string): Promise<{
        id: string;
        firstName: string;
        middleName: string;
        lastName: string;
        email: string;
        phone: string;
        resumeUrl: string | null;
        resumeKey: string | null;
        resumeText: string | null;
        resumeParsed: ResumeParsed | null;
        emailVerified: boolean;
        createdAt: string;
        updatedAt: string;
    } | null>;
    findById(id: string): Promise<{
        id: string;
        firstName: string;
        middleName: string;
        lastName: string;
        email: string;
        phone: string;
        resumeUrl: string | null;
        resumeKey: string | null;
        resumeText: string | null;
        resumeParsed: ResumeParsed | null;
        emailVerified: boolean;
        createdAt: string;
        updatedAt: string;
    } | null>;
    googleLogin(token: string): Promise<{
        accessToken: string;
        user: any;
    }>;
    updateProfile(email: string, updateData: any): Promise<{
        message: string;
    }>;
    login(email: string): Promise<{
        accessToken: string;
        user: {
            resumeUrl: string | null;
            id: string;
            firstName: string;
            middleName: string;
            lastName: string;
            email: string;
            phone: string;
            resumeKey: string | null;
            resumeText: string | null;
            resumeParsed: ResumeParsed | null;
            emailVerified: boolean;
            createdAt: string;
            updatedAt: string;
        };
    }>;
    getCurrentUser(email: string): Promise<{
        resumeUrl: string | null;
        id: string;
        firstName: string;
        middleName: string;
        lastName: string;
        email: string;
        phone: string;
        resumeKey: string | null;
        resumeText: string | null;
        resumeParsed: ResumeParsed | null;
        emailVerified: boolean;
        createdAt: string;
        updatedAt: string;
    }>;
    devCreateTestUser(payload: {
        firstName: string;
        middleName?: string;
        lastName: string;
        email: string;
        phone: string;
        resumeUrl?: string;
    }): Promise<{
        id: string;
        firstName: string;
        middleName: string;
        lastName: string;
        email: string;
        phone: string;
        resumeUrl: string | null;
        resumeKey: string | null;
        resumeText: string | null;
        resumeParsed: ResumeParsed | null;
        emailVerified: boolean;
        createdAt: string;
        updatedAt: string;
    }>;
    downloadResume(candidateId: string, res: Response): Promise<void>;
    getSemanticProfile(email: string): Promise<{
        firstName: any;
        lastName: any;
        email: any;
        resumeParsed: any;
    }>;
    private ensureSchema;
    private mapUser;
    private extractResumeKey;
}
