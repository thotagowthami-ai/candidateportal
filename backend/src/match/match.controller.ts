import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
  Query,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServiceOrJwtAuthGuard } from '../auth/service-or-jwt-auth.guard';
import { MatchJdDto } from './dto/match-jd.dto';
import { MatchService } from './match.service';

@Controller('match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @UseGuards(ServiceOrJwtAuthGuard)
  @Post('jd')
  matchJd(
    @Body() body: MatchJdDto,
    @Req() req: { user: { role?: string } },
  ) {
    const isPrivileged =
      req.user?.role === 'admin' || req.user?.role === 'recruiter';
    if (!isPrivileged) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return this.matchService.matchByJd(body);
  }

  @Post('jd/me')
  @UseGuards(AuthGuard('jwt'))
  matchJdForMe(
    @Body() body: MatchJdDto,
    @Req() req: { user: { email: string } },
  ) {
    return this.matchService.matchByJdForEmail(body, req.user.email);
  }

  @Post('jd/user/:userId')
  @UseGuards(AuthGuard('jwt'))
  matchJdForUser(
    @Body() body: MatchJdDto,
    @Param('userId') userId: string,
    @Req() req: { user: { sub?: string; id?: string; role?: string; email?: string } },
  ) {
    const callerId = req.user?.sub ?? req.user?.id;
    const isPrivileged =
      req.user?.role === 'admin' ||
      req.user?.role === 'recruiter';

    if (!isPrivileged && callerId !== userId) {
      throw new ForbiddenException('Not allowed to access this user');
    }
    return this.matchService.matchByJdForUserId(body, userId);
  }

  // NEW: endpoint for Recruiting backend to create matches in DB
  // POST http://candidate-portal:3000/match/jd/save?jobDescriptionId=...
  @UseGuards(ServiceOrJwtAuthGuard)
  @Post('jd/save')
  async saveMatchesForJob(
    @Query('jobDescriptionId') jobDescriptionId: string,
    @Body() body: MatchJdDto,
    @Req() req: { user: { role?: string; email?: string } },
  ) {
    const isPrivileged =
      req.user?.role === 'admin' ||
      req.user?.role === 'recruiter';

    if (!isPrivileged) {
      throw new ForbiddenException('Insufficient permissions');
    }
    if (!jobDescriptionId?.trim()) {
      throw new BadRequestException('jobDescriptionId query param is required');
    }
    return this.matchService.saveMatchesForJob(jobDescriptionId, body);
  }
}
