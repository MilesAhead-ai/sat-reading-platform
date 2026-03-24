import { DataSource } from 'typeorm';
import { Skill } from '../entities/skill.entity';
import { SKILL_TAXONOMY } from '@sat/shared';

export async function seedSkills(dataSource: DataSource): Promise<void> {
  const skillRepo = dataSource.getRepository(Skill);

  console.log(`Seeding ${SKILL_TAXONOMY.length} skills...`);

  await skillRepo.upsert(
    SKILL_TAXONOMY.map((s) => ({
      id: s.id,
      name: s.name,
      parentId: s.parentId,
      level: s.level,
      masteryThreshold: s.masteryThreshold,
      sortOrder: s.sortOrder,
    })),
    ['id'],
  );

  console.log('Skills seeded successfully.');
}
