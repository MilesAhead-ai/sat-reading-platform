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
import { ReviewQueueService } from './review-queue.service';

@Controller('review-queue')
@UseGuards(JwtAuthGuard)
export class ReviewQueueController {
  constructor(private readonly reviewService: ReviewQueueService) {}

  @Get()
  async getDueItems(@CurrentUser('id') studentId: string) {
    return this.reviewService.getDueItems(studentId);
  }

  @Get('count')
  async getDueCount(@CurrentUser('id') studentId: string) {
    const count = await this.reviewService.getDueCount(studentId);
    return { count };
  }

  @Post('add')
  async addToQueue(
    @CurrentUser('id') studentId: string,
    @Body('questionId', ParseUUIDPipe) questionId: string,
  ) {
    return this.reviewService.addToReviewQueue(studentId, questionId);
  }

  @Post(':itemId/review')
  async reviewItem(
    @CurrentUser('id') studentId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body('quality') quality: number,
  ) {
    return this.reviewService.reviewItem(studentId, itemId, quality);
  }

  @Get(':itemId/context')
  async getContext(
    @CurrentUser('id') studentId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.reviewService.getContext(studentId, itemId);
  }

  @Post(':itemId/retry')
  async retry(
    @CurrentUser('id') studentId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() body: { chosenAnswer: number; timeSpentSeconds?: number },
  ) {
    return this.reviewService.retry(
      studentId,
      itemId,
      body.chosenAnswer,
      body.timeSpentSeconds ?? null,
    );
  }

  @Get(':itemId/step-by-step')
  async getStepByStep(
    @CurrentUser('id') studentId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.reviewService.getStepByStep(studentId, itemId);
  }

  @Post(':itemId/similar')
  async getSimilar(
    @CurrentUser('id') studentId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.reviewService.getSimilar(studentId, itemId);
  }
}
