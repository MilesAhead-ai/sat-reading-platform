import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewQueueItem } from '../../database/entities/review-queue-item.entity';
import { Question } from '../../database/entities/question.entity';
import { StudentResponse } from '../../database/entities/student-response.entity';
import { ReviewQueueService } from './review-queue.service';
import { ReviewQueueController } from './review-queue.controller';
import { LlmService } from '../../services/llm.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReviewQueueItem, Question, StudentResponse]),
  ],
  providers: [ReviewQueueService, LlmService],
  controllers: [ReviewQueueController],
  exports: [ReviewQueueService],
})
export class ReviewQueueModule {}
