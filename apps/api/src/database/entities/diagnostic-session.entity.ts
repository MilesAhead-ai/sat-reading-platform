import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum DiagnosticSessionStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

@Entity('diagnostic_sessions')
export class DiagnosticSession {
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
    enum: DiagnosticSessionStatus,
    default: DiagnosticSessionStatus.IN_PROGRESS,
  })
  status: DiagnosticSessionStatus;

  @Column({ name: 'started_at', type: 'timestamp', default: () => 'now()' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'current_question_index', type: 'int', default: 0 })
  currentQuestionIndex: number;

  @Column({ type: 'smallint', default: 1 })
  level: number;
}
