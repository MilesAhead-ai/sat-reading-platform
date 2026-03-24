import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentSkillEstimate } from '../../database/entities/student-skill-estimate.entity';
import { StudySession } from '../../database/entities/study-session.entity';
import { StudentResponse } from '../../database/entities/student-response.entity';
import { Skill } from '../../database/entities/skill.entity';
import { DiagnosticSession } from '../../database/entities/diagnostic-session.entity';
import { Question } from '../../database/entities/question.entity';
import { KnowledgeBaseEntry } from '../../database/entities/knowledge-base-entry.entity';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentSkillEstimate,
      StudySession,
      StudentResponse,
      Skill,
      DiagnosticSession,
      Question,
      KnowledgeBaseEntry,
    ]),
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
