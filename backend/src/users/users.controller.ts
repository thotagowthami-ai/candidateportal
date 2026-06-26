import {
  Controller,
  Post,
  Get,
  Body,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
  Req,
  Param,
  Res,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AnyFilesInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { Express, Response } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('login')
  async login(@Body() body: LoginUserDto) {
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
    @Req() req: { user: { sub?: string; email: string } },
    @Param('candidateId') candidateId: string,
    @Res() res: Response,
  ) {
    return this.usersService.downloadResume(candidateId, res, req.user);
  }

  @Post('update-profile')
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(
    @Req() req: { user: { email: string } },
    @Body() body: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.email, body);
  }
  @Post('send-otp')
  @UseGuards(AuthGuard('jwt'))
  async sendOtp(
    @Req() req: { user: { email: string } },
    @Body('phone') bodyPhone?: string,
  ) {
    const user = await this.usersService.getCurrentUser(req.user.email);
    const userPhone = user.phone;
    
    const targetPhone = bodyPhone || userPhone;
    if (!targetPhone) {
      throw new BadRequestException('Phone number is required.');
    }
    return this.usersService.sendOtp(targetPhone);
  }

  @Post('verify-otp')
  @UseGuards(AuthGuard('jwt'))
  async verifyOtp(
    @Req() req: { user: { email: string } },
    @Body() body: { phone?: string; otp: string },
  ) {
    if (!body.otp) {
      throw new BadRequestException('OTP is required.');
    }
    const user = await this.usersService.getCurrentUser(req.user.email);
    const userPhone = user.phone;
    
    const targetPhone = body.phone || userPhone;
    if (!targetPhone) {
      throw new BadRequestException('Phone number is required.');
    }
    return this.usersService.verifyOtp(targetPhone, body.otp, req.user.email);
  }

  @Post('send-email-otp')
  @UseGuards(AuthGuard('jwt'))
  async sendEmailOtp(
    @Req() req: { user: { email: string } },
    @Body('email') bodyEmail?: string,
  ) {
    const targetEmail = bodyEmail || req.user.email;
    if (!targetEmail) {
      throw new BadRequestException('Email is required.');
    }
    return this.usersService.sendEmailOtp(targetEmail);
  }

  @Post('verify-email-otp')
  @UseGuards(AuthGuard('jwt'))
  async verifyEmailOtp(
    @Req() req: { user: { email: string } },
    @Body() body: { email?: string; otp: string },
  ) {
    if (!body.otp) {
      throw new BadRequestException('OTP is required.');
    }
    const targetEmail = body.email || req.user.email;
    if (!targetEmail) {
      throw new BadRequestException('Email is required.');
    }
    return this.usersService.verifyEmailOtp(targetEmail, body.otp);
  }

  // --- NEW: REPLACE EXISTING RESUME ROUTE ---
  @Post('upload')
  @UseGuards(AuthGuard('jwt')) // Ensure the user is logged in
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    }),
  )
  async replaceResume(
    @Req() req: { user: { email: string } }, // Get the logged-in user's email from JWT
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const file = files?.[0];
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Call a new method in your UsersService to handle the replacement logic
    return this.usersService.replaceResume(req.user.email, file);
  }
  // -----------------------------------------

  @Post('create')
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    }),
  )
  async createUser(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: CreateUserDto,
  ) {
    const file = files?.[0];
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.usersService.create(body, file);
  }

  @Post('test-create')
  @UseGuards(AuthGuard('jwt'))
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
      throw new UnauthorizedException('Dev bypass not enabled or allowed');
    }
    return this.usersService.devCreateTestUser(payload);
  }
}
