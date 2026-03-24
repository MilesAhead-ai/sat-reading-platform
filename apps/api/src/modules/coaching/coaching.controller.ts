import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CoachingService } from './coaching.service';

@Controller('coaching')
@UseGuards(JwtAuthGuard)
export class CoachingController {
  constructor(private readonly coachingService: CoachingService) {}

  @Get('sessions')
  async listSessions(@CurrentUser('id') studentId: string) {
    return this.coachingService.listSessions(studentId);
  }

  @Get('sessions/:id')
  async getSession(
    @CurrentUser('id') studentId: string,
    @Param('id', ParseUUIDPipe) sessionId: string,
  ) {
    return this.coachingService.getSession(studentId, sessionId);
  }

  @Post('session/start')
  async startSession(
    @CurrentUser('id') studentId: string,
    @Body('focusSkillId') focusSkillId?: string,
  ) {
    const { session, suggestedTopics } =
      await this.coachingService.startSession(studentId, focusSkillId);
    return { ...session, suggestedTopics };
  }

  @Post('session/:id/message')
  async sendMessage(
    @CurrentUser('id') studentId: string,
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Body('content') content: string,
  ) {
    return this.coachingService.sendMessage(studentId, sessionId, content);
  }

  @Post('session/:id/end')
  async endSession(
    @CurrentUser('id') studentId: string,
    @Param('id', ParseUUIDPipe) sessionId: string,
  ) {
    return this.coachingService.endSession(studentId, sessionId);
  }
}
