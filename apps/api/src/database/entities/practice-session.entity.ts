import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Exercise } from './exercise.entity';

export enum PracticeSessionStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

@Entity('practice_sessions')
export class PracticeSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ name: 'exercise_id', type: 'uuid' })
  exerciseId: string;

  @ManyToOne(() => Exercise)
  @JoinColumn({ name: 'exercise_id' })
  exercise: Exercise;

  @Column({
    type: 'enum',
    enum: PracticeSessionStatus,
    default: PracticeSessionStatus.IN_PROGRESS,
  })
  status: PracticeSessionStatus;

  @Column({ name: 'started_at', type: 'timestamp', default: () => 'now()' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'decimal', nullable: true })
  score: number | null;

  @Column({ name: 'total_time_seconds', type: 'int', nullable: true })
  totalTimeSeconds: number | null;

  @Column({ name: 'time_limit_seconds', type: 'int', nullable: true })
  timeLimitSeconds: number | null;

  @Column({ name: 'skill_snapshot_before', type: 'jsonb', nullable: true })
  skillSnapshotBefore: {
    skillId: string;
    skillName: string;
    abilityEstimate: number;
    masteryStatus: string;
  }[] | null;
}
