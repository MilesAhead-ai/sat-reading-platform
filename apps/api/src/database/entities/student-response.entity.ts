import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Question } from './question.entity';

export enum ErrorPattern {
  OVER_INFERENCE = 'over_inference',
  POLARITY_TRAP = 'polarity_trap',
  EVIDENCE_MISMATCH = 'evidence_mismatch',
  SCOPE_ERROR = 'scope_error',
}

@Entity('student_responses')
export class StudentResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId: string;

  @ManyToOne(() => Question)
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @Column({ name: 'session_type', type: 'varchar' })
  sessionType: string;

  @Column({ name: 'chosen_answer', type: 'smallint' })
  chosenAnswer: number;

  @Column({ name: 'is_correct', type: 'boolean' })
  isCorrect: boolean;

  @Column({ name: 'time_spent_seconds', type: 'int', nullable: true })
  timeSpentSeconds: number | null;

  @Column({ name: 'hints_used', type: 'int', default: 0 })
  hintsUsed: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({
    name: 'error_pattern',
    type: 'varchar',
    length: 30,
    nullable: true,
    enum: ErrorPattern,
  })
  errorPattern: ErrorPattern | null;
}
