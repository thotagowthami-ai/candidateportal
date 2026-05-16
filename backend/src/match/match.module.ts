import { Module } from '@nestjs/common';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';
import { JdParserService } from './jd-parser.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [MatchController],
  providers: [MatchService, JdParserService],
})
export class MatchModule {}
