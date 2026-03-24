import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiagnosticSession } from '../../database/entities/diagnostic-session.entity';
import { DiagnosticResponse } from '../../database/entities/diagnostic-response.entity';
import { Question } from '../../database/entities/question.entity';
import { StudentSkillEstimate } from '../../database/entities/student-skill-estimate.entity';
import { DiagnosticController } from './diagnostic.controller';
import { DiagnosticService } from './diagnostic.service';
import { SkillEstimatorService } from '../../services/skill-estimator.service';
import { SkillsModule } from '../skills/skills.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DiagnosticSession,
      DiagnosticResponse,
      Question,
      StudentSkillEstimate,
    ]),
    SkillsModule,
  ],
  controllers: [DiagnosticController],
  providers: [DiagnosticService, SkillEstimatorService],
})
export class DiagnosticModule {}
