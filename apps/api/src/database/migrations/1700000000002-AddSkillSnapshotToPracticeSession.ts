import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSkillSnapshotToPracticeSession1700000000002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "practice_sessions"
      ADD COLUMN "skill_snapshot_before" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "practice_sessions"
      DROP COLUMN "skill_snapshot_before"
    `);
  }
}
