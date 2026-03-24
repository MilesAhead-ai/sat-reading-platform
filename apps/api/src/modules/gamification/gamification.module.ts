import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Badge } from '../../database/entities/badge.entity';
import { StudentResponse } from '../../database/entities/student-response.entity';
import { StudySession } from '../../database/entities/study-session.entity';
import { StudentSkillEstimate } from '../../database/entities/student-skill-estimate.entity';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Badge,
      StudentResponse,
      StudySession,
      StudentSkillEstimate,
    ]),
  ],
  providers: [GamificationService],
  controllers: [GamificationController],
  exports: [GamificationService],
})
export class GamificationModule {}
