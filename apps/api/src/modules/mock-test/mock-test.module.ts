import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PracticeSession } from '../../database/entities/practice-session.entity';
import { StudentResponse } from '../../database/entities/student-response.entity';
import { Exercise } from '../../database/entities/exercise.entity';
import { Question } from '../../database/entities/question.entity';
import { Passage } from '../../database/entities/passage.entity';
import { Skill } from '../../database/entities/skill.entity';
import { StudentSkillEstimate } from '../../database/entities/student-skill-estimate.entity';
import { StudySession } from '../../database/entities/study-session.entity';
import { ReviewQueueItem } from '../../database/entities/review-queue-item.entity';
import { MockTestService } from './mock-test.service';
import { MockTestController } from './mock-test.controller';
import { SkillEstimatorService } from '../../services/skill-estimator.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PracticeSession,
      StudentResponse,
      Exercise,
      Question,
      Passage,
      Skill,
      StudentSkillEstimate,
      StudySession,
      ReviewQueueItem,
    ]),
  ],
  providers: [MockTestService, SkillEstimatorService],
  controllers: [MockTestController],
})
export class MockTestModule {}
