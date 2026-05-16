import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller'; // ✅ ADD THIS
import { AppService } from './app.service'; // ✅ ADD THIS

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { UploadsModule } from './uploads/uploads.module';
import { DatabaseModule } from './database/database.module';
import { MatchModule } from './match/match.module';
import { SmsModule } from './sms/sms.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    UploadsModule,
    MatchModule,
    SmsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
