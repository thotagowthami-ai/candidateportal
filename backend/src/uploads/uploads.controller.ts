import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('uploads')
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  @Post('resume')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
    }),
  )
  uploadResume(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user: { id?: string; sub?: string } },
  ) {
    const userId = req.user?.id ?? req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Missing user identity');
    }
    return this.uploadsService.uploadResume(file, userId);
  }
}
