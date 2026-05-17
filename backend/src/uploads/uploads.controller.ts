import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Request,
  UnauthorizedException,
  BadRequestException,
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
      limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB limit
      },
      fileFilter: (_req, file, cb) => {
        const allowedMimeTypes = new Set([
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ]);
        if (!allowedMimeTypes.has(file.mimetype)) {
          return cb(
            new BadRequestException('Only PDF and DOCX files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadResume(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user: { id?: string; sub?: string } },
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const userId = req.user?.id ?? req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Missing user identity');
    }
    return this.uploadsService.uploadResume(file, userId);
  }
}
