import { Injectable } from '@nestjs/common';
// Change 1: Import the Twilio class directly
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {
  private client: Twilio;

  constructor() {
    // Change 2: Use the 'new' keyword and the Twilio class
    this.client = new Twilio(
      process.env.TWILIO_ACCOUNT_SID, 
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  async sendCandidateSMS(phone: string, messageBody: string) {
    try {
      const message = await this.client.messages.create({
        body: messageBody,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
      return { success: true, messageSid: message.sid };
    } catch (error: any) {
      console.error('Twilio Error:', error.message);
      return { success: false, error: error.message };
    }
  }
}