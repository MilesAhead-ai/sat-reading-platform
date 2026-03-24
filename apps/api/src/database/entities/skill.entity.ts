import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum SkillLevel {
  DOMAIN = 'domain',
  SKILL = 'skill',
  SUBSKILL = 'subskill',
}

@Entity('skills')
export class Skill {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ name: 'parent_id', type: 'varchar', nullable: true })
  parentId: string | null;

  @ManyToOne(() => Skill, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Skill | null;

  @Column({ type: 'enum', enum: SkillLevel })
  level: SkillLevel;

  @Column({
    name: 'mastery_threshold',
    type: 'decimal',
    default: 0.7,
  })
  masteryThreshold: number;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;
}
