import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum BadgeType {
  FIRST_SESSION = 'first_session',
  STREAK_3 = 'streak_3',
  STREAK_7 = 'streak_7',
  STREAK_30 = 'streak_30',
  SKILL_MASTERED = 'skill_mastered',
  ALL_DOMAINS_PRACTICED = 'all_domains_practiced',
  PERFECT_EXERCISE = 'perfect_exercise',
  HUNDRED_QUESTIONS = 'hundred_questions',
  FIVE_HUNDRED_QUESTIONS = 'five_hundred_questions',
  DIAGNOSTIC_COMPLETE = 'diagnostic_complete',
  FIRST_TIP_RATED = 'first_tip_rated',
  LEVEL_5 = 'level_5',
  LEVEL_10 = 'level_10',
}

@Entity('badges')
export class Badge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ type: 'enum', enum: BadgeType })
  type: BadgeType;

  @Column({ type: 'varchar', nullable: true })
  metadata: string | null;

  @CreateDateColumn({ name: 'earned_at' })
  earnedAt: Date;
}
