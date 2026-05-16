import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { SmsService } from './sms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notify-candidate')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async notifyCandidate(@Body() body: { phone: string; message: string }) {
    if (!body.phone || !body.message) {
      throw new HttpException(
        'Phone number and message are required',
        HttpStatus.BAD_REQUEST,
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
