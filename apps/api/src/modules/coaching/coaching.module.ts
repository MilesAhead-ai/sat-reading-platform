import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoachingSession } from '../../database/entities/coaching-session.entity';
import { StudentSkillEstimate } from '../../database/entities/student-skill-estimate.entity';
import { StudentResponse } from '../../database/entities/student-response.entity';
import { CoachingService } from './coaching.service';
import { CoachingController } from './coaching.controller';
import { LlmService } from '../../services/llm.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      CoachingSession,
      StudentSkillEstimate,
      StudentResponse,
    ]),
  ],
  providers: [CoachingService, LlmService],
  controllers: [CoachingController],
})
export class CoachingModule {}
