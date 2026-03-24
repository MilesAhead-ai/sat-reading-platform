import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tip } from '../../database/entities/tip.entity';
import { StudentSkillEstimate } from '../../database/entities/student-skill-estimate.entity';
import { StudentResponse } from '../../database/entities/student-response.entity';
import { Question } from '../../database/entities/question.entity';
import { TipsService } from './tips.service';
import { TipsController } from './tips.controller';
import { LlmService } from '../../services/llm.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tip,
      StudentSkillEstimate,
      StudentResponse,
      Question,
    ]),
  ],
  providers: [TipsService, LlmService],
  controllers: [TipsController],
  exports: [TipsService],
})
export class TipsModule {}
