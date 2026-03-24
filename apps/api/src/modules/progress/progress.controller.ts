import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser('id') userId: string) {
    return this.progressService.getDashboard(userId);
  }

  @Get('skills')
  getSkillBreakdown(@CurrentUser('id') userId: string) {
    return this.progressService.getSkillBreakdown(userId);
  }

  @Get('sessions')
  getSessionHistory(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe)
    pageSize: number,
  ) {
    return this.progressService.getSessionHistory(userId, page, pageSize);
  }

  @Get('score')
  getProjectedScore(@CurrentUser('id') userId: string) {
    return this.progressService.projectScore(userId);
  }

  @Get('recommendations')
  getRecommendations(@CurrentUser('id') userId: string) {
    return this.progressService.getRecommendations(userId);
  }

  @Get('error-patterns')
  getErrorPatterns(@CurrentUser('id') userId: string) {
    return this.progressService.getErrorPatternBreakdown(userId);
  }

  @Get('time-analytics')
  getTimeAnalytics(@CurrentUser('id') userId: string) {
    return this.progressService.getTimeAnalytics(userId);
  }
}
