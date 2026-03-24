import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  Index,
} from 'typeorm';
import { Passage } from './passage.entity';
import { Skill } from './skill.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'passage_id', type: 'uuid' })
  passageId: string;

  @ManyToOne(() => Passage)
  @JoinColumn({ name: 'passage_id' })
  passage: Passage;

  @Column({ type: 'text' })
  stem: string;

  @Column({ type: 'jsonb' })
  choices: { label: string; text: string }[];

  @Column({ name: 'correct_answer', type: 'smallint' })
  correctAnswer: number;

  @Column({ type: 'text', nullable: true })
  explanation: string | null;

  @Column({ type: 'text', nullable: true })
  hint: string | null;

  @Column({ name: 'step_by_step', type: 'text', nullable: true })
  stepByStep: string | null;

  @Index()
  @Column({ type: 'smallint' })
  difficulty: number;

  @Column({ name: 'irt_discrimination', type: 'float', default: 1 })
  irtDiscrimination: number;

  @Column({ name: 'irt_difficulty', type: 'float', default: 0 })
  irtDifficulty: number;

  @Column({ name: 'irt_guessing', type: 'float', default: 0.25 })
  irtGuessing: number;

  @ManyToMany(() => Skill)
  @JoinTable({
    name: 'question_skills',
    joinColumn: { name: 'question_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'skill_id', referencedColumnName: 'id' },
  })
  skills: Skill[];
}
