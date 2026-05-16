import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {
  private client: Twilio;
  private readonly fromNumber: string;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const from = this.configService.get<string>('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !from) {
      throw new Error(
        'Missing Twilio environment variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER',
      );
    }

    this.client = new Twilio(accountSid, authToken);
    this.fromNumber = from;
  }

  async sendCandidateSMS(phone: string, messageBody: string) {
    try {
      const message = await this.client.messages.create({
        body: messageBody,
        from: this.fromNumber,
        to: phone,
      });
      return { success: true, messageSid: message.sid };
    } catch (error: any) {
      console.error('Twilio Error:', error.message);
      return { success: false, error: error.message };
    }
  }
}
