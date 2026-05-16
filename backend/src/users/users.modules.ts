import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UploadsModule } from '../uploads/uploads.module';
import { JwtStrategy } from './jwt.strategy';
import { ResumeParserService } from './resume-parser.service';

@Module({
  imports: [
    UploadsModule,
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
