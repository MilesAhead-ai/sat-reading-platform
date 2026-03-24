import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GamificationService } from './gamification.service';

@Controller('gamification')
@UseGuards(JwtAuthGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('badges')
  async getBadges(@CurrentUser('id') studentId: string) {
    return this.gamificationService.getStudentBadges(studentId);
  }

  @Get('xp')
  async getXP(@CurrentUser('id') studentId: string) {
    return this.gamificationService.getStudentXP(studentId);
  }

  @Post('check-badges')
  async checkBadges(@CurrentUser('id') studentId: string) {
    return this.gamificationService.checkAndAwardBadges(studentId);
  }
}
