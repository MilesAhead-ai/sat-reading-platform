import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Skill } from './skill.entity';

export enum MasteryStatus {
  NOVICE = 'novice',
  DEVELOPING = 'developing',
  PROFICIENT = 'proficient',
  MASTERED = 'mastered',
}

@Entity('student_skill_estimates')
@Unique(['studentId', 'skillId'])
export class StudentSkillEstimate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ name: 'skill_id', type: 'varchar' })
  skillId: string;

  @ManyToOne(() => Skill)
  @JoinColumn({ name: 'skill_id' })
  skill: Skill;

  @Column({ name: 'ability_estimate', type: 'float', default: 0 })
  abilityEstimate: number;

  @Column({ name: 'standard_error', type: 'float', default: 1 })
  standardError: number;

  @Column({
    name: 'mastery_status',
    type: 'enum',
    enum: MasteryStatus,
    default: MasteryStatus.NOVICE,
  })
  masteryStatus: MasteryStatus;

  @Column({ name: 'last_practiced', type: 'timestamp', nullable: true })
  lastPracticed: Date | null;

  @Column({ name: 'response_count', type: 'int', default: 0 })
  responseCount: number;
}
