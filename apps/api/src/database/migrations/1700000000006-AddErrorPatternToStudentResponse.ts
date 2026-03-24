import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddErrorPatternToStudentResponse1700000000006
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE student_responses ADD COLUMN error_pattern varchar(30) NULL`,
    );

    await queryRunner.query(
      `CREATE INDEX idx_student_responses_error_pattern
       ON student_responses (student_id, error_pattern)
       WHERE error_pattern IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_student_responses_error_pattern`,
    );
    await queryRunner.query(
      `ALTER TABLE student_responses DROP COLUMN IF EXISTS error_pattern`,
    );
  }
}
