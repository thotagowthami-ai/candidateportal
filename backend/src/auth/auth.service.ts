import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Resend } from 'resend';
import { UsersService } from '../users/users.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class AuthService {
  private resend: Resend;
  private otpStore = new Map<
    string,
    { otp: string; expires: number; data?: any }
  >();
  private resetStore = new Map<string, { email: string; expires: number }>();
  private exchangeStore = new Map<
    string,
    { accessToken: string; user: any; expires: number }
  >();

  constructor(
    private readonly usersService: UsersService,
    private readonly smsService: SmsService,
  ) {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async initiate(data: any) {
    const email = data?.email?.trim()?.toLowerCase?.() || '';
    if (!email) throw new BadRequestException('Email is required.');

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser)
      throw new BadRequestException('Already registered. Please login.');

    return this.sendOtp(email, { ...data, email });
  }

  async sendOtp(email: string, data?: any) {
    if (!email) throw new BadRequestException('Email is required.');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpStore.set(email, {
      otp,
      expires: Date.now() + 5 * 60 * 1000,
      data,
    });

    console.log('Sending OTP:', otp);

    try {
      await this.resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: email,
        subject: 'Register Portal Email Verification',
        html: `
          <h2>Email Verification</h2>
          <h1>${otp}</h1>
          <p>This OTP expires in 5 minutes.</p>
        `,
      });

      // --- NEW: Also send SMS if phone is provided in data ---
      if (data?.phone) {
        let phone = data.phone.trim();
        // Simple normalization: if it's 10 digits, prefix with +91 (India)
        if (phone.length === 10 && !phone.startsWith('+')) {
          phone = `+91${phone}`;
        } else if (phone.startsWith('91') && phone.length === 12) {
          phone = `+${phone}`;
        }
        
        const smsMessage = `Your RecruitApp verification code is: ${otp}. Valid for 5 minutes.`;
        await this.smsService.sendCandidateSMS(phone, smsMessage);
        console.log(`SMS OTP sent to ${phone}`);
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
    const existing = this.otpStore.get(email);
    return this.sendOtp(email, existing?.data);
  }

  async verifyOtp(email: string, otp: string) {
    const record = this.otpStore.get(email);

    if (!record) throw new BadRequestException('OTP not found');
    if (Date.now() > record.expires)
      throw new BadRequestException('OTP expired');
    if (record.otp !== otp) throw new BadRequestException('Invalid OTP');

    this.otpStore.delete(email);

    // Check if user already exists (login flow)
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      // Existing user — issue token directly
      const { accessToken } = await this.usersService.login(email);
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
    return this.usersService.login(email);
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
    const expires = Date.now() + 30 * 60 * 1000;
    this.resetStore.set(token, { email: normalizedEmail, expires });

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

    const record = this.resetStore.get(token);
    if (!record) {
      throw new BadRequestException('Reset link is invalid.');
    }
    if (record.email !== normalizedEmail) {
      throw new BadRequestException('Reset link does not match email.');
    }
    if (Date.now() > record.expires) {
      this.resetStore.delete(token);
      throw new BadRequestException('Reset link expired.');
    }

    this.resetStore.delete(token);

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
      // 1. Exchange the authorization code for an access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        console.error('Google token exchange failed:', tokenData);
        throw new UnauthorizedException('Failed to exchange Google code');
      }

      // 2. Use the access token to login/create user
      return this.usersService.googleLogin(tokenData.access_token);
    } catch (error) {
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
    this.exchangeStore.set(code, {
      accessToken,
      user,
      expires: Date.now() + 60 * 1000, // 1 minute
    });
    return code;
  }

  async exchangeCode(code: string) {
    const record = this.exchangeStore.get(code);
    if (!record || Date.now() > record.expires) {
      throw new UnauthorizedException('Invalid or expired exchange code');
    }
    this.exchangeStore.delete(code);
    return { accessToken: record.accessToken, user: record.user };
  }

  async contactTeam(data: { firstName: string, lastName: string, email: string, phone: string }) {
    if (!data.firstName || !data.email) {
      throw new BadRequestException('Required fields missing.');
    }
    
    try {
      // Typically sent to an admin/internal team email
      const toEmail = process.env.EMAIL_FROM!; 
      
      await this.resend.emails.send({
        from: process.env.EMAIL_FROM!,
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
    } catch (error: any) {
      console.error('Contact email error:', error);
      throw new BadRequestException('Failed to send contact request.');
    }
  }
}
