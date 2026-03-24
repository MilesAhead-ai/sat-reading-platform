import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PracticeSession } from '../../database/entities/practice-session.entity';
import { StudentResponse } from '../../database/entities/student-response.entity';
import { Exercise } from '../../database/entities/exercise.entity';
import { Question } from '../../database/entities/question.entity';
import { StudySession } from '../../database/entities/study-session.entity';
import { Passage } from '../../database/entities/passage.entity';
import { Skill } from '../../database/entities/skill.entity';
import { StudentSkillEstimate } from '../../database/entities/student-skill-estimate.entity';
import { ReviewQueueItem } from '../../database/entities/review-queue-item.entity';
import { PracticeService } from './practice.service';
import { PracticeController } from './practice.controller';
import { SkillEstimatorService } from '../../services/skill-estimator.service';
import { ExerciseSelectorService } from '../../services/exercise-selector.service';
import { LlmService } from '../../services/llm.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PracticeSession,
      StudentResponse,
      Exercise,
      Question,
      StudySession,
      Passage,
      Skill,
      StudentSkillEstimate,
      ReviewQueueItem,
    ]),
  ],
  providers: [PracticeService, SkillEstimatorService, ExerciseSelectorService, LlmService],
  controllers: [PracticeController],
  exports: [PracticeService],
})
export class PracticeModule {}
