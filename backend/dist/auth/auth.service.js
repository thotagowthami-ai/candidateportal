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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const resend_1 = require("resend");
const users_service_1 = require("../users/users.service");
const sms_service_1 = require("../sms/sms.service");
let AuthService = class AuthService {
    usersService;
    smsService;
    resend;
    otpStore = new Map();
    resetStore = new Map();
    constructor(usersService, smsService) {
        this.usersService = usersService;
        this.smsService = smsService;
        this.resend = new resend_1.Resend(process.env.RESEND_API_KEY);
    }
    async initiate(data) {
        const email = data?.email?.trim()?.toLowerCase?.() || '';
        if (!email)
            throw new common_1.BadRequestException('Email is required.');
        const existingUser = await this.usersService.findByEmail(email);
        if (existingUser)
            throw new common_1.BadRequestException('Already registered. Please login.');
        return this.sendOtp(email, { ...data, email });
    }
    async sendOtp(email, data) {
        if (!email)
            throw new common_1.BadRequestException('Email is required.');
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        this.otpStore.set(email, {
            otp,
            expires: Date.now() + 5 * 60 * 1000,
            data,
        });
        console.log('Sending OTP:', otp);
        try {
            await this.resend.emails.send({
                from: process.env.EMAIL_FROM,
                to: email,
                subject: 'Register Portal Email Verification',
                html: `
          <h2>Email Verification</h2>
          <h1>${otp}</h1>
          <p>This OTP expires in 5 minutes.</p>
        `,
            });
            if (data?.phone) {
                let phone = data.phone.trim();
                if (phone.length === 10 && !phone.startsWith('+')) {
                    phone = `+91${phone}`;
                }
                else if (phone.startsWith('91') && phone.length === 12) {
                    phone = `+${phone}`;
                }
                const smsMessage = `Your RecruitApp verification code is: ${otp}. Valid for 5 minutes.`;
                await this.smsService.sendCandidateSMS(phone, smsMessage);
                console.log(`SMS OTP sent to ${phone}`);
            }
        }
        catch (error) {
            const reason = error?.message || error?.response?.data?.message;
            throw new common_1.BadRequestException(reason ? `Failed to send OTP: ${reason}` : 'Failed to send OTP.');
        }
        return { message: 'OTP sent successfully' };
    }
    async resendOtp(email) {
        const existing = this.otpStore.get(email);
        return this.sendOtp(email, existing?.data);
    }
    async verifyOtp(email, otp) {
        const record = this.otpStore.get(email);
        if (!record)
            throw new common_1.BadRequestException('OTP not found');
        if (Date.now() > record.expires)
            throw new common_1.BadRequestException('OTP expired');
        if (record.otp !== otp)
            throw new common_1.BadRequestException('Invalid OTP');
        this.otpStore.delete(email);
        const existingUser = await this.usersService.findByEmail(email);
        if (existingUser) {
            const { accessToken } = await this.usersService.login(email);
            return {
                message: 'OTP verified successfully',
                accessToken,
                isNewUser: false,
            };
        }
        return {
            message: 'Email verified successfully',
            userData: record.data,
            isNewUser: true,
        };
    }
    async login(email) {
        return this.usersService.login(email);
    }
    async requestPasswordReset(email) {
        const normalizedEmail = email?.trim()?.toLowerCase?.() || '';
        if (!normalizedEmail) {
            throw new common_1.BadRequestException('Email is required.');
        }
        const existingUser = await this.usersService.findByEmail(normalizedEmail);
        if (!existingUser) {
            return { message: 'If the email exists, a reset link has been sent.' };
        }
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        const expires = Date.now() + 30 * 60 * 1000;
        this.resetStore.set(token, { email: normalizedEmail, expires });
        const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;
        try {
            await this.resend.emails.send({
                from: process.env.EMAIL_FROM,
                to: normalizedEmail,
                subject: 'Reset your Candidate Portal access',
                html: `
          <h2>Reset Link</h2>
          <p>Click the link below to continue:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>This link expires in 30 minutes.</p>
        `,
            });
        }
        catch (error) {
            const reason = error?.message || error?.response?.data?.message;
            throw new common_1.BadRequestException(reason
                ? `Failed to send reset link: ${reason}`
                : 'Failed to send reset link.');
        }
        return { message: 'Reset link sent successfully' };
    }
    async verifyResetToken(email, token) {
        const normalizedEmail = email?.trim()?.toLowerCase?.() || '';
        if (!normalizedEmail || !token) {
            throw new common_1.BadRequestException('Email and token are required.');
        }
        const record = this.resetStore.get(token);
        if (!record) {
            throw new common_1.BadRequestException('Reset link is invalid.');
        }
        if (record.email !== normalizedEmail) {
            throw new common_1.BadRequestException('Reset link does not match email.');
        }
        if (Date.now() > record.expires) {
            this.resetStore.delete(token);
            throw new common_1.BadRequestException('Reset link expired.');
        }
        this.resetStore.delete(token);
        const existingUser = await this.usersService.findByEmail(normalizedEmail);
        if (!existingUser) {
            throw new common_1.BadRequestException('User not found. Please register first.');
        }
        const login = await this.usersService.login(normalizedEmail);
        return {
            message: 'Reset link verified',
            ...login,
        };
    }
    async googleLoginWithCode(code) {
        if (!code)
            throw new common_1.BadRequestException('Code is required');
        try {
            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    code,
                    client_id: process.env.GOOGLE_CLIENT_ID,
                    client_secret: process.env.GOOGLE_CLIENT_SECRET,
                    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
                    grant_type: 'authorization_code',
                }),
            });
            const tokenData = await tokenResponse.json();
            if (!tokenResponse.ok) {
                console.error('Google token exchange failed:', tokenData);
                throw new common_1.UnauthorizedException('Failed to exchange Google code');
            }
            return this.usersService.googleLogin(tokenData.access_token);
        }
        catch (error) {
            console.error('googleLoginWithCode error:', error);
            throw new common_1.UnauthorizedException('Google authentication failed');
        }
    }
    async handleGoogleUser(googleUser) {
        if (!googleUser || !googleUser.email) {
            throw new common_1.BadRequestException('Invalid Google user data');
        }
        return this.usersService.googleLogin(googleUser.accessToken);
    }
    async contactTeam(data) {
        if (!data.firstName || !data.email) {
            throw new common_1.BadRequestException('Required fields missing.');
        }
        try {
            const toEmail = process.env.EMAIL_FROM;
            await this.resend.emails.send({
                from: process.env.EMAIL_FROM,
                to: toEmail,
                subject: `New Demo/Contact Request: ${data.firstName} ${data.lastName}`,
                html: `
          <h2>New Team Contact Request</h2>
          <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Phone:</strong> ${data.phone}</p>
        `,
            });
            return { message: 'Contact request sent successfully.' };
        }
        catch (error) {
            console.error('Contact email error:', error);
            throw new common_1.BadRequestException('Failed to send contact request.');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        sms_service_1.SmsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map