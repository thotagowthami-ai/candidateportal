import { Module } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { DatabaseModule } from '../database/database.module';
import { ResumeParserService } from '../users/resume-parser.service';

@Module({
  imports: [DatabaseModule],
  providers: [UploadsService, ResumeParserService],
  controllers: [UploadsController],
  exports: [UploadsService],
})
export class UploadsModule {}
