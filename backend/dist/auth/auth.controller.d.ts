import type { Response } from 'express';
import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    initiate(body: any): Promise<{
        message: string;
    }>;
    sendOtp(email: string): Promise<{
        message: string;
    }>;
    resendOtp(email: string): Promise<{
        message: string;
    }>;
    verifyOtp(email: string, otp: string): Promise<{
        message: string;
        accessToken: string;
        isNewUser: boolean;
        userData?: undefined;
    } | {
        message: string;
        userData: any;
        isNewUser: boolean;
        accessToken?: undefined;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(email: string, token: string): Promise<{
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
            resumeParsed: import("../users/schemas/user.schema").ResumeParsed | null;
            emailVerified: boolean;
            createdAt: string;
            updatedAt: string;
        };
        message: string;
    }>;
    contactTeam(body: any): Promise<{
        message: string;
    }>;
    googleAuth(): void;
    googleCallback(req: any, res: Response): Promise<void>;
    test(): {
        status: string;
        message: string;
        timestamp: string;
    };
}
