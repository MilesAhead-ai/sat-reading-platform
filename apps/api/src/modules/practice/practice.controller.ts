import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PracticeService } from './practice.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Controller('practice')
@UseGuards(JwtAuthGuard)
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Get('exercises')
  async listExercises(@CurrentUser('id') studentId: string) {
    return this.practiceService.listExercises(studentId);
  }

  @Get('next')
  async getNextExercise(@CurrentUser('id') studentId: string) {
    return this.practiceService.getNextExercise(studentId);
  }

  @Get('exercises/:id')
  async getExerciseWithContent(@Param('id') id: string) {
    return this.practiceService.getExerciseWithContent(id);
  }

  @Post('exercises/:id/start')
  async startSession(
    @CurrentUser('id') studentId: string,
    @Param('id') exerciseId: string,
  ) {
    return this.practiceService.startSession(studentId, exerciseId);
  }

  @Post('sessions/:sessionId/respond')
  async submitAnswer(
    @CurrentUser('id') studentId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.practiceService.submitAnswer(studentId, sessionId, dto);
  }

  @Post('sessions/:sessionId/complete')
  async completeSession(
    @CurrentUser('id') studentId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.practiceService.completeSession(studentId, sessionId);
  }
}
