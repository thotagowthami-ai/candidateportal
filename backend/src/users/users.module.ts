import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

import { UploadsModule } from '../uploads/uploads.module';
import { JwtStrategy } from './jwt.strategy';
import { ResumeParserService } from './resume-parser.service';
// 1. ADD THIS IMPORT
import { SmsModule } from '../sms/sms.module'; 

@Module({
  imports: [
    UploadsModule,
    // 2. ADD SmsModule HERE
    SmsModule, 
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'dev_jwt_secret',
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, JwtStrategy, ResumeParserService],
  exports: [UsersService],
})
export class UsersModule {}