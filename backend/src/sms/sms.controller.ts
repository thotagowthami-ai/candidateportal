import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SmsService } from './sms.service';

@Controller('notify-candidate')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

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
      throw new HttpException(
        { error: 'Failed to send SMS', details: result.error },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
