import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTotalTimeSecondsToPracticeSession1700000000003
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "practice_sessions"
      ADD COLUMN "total_time_seconds" int
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "practice_sessions"
      DROP COLUMN "total_time_seconds"
    `);
  }
}
