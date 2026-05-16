import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ✅ Page 1 — initiate registration + send OTP
  @Post('initiate')
  initiate(@Body() body: any) {
    return this.authService.initiate(body);
  }

  // ✅ Send OTP manually (optional)
  @Post('send-otp')
  sendOtp(@Body('email') email: string) {
    console.log('Sending OTP to:', email);

    return this.authService.sendOtp(email);
  }

  // ✅ Resend OTP
  @Post('resend-otp')
  resendOtp(@Body('email') email: string) {
    return this.authService.resendOtp(email);
  }

  // ✅ Verify OTP (Page 2)
  @Post('verify-otp')
  verifyOtp(@Body('email') email: string, @Body('otp') otp: string) {
    return this.authService.verifyOtp(email, otp);
  }

  // ✅ Forgot password (send reset link)
  @Post('forgot-password')
  forgotPassword(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  // ✅ Verify reset link (magic login)
  @Post('reset-password')
  resetPassword(@Body('email') email: string, @Body('token') token: string) {
    return this.authService.verifyResetToken(email, token);
  }

  // ✅ Contact Team (Lead generation)
  @Post('contact')
  contactTeam(@Body() body: any) {
    return this.authService.contactTeam(body);
  }

  @Post('exchange')
  exchange(@Body('code') code: string) {
    return this.authService.exchangeCode(code);
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
      const code = await this.authService.generateExchangeCode(result.accessToken, result.user);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      const redirectUrl = new URL(`${frontendUrl}/resume`);
      redirectUrl.searchParams.set('code', code);

      return res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error('Google callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/?error=google_auth_failed`);
    }
  }

  @Get('test')
  test() {
    return { status: 'ok', message: 'Auth controller is live', timestamp: new Date().toISOString() };
  }
}
