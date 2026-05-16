import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { SmsModule } from '../sms/sms.module';
import { GoogleStrategy } from './google.strategy';

@Module({
  imports: [UsersModule, SmsModule, PassportModule],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy],
})
export class AuthModule {
  constructor() {
    console.log(
      'GOOGLE_CLIENT_ID:',
      process.env.GOOGLE_CLIENT_ID ? '✅ loaded' : '❌ MISSING',
    );
    console.log(
      'GOOGLE_CLIENT_SECRET:',
      process.env.GOOGLE_CLIENT_SECRET ? '✅ loaded' : '❌ MISSING',
    );
    console.log(
      'GOOGLE_REDIRECT_URI:',
      process.env.GOOGLE_REDIRECT_URI ? '✅ loaded' : '❌ MISSING',
    );
  }
}