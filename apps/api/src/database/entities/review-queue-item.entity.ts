import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Question } from './question.entity';

@Entity('review_queue_items')
export class ReviewQueueItem {
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

  @Index()
  @Column({ name: 'next_review_date', type: 'timestamp' })
  nextReviewDate: Date;

  @Column({ type: 'int', default: 1 })
  interval: number;

  @Column({ name: 'ease_factor', type: 'float', default: 2.5 })
  easeFactor: number;

  @Column({ type: 'int', default: 0 })
  repetitions: number;
}
