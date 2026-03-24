import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum LearningPathStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
}

@Entity('learning_paths')
export class LearningPath {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ name: 'ordered_units', type: 'jsonb', default: [] })
  orderedUnits: {
    type: 'lesson' | 'practice' | 'drill' | 'review' | 'mastery_gate';
    exerciseId?: string;
    skillId: string;
    status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  }[];

  @Column({ name: 'current_index', type: 'int', default: 0 })
  currentIndex: number;

  @Column({ name: 'focus_skills', type: 'jsonb', default: [] })
  focusSkills: string[];

  @Column({
    type: 'enum',
    enum: LearningPathStatus,
    default: LearningPathStatus.ACTIVE,
  })
  status: LearningPathStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
