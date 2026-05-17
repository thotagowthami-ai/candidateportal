import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
  Req,
  Inject,
} from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.constants';
import { SmsService } from './sms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class NotifyCandidateDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'Phone number must be in E.164 format (e.g. +14155552671)',
  })
  phone: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

@Controller('notify-candidate')
export class SmsController {
  constructor(
    private readonly smsService: SmsService,
    @Inject(PG_POOL) private readonly pool: Pool,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async notifyCandidate(@Req() req: any, @Body() body: NotifyCandidateDto) {
    // 1. Validate message template to prevent arbitrary outbound SMS spamming
    const ALLOWED_TEMPLATES = [
      /^Your RecruitApp verification code is: \d{4,6}\. Valid for \d+ minutes\.$/,
      /^Your verification code is: \d{4,6}$/,
      /^Your candidate profile has been successfully updated\.$/,
      /^A new job match is available for you\.$/,
    ];

    const matchesTemplate = ALLOWED_TEMPLATES.some((regex) =>
      regex.test(body.message),
    );
    if (!matchesTemplate) {
      throw new HttpException(
        'Message content does not match allowed notification templates',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 2. Enforce that the destination phone number belongs to the authenticated caller
    const dbResult = await this.pool.query(
      'SELECT phone FROM users WHERE email = $1 LIMIT 1',
      [req.user.email],
    );

    const userPhone = dbResult.rows[0]?.phone;
    if (!userPhone || userPhone !== body.phone) {
      throw new HttpException(
        'Forbidden: Destination phone number does not match caller verified phone number',
        HttpStatus.FORBIDDEN,
      );
    }

    const result = await this.smsService.sendCandidateSMS(
      body.phone,
      body.message,
    );

    if (result.success) {
      return { message: 'SMS sent successfully!', sid: result.messageSid };
    } else {
      console.error('SMS sending failed:', result.error);
      throw new HttpException(
        { error: 'Failed to send SMS', details: 'Internal provider error' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
