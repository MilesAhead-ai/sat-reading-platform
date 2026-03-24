import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLevelToDiagnosticSession1700000000005
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "diagnostic_sessions"
      ADD COLUMN "level" smallint NOT NULL DEFAULT 1
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "diagnostic_sessions"
      DROP COLUMN "level"
    `);
  }
}
