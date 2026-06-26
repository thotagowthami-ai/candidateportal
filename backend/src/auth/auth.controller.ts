import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { InitiateRegistrationDto } from './dto/initiate-registration.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ContactDto } from './dto/contact.dto';
import { ExchangeDto } from './dto/exchange.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ✅ Page 1 — initiate registration + send OTP
  @Post('initiate')
  initiate(@Body() dto: InitiateRegistrationDto) {
    return this.authService.initiate(dto);
  }

  // ✅ Initiate login + send OTP
  @Post('initiate-login')
  initiateLogin(@Body() dto: { email: string }) {
    return this.authService.initiateLogin(dto.email);
  }

  // ✅ Send OTP manually (optional)
  @Post('send-otp')
  sendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.sendOtp(dto.email);
  }

  // ✅ Resend OTP
  @Post('resend-otp')
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto.email);
  }

  // ✅ Verify OTP (Page 2)
  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.email, dto.otp);
  }

  // ✅ Forgot password (send reset link)
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  // ✅ Verify reset link (magic login)
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.verifyResetToken(dto.email, dto.token);
  }

  // ✅ Contact Team (Lead generation)
  @Post('contact')
  contactTeam(@Body() dto: ContactDto) {
    return this.authService.contactTeam(dto);
  }

  @Post('exchange')
  exchange(@Body() dto: ExchangeDto) {
    return this.authService.exchangeCode(dto.code);
  }

  // ✅ Google OAuth — Step 1: Redirect user to Google consent screen
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Passport automatically redirects to Google
  }

  // ✅ Google OAuth — Step 2: Handle callback from Google
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: Response) {
    try {
      // req.user is set by GoogleStrategy.validate()
      const googleUser = req.user;
      const result = await this.authService.handleGoogleUser(googleUser);
      // Generate a one-time exchange code instead of passing the token directly
      const code = await this.authService.generateExchangeCode(
        result.accessToken,
        result.user,
      );
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      const redirectUrl = new URL(`${frontendUrl}/settings`);
      redirectUrl.searchParams.set('code', code);

      return res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error('Google callback error');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/?error=google_auth_failed`);
    }
  }

  @Get('test')
  test() {
    return {
      status: 'ok',
      message: 'Auth controller is live',
      timestamp: new Date().toISOString(),
    };
  }
}
