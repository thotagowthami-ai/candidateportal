import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MatchJdDto } from './dto/match-jd.dto';
import { MatchService } from './match.service';

@Controller('match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @UseGuards(JwtAuthGuard)
  @Post('jd')
  matchJd(@Body() body: MatchJdDto) {
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
  matchJdForUser(@Body() body: MatchJdDto, @Param('userId') userId: string) {
    return this.matchService.matchByJdForUserId(body, userId);
  }

  // NEW: endpoint for Recruiting backend to create matches in DB
  // POST http://candidate-portal:3000/match/jd/save?jobDescriptionId=...
  @UseGuards(JwtAuthGuard)
  @Post('jd/save')
  async saveMatchesForJob(
    @Query('jobDescriptionId') jobDescriptionId: string,
    @Body() body: MatchJdDto,
  ) {
    if (!jobDescriptionId?.trim()) {
      throw new BadRequestException('jobDescriptionId query param is required');
    }
    return this.matchService.saveMatchesForJob(jobDescriptionId, body);
  }
}
