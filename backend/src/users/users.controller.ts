import {
  Controller,
  Post,
  Get,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
  Param,
  Res,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import type { Express, Response } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('login')
  async login(@Body() body: LoginUserDto) {
    console.log('LOGIN REQUEST BODY', body);
    return this.usersService.login(body.email);
  }

  // --- NEW GOOGLE LOGIN ROUTE ---
  @Post('google-login')
  async googleLogin(@Body('token') token: string) {
    console.log('GOOGLE LOGIN REQUEST TOKEN RECEIVED');
    return this.usersService.googleLogin(token);
  }
  // ------------------------------

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@Req() req: { user: { email: string } }) {
    return this.usersService.getCurrentUser(req.user.email);
  }

  @Get('me/semantic')
  @UseGuards(AuthGuard('jwt'))
  async meSemantic(@Req() req: { user: { email: string } }) {
    return this.usersService.getSemanticProfile(req.user.email);
  }

  @Get(':candidateId/resume')
  @UseGuards(AuthGuard('jwt'))
  async downloadResume(
    @Param('candidateId') candidateId: string,
    @Res() res: Response,
  ) {
    return this.usersService.downloadResume(candidateId, res);
  }

  @Post('update-profile')
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(
    @Req() req: { user: { email: string } },
    @Body() body: any,
  ) {
    return this.usersService.updateProfile(req.user.email, body);
  }
  @Post('send-otp')
  @UseGuards(AuthGuard('jwt'))
  async sendOtp(@Body('phone') phone: string) {
    if (!phone) throw new UnauthorizedException('Phone number required');
    return this.usersService.sendOtp(phone);
  }

  @Post('verify-otp')
  @UseGuards(AuthGuard('jwt'))
  async verifyOtp(@Body() body: { phone: string; otp: string }) {
    if (!body.phone || !body.otp) {
      throw new UnauthorizedException('Phone number and OTP required');
    }
    return this.usersService.verifyOtp(body.phone, body.otp);
  }

  // --- NEW: REPLACE EXISTING RESUME ROUTE ---
  @Post('upload')
  @UseGuards(AuthGuard('jwt')) // Ensure the user is logged in
  @UseInterceptors(
    FileInterceptor('resume', {
      // Note: we named it 'file' in Settings.tsx FormData
      storage: multer.memoryStorage(),
    }),
  )
  async replaceResume(
    @Req() req: { user: { email: string } }, // Get the logged-in user's email from JWT
    @UploadedFile() file: Express.Multer.File, // Catch the uploaded PDF
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Call a new method in your UsersService to handle the replacement logic
    return this.usersService.replaceResume(req.user.email, file);
  }
  // -----------------------------------------

  @Post('create')
  @UseInterceptors(
    FileInterceptor('resume', {
      storage: multer.memoryStorage(),
    }),
  )
  async createUser(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateUserDto,
  ) {
    return this.usersService.create(body, file);
  }

  @Post('test-create')
  async testCreate(
    @Body()
    payload: {
      firstName: string;
      middleName?: string;
      lastName: string;
      email: string;
      phone: string;
      resumeUrl?: string;
    },
  ) {
    if (process.env.DEV_BYPASS_OTP !== 'true') {
      throw new UnauthorizedException('Dev bypass not enabled');
    }
    return this.usersService.devCreateTestUser(payload);
  }
}
