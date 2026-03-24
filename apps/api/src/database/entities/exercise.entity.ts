import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { Passage } from './passage.entity';
import { randomBytes } from 'crypto';

export enum ExerciseType {
  DIAGNOSTIC = 'diagnostic',
  PRACTICE = 'practice',
  REVIEW = 'review',
  DRILL = 'drill',
  MOCK_TEST = 'mock_test',
}

@Entity('exercises')
export class Exercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'short_id', type: 'varchar', length: 12, unique: true })
  shortId: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'enum', enum: ExerciseType })
  type: ExerciseType;

  @Column({ name: 'passage_id', type: 'uuid', nullable: true })
  passageId: string | null;

  @ManyToOne(() => Passage, { nullable: true })
  @JoinColumn({ name: 'passage_id' })
  passage: Passage | null;

  @Column({ name: 'question_ids', type: 'jsonb' })
  questionIds: string[];

  @Column({ name: 'skills_focus', type: 'jsonb' })
  skillsFocus: string[];

  @Column({ type: 'smallint' })
  difficulty: number;

  @Column({ name: 'estimated_minutes', type: 'int', default: 10 })
  estimatedMinutes: number;

  @Column({ name: 'is_ai_generated', type: 'boolean', default: false })
  isAiGenerated: boolean;

  @Column({ name: 'is_hidden', type: 'boolean', default: false })
  isHidden: boolean;

  @BeforeInsert()
  generateShortId() {
    if (!this.shortId) {
      this.shortId = randomBytes(4).toString('hex');
    }
  }
}
