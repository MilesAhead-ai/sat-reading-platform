import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SkillsModule } from './modules/skills/skills.module';
import { ContentModule } from './modules/content/content.module';
import { DiagnosticModule } from './modules/diagnostic/diagnostic.module';
import { PracticeModule } from './modules/practice/practice.module';
import { ProgressModule } from './modules/progress/progress.module';
import { TipsModule } from './modules/tips/tips.module';
import { LearningPathModule } from './modules/learning-path/learning-path.module';
import { KnowledgeBaseModule } from './modules/knowledge-base/knowledge-base.module';
import { CoachingModule } from './modules/coaching/coaching.module';
import { ReviewQueueModule } from './modules/review-queue/review-queue.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { MockTestModule } from './modules/mock-test/mock-test.module';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: databaseConfig,
    }),
    AuthModule,
    UsersModule,
    SkillsModule,
    ContentModule,
    DiagnosticModule,
    PracticeModule,
    ProgressModule,
    TipsModule,
    LearningPathModule,
    KnowledgeBaseModule,
    CoachingModule,
    ReviewQueueModule,
    GamificationModule,
    MockTestModule,
  ],
})
export class AppModule {}
