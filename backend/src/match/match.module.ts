import { Module } from '@nestjs/common';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';
import { JdParserService } from './jd-parser.service';

@Module({
  controllers: [MatchController],
  providers: [MatchService, JdParserService],
})
export class MatchModule {}
