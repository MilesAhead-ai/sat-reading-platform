import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('student_profiles')
export class StudentProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int', nullable: true })
  grade: number | null;

  @Column({ name: 'target_score', type: 'int', nullable: true })
  targetScore: number | null;

  @Column({ name: 'target_test_date', type: 'date', nullable: true })
  targetTestDate: Date | null;

  @Column({ type: 'jsonb', default: {} })
  preferences: Record<string, any>;
}
