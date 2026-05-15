import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import type { Response } from 'express';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    login(body: LoginUserDto): Promise<{
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
            resumeParsed: import("./schemas/user.schema").ResumeParsed | null;
            emailVerified: boolean;
            createdAt: string;
            updatedAt: string;
        };
    }>;
    googleLogin(token: string): Promise<{
        accessToken: string;
        user: any;
    }>;
    me(req: {
        user: {
            email: string;
        };
    }): Promise<{
        resumeUrl: string | null;
        id: string;
        firstName: string;
        middleName: string;
        lastName: string;
        email: string;
        phone: string;
        resumeKey: string | null;
        resumeText: string | null;
        resumeParsed: import("./schemas/user.schema").ResumeParsed | null;
        emailVerified: boolean;
        createdAt: string;
        updatedAt: string;
    }>;
    meSemantic(req: {
        user: {
            email: string;
        };
    }): Promise<{
        firstName: any;
        lastName: any;
        email: any;
        resumeParsed: any;
    }>;
    downloadResume(candidateId: string, res: Response): Promise<void>;
    updateProfile(req: {
        user: {
            email: string;
        };
    }, body: any): Promise<{
        message: string;
    }>;
    sendOtp(phone: string): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyOtp(body: {
        phone: string;
        otp: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    replaceResume(req: {
        user: {
            email: string;
        };
    }, file: Express.Multer.File): Promise<{
        message: string;
        resumeParsed: any;
    }>;
    createUser(file: Express.Multer.File, body: CreateUserDto): Promise<{
        id: string;
        firstName: string;
        middleName: string;
        lastName: string;
        email: string;
        phone: string;
        resumeUrl: string | null;
        resumeKey: string | null;
        resumeText: string | null;
        resumeParsed: import("./schemas/user.schema").ResumeParsed | null;
        emailVerified: boolean;
        createdAt: string;
        updatedAt: string;
    }>;
    testCreate(payload: {
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
        resumeParsed: import("./schemas/user.schema").ResumeParsed | null;
        emailVerified: boolean;
        createdAt: string;
        updatedAt: string;
    }>;
}
