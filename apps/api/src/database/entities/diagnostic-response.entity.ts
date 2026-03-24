import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { DiagnosticSession } from './diagnostic-session.entity';
import { Question } from './question.entity';

@Entity('diagnostic_responses')
export class DiagnosticResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => DiagnosticSession)
  @JoinColumn({ name: 'session_id' })
  session: DiagnosticSession;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId: string;

  @ManyToOne(() => Question)
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ name: 'chosen_answer', type: 'smallint' })
  chosenAnswer: number;

  @Column({ name: 'is_correct', type: 'boolean' })
  isCorrect: boolean;

  @Column({ name: 'time_spent_seconds', type: 'int', nullable: true })
  timeSpentSeconds: number | null;

  @Column({ name: 'order_index', type: 'int' })
  orderIndex: number;
}
