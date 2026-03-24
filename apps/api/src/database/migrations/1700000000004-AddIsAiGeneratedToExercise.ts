import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsAiGeneratedToExercise1700000000004
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exercises"
      ADD COLUMN "is_ai_generated" boolean NOT NULL DEFAULT false
    `);

    // Backfill: seed exercises use deterministic UUIDs starting with '20000000-',
    // everything else was created by the AI generator.
    await queryRunner.query(`
      UPDATE "exercises"
      SET "is_ai_generated" = true
      WHERE id::text NOT LIKE '20000000-%'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exercises"
      DROP COLUMN "is_ai_generated"
    `);
  }
}
