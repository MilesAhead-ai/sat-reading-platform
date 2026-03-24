import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum KnowledgeBaseType {
  STRATEGY = 'strategy',
  GUIDE = 'guide',
  VOCABULARY = 'vocabulary',
  TIP_TEMPLATE = 'tip_template',
}

@Entity('knowledge_base_entries')
export class KnowledgeBaseEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'enum', enum: KnowledgeBaseType })
  type: KnowledgeBaseType;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', default: [] })
  tags: string[];

  @Column({ name: 'skills', type: 'jsonb', default: [] })
  skills: string[];

  @Column({ name: 'passage_types', type: 'jsonb', default: [] })
  passageTypes: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
