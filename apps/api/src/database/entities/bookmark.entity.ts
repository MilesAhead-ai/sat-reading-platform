import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { KnowledgeBaseEntry } from './knowledge-base-entry.entity';

@Entity('bookmarks')
@Unique(['studentId', 'entryId'])
export class Bookmark {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ name: 'entry_id', type: 'uuid' })
  entryId: string;

  @ManyToOne(() => KnowledgeBaseEntry)
  @JoinColumn({ name: 'entry_id' })
  entry: KnowledgeBaseEntry;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
