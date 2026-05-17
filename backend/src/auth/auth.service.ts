import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, randomInt } from 'crypto';
import { Resend } from 'resend';
import { UsersService } from '../users/users.service';
import { SmsService } from '../sms/sms.service';
import { TokenStoreService } from '../database/token-store.service';

@Injectable()
export class AuthService {
  private resend: Resend;

  constructor(
    private readonly tokenStore: TokenStoreService,
    private readonly usersService: UsersService,
    private readonly smsService: SmsService,
  ) {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  private normalizeEmail(email: string): string {
    return email?.trim()?.toLowerCase?.() || '';
  }

  async initiate(data: any) {
    const email = this.normalizeEmail(data?.email);
    if (!email) throw new BadRequestException('Email is required.');

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser)
      throw new BadRequestException('Already registered. Please login.');

    return this.sendOtp(email, { ...data, email });
  }

  async sendOtp(email: string, data?: any) {
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail) throw new BadRequestException('Email is required.');

    const otp = randomInt(100000, 1000000).toString();

    // Store in TokenStore with 5 minute TTL
    await this.tokenStore.set(`otp:${normalizedEmail}`, { otp, data }, 5 * 60);

    console.log('Sending OTP to', normalizedEmail.replace(/(.{2}).*(@.*)/, '$1***$2'));

