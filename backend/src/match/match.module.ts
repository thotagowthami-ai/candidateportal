import { Module } from '@nestjs/common';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';
import { JdParserService } from './jd-parser.service';
import { DatabaseModule } from '../database/database.module';
import { ServiceOrJwtAuthGuard } from '../auth/service-or-jwt-auth.guard';

@Module({
  imports: [DatabaseModule],
  controllers: [MatchController],
  providers: [MatchService, JdParserService, ServiceOrJwtAuthGuard],
})
export class MatchModule {}
