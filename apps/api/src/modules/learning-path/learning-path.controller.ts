import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LearningPathService } from './learning-path.service';

@Controller('learning-path')
@UseGuards(JwtAuthGuard)
export class LearningPathController {
  constructor(private readonly learningPathService: LearningPathService) {}

  @Get()
  async getActivePath(@CurrentUser('id') studentId: string) {
    return this.learningPathService.getActivePath(studentId);
  }

  @Post('regenerate')
  async regeneratePath(@CurrentUser('id') studentId: string) {
    return this.learningPathService.generatePath(studentId);
  }

  @Get('next-unit')
  async getNextUnit(@CurrentUser('id') studentId: string) {
    return this.learningPathService.getNextUnit(studentId);
  }

  @Post('advance')
  async advanceUnit(@CurrentUser('id') studentId: string) {
    return this.learningPathService.advanceUnit(studentId);
  }
}