    try {
      await this.resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: normalizedEmail,
        subject: 'Register Portal Email Verification',
        html: `
          <h2>Email Verification</h2>
          <h1>${otp}</h1>
          <p>This OTP expires in 5 minutes.</p>
        `,
      });

      // --- NEW: Also send SMS if phone is provided in data ---
      if (data?.phone) {
        const phone = data.phone.trim();
        if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
          throw new BadRequestException(
            'Phone number must be provided in E.164 format (e.g. +91XXXXXXXXXX).',
          );
        }

        const smsMessage = `Your RecruitApp verification code is: ${otp}. Valid for 5 minutes.`;
        const smsResult = await this.smsService.sendCandidateSMS(
          phone,
          smsMessage,
        );
        if (!smsResult.success) {
          throw new BadRequestException(
            smsResult.error
              ? `Failed to send OTP SMS: ${smsResult.error}`
              : 'Failed to send OTP SMS.',
          );
        }
        console.log(`SMS OTP sent to ***${phone.slice(-4)}`);
      }
    } catch (error: any) {
      const reason = error?.message || error?.response?.data?.message;
      throw new BadRequestException(
        reason ? `Failed to send OTP: ${reason}` : 'Failed to send OTP.',
      );
    }

    return { message: 'OTP sent successfully' };
  }

  async resendOtp(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const record = await this.tokenStore.get(`otp:${normalizedEmail}`);
    return this.sendOtp(normalizedEmail, record?.data);
  }

  async verifyOtp(email: string, otp: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const record = await this.tokenStore.get(`otp:${normalizedEmail}`);

    if (!record) throw new BadRequestException('OTP not found or expired');
    if (record.otp !== otp) throw new BadRequestException('Invalid OTP');

    await this.tokenStore.delete(`otp:${normalizedEmail}`);

    // Check if user already exists (login flow)
    const existingUser = await this.usersService.findByEmail(normalizedEmail);
    if (existingUser) {
      // Existing user — issue token directly
      const { accessToken } = await this.usersService.login(normalizedEmail);
      return {
        message: 'OTP verified successfully',
        accessToken,
        isNewUser: false,
      };
    }

    // New user — return userData so frontend can proceed to registration form
    return {
      message: 'Email verified successfully',
      userData: record.data,
      isNewUser: true,
    };
  }

  async login(email: string) {
    return this.usersService.login(this.normalizeEmail(email));
  }

  async requestPasswordReset(email: string) {
    const normalizedEmail = email?.trim()?.toLowerCase?.() || '';
    if (!normalizedEmail) {
      throw new BadRequestException('Email is required.');
    }

    const existingUser = await this.usersService.findByEmail(normalizedEmail);

    // Always return success to avoid user enumeration
    if (!existingUser) {
      return { message: 'If the email exists, a reset link has been sent.' };
    }

    const token = randomBytes(32).toString('hex');

    // Store in TokenStore with 30 minute TTL
    await this.tokenStore.set(
      `reset:${token}`,
      { email: normalizedEmail },
      30 * 60,
    );

    const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(
      normalizedEmail,
    )}`;

    try {
      await this.resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: normalizedEmail,
        subject: 'Reset your Candidate Portal access',
        html: `
          <h2>Reset Link</h2>
          <p>Click the link below to continue:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>This link expires in 30 minutes.</p>
        `,
      });
    } catch (error: any) {
      const reason = error?.message || error?.response?.data?.message;
      throw new BadRequestException(
        reason
          ? `Failed to send reset link: ${reason}`
          : 'Failed to send reset link.',
      );
    }

    return { message: 'Reset link sent successfully' };
  }

  async verifyResetToken(email: string, token: string) {
    const normalizedEmail = email?.trim()?.toLowerCase?.() || '';
    if (!normalizedEmail || !token) {
      throw new BadRequestException('Email and token are required.');
    }

    const record = await this.tokenStore.get(`reset:${token}`);

    if (!record) {
      throw new BadRequestException('Reset link is invalid or expired.');
    }
    if (record.email !== normalizedEmail) {
      throw new BadRequestException('Reset link does not match email.');
    }

    await this.tokenStore.delete(`reset:${token}`);

    const existingUser = await this.usersService.findByEmail(normalizedEmail);
    if (!existingUser) {
      throw new BadRequestException('User not found. Please register first.');
    }

    const login = await this.usersService.login(normalizedEmail);
    return {
      message: 'Reset link verified',
      ...login,
    };
  }

  async googleLoginWithCode(code: string) {
    if (!code) throw new BadRequestException('Code is required');

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      // 1. Exchange the authorization code for an access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: controller.signal,
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
          grant_type: 'authorization_code',
        }),
      });

      clearTimeout(timeout);

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        console.error('Google token exchange failed:', tokenData);
        throw new UnauthorizedException('Failed to exchange Google code');
      }

      // 2. Use the access token to login/create user
      return this.usersService.googleLogin(tokenData.access_token);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new UnauthorizedException('Google authentication timed out');
      }
      console.error('googleLoginWithCode error:', error);
      throw new UnauthorizedException('Google authentication failed');
    }
  }

  async handleGoogleUser(googleUser: {
    email: string;
    firstName: string;
    lastName: string;
    accessToken: string;
  }) {
    if (!googleUser || !googleUser.email) {
      throw new BadRequestException('Invalid Google user data');
    }

    return this.usersService.googleLogin(googleUser.accessToken);
  }

  async generateExchangeCode(accessToken: string, user: any) {
    const code = randomBytes(16).toString('hex');

    // Store in TokenStore with 1 minute TTL
    await this.tokenStore.set(`exchange:${code}`, { accessToken, user }, 60);
    return code;
  }

  async exchangeCode(code: string) {
    const record = await this.tokenStore.get(`exchange:${code}`);

    if (!record) {
      throw new UnauthorizedException('Invalid or expired exchange code');
    }
    await this.tokenStore.delete(`exchange:${code}`);
    return { accessToken: record.accessToken, user: record.user };
  }

  private escapeHtml(str: string): string {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async contactTeam(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }) {
    if (!data.firstName || !data.email) {
      throw new BadRequestException('Required fields missing.');
    }

    try {
      // Typically sent to an admin/internal team email
      const toEmail = process.env.EMAIL_FROM!;

      const safeFirstName = this.escapeHtml(data.firstName);
      const safeLastName = this.escapeHtml(data.lastName);
      const safeEmail = this.escapeHtml(data.email);
      const safePhone = this.escapeHtml(data.phone);

      await this.resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: toEmail,
        subject: `New Demo/Contact Request: ${safeFirstName} ${safeLastName}`,
        html: `
          <h2>New Team Contact Request</h2>
          <p><strong>Name:</strong> ${safeFirstName} ${safeLastName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Phone:</strong> ${safePhone}</p>
        `,
      });
      return { message: 'Contact request sent successfully.' };
    } catch (error: any) {
      console.error('Contact email error:', error);
      throw new BadRequestException('Failed to send contact request.');
    }
  }
}
