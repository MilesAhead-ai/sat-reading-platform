import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatedAtToStudentResponse1700000000008
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "student_responses" ADD COLUMN "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "student_responses" DROP COLUMN "created_at"`,
    );
  }
}
