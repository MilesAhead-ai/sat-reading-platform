import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';

export enum PassageType {
  LITERATURE = 'literature',
  HISTORY = 'history',
  SCIENCE = 'science',
  SOCIAL_SCIENCE = 'social_science',
}

@Entity('passages')
export class Passage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  text: string;

  @Index()
  @Column({ type: 'enum', enum: PassageType })
  type: PassageType;

  @Column({ type: 'smallint' })
  difficulty: number;

  @Column({ name: 'word_count', type: 'int' })
  wordCount: number;

  @Column({ type: 'varchar', nullable: true })
  source: string | null;

  @Column({ name: 'review_status', type: 'varchar', default: 'approved' })
  reviewStatus: string;
}
