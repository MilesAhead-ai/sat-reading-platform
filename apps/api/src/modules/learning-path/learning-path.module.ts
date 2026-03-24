import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningPath } from '../../database/entities/learning-path.entity';
import { StudentSkillEstimate } from '../../database/entities/student-skill-estimate.entity';
import { Exercise } from '../../database/entities/exercise.entity';
import { Skill } from '../../database/entities/skill.entity';
import { LearningPathService } from './learning-path.service';
import { LearningPathController } from './learning-path.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([LearningPath, StudentSkillEstimate, Exercise, Skill]),
  ],
  providers: [LearningPathService],
  controllers: [LearningPathController],
  exports: [LearningPathService],
})
export class LearningPathModule {}
