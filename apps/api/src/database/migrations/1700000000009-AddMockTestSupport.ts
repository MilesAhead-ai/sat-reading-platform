import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMockTestSupport1700000000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ALTER TYPE cannot run inside a transaction in PG
    await queryRunner.query(
      `ALTER TYPE "exercise_type" ADD VALUE IF NOT EXISTS 'mock_test'`,
    );
    await queryRunner.query(
      `ALTER TABLE "practice_sessions" ADD COLUMN "time_limit_seconds" INT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "practice_sessions" DROP COLUMN "time_limit_seconds"`,
    );
    // Note: PG does not support removing enum values; safe to leave 'mock_test'
  }
}
