import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Passage } from '../../database/entities/passage.entity';
import { Question } from '../../database/entities/question.entity';
import { Exercise } from '../../database/entities/exercise.entity';
import { Skill } from '../../database/entities/skill.entity';
import { StudentSkillEstimate } from '../../database/entities/student-skill-estimate.entity';
import { StudentResponse } from '../../database/entities/student-response.entity';
import { PracticeSession } from '../../database/entities/practice-session.entity';
import { ContentService } from './content.service';
import { ExerciseGeneratorService } from './exercise-generator.service';
import { PassagesController } from './passages.controller';
import { QuestionsController } from './questions.controller';
import { ExercisesController } from './exercises.controller';
import { ExerciseGeneratorController } from './exercise-generator.controller';
import { LlmService } from '../../services/llm.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Passage,
      Question,
      Exercise,
      Skill,
      StudentSkillEstimate,
      StudentResponse,
      PracticeSession,
    ]),
  ],
  providers: [ContentService, ExerciseGeneratorService, LlmService],
  controllers: [
    PassagesController,
    QuestionsController,
    ExercisesController,
    ExerciseGeneratorController,
  ],
  exports: [ContentService, ExerciseGeneratorService],
})
export class ContentModule {}
