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

export enum TipCategory {
  ERROR_PATTERN = 'error_pattern',
  STRATEGY = 'strategy',
  TIMING = 'timing',
  ENCOURAGEMENT = 'encouragement',
  PASSAGE_TYPE = 'passage_type',
}

@Entity('tips')
export class Tip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ type: 'enum', enum: TipCategory })
  category: TipCategory;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'related_skill_id', type: 'varchar', nullable: true })
  relatedSkillId: string | null;

  @Column({ name: 'student_rating', type: 'smallint', nullable: true })
  studentRating: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
