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

export enum CoachingSessionStatus {
  ACTIVE = 'active',
  ENDED = 'ended',
}

@Entity('coaching_sessions')
export class CoachingSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({
    type: 'enum',
    enum: CoachingSessionStatus,
    default: CoachingSessionStatus.ACTIVE,
  })
  status: CoachingSessionStatus;

  @Column({ type: 'jsonb', default: [] })
  messages: {
    role: 'student' | 'tutor';
    content: string;
    timestamp: string;
  }[];

  @Column({ name: 'focus_skill_id', type: 'varchar', nullable: true })
  focusSkillId: string | null;

  @CreateDateColumn({ name: 'started_at' })
  startedAt: Date;

  @Column({ name: 'ended_at', type: 'timestamp', nullable: true })
  endedAt: Date | null;
}
