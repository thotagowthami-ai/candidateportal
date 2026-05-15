import { UsersService } from '../users/users.service';
import { SmsService } from '../sms/sms.service';
export declare class AuthService {
    private readonly usersService;
    private readonly smsService;
    private resend;
    private otpStore;
    private resetStore;
    constructor(usersService: UsersService, smsService: SmsService);
    initiate(data: any): Promise<{
        message: string;
    }>;
    sendOtp(email: string, data?: any): Promise<{
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
            resumeParsed: import("../users/schemas/user.schema").ResumeParsed | null;
            emailVerified: boolean;
            createdAt: string;
            updatedAt: string;
        };
    }>;
    requestPasswordReset(email: string): Promise<{
        message: string;
    }>;
    verifyResetToken(email: string, token: string): Promise<{
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
    googleLoginWithCode(code: string): Promise<{
        accessToken: string;
        user: any;
    }>;
    handleGoogleUser(googleUser: {
        email: string;
        firstName: string;
        lastName: string;
        accessToken: string;
    }): Promise<{
        accessToken: string;
        user: any;
    }>;
    contactTeam(data: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    }): Promise<{
        message: string;
    }>;
}
