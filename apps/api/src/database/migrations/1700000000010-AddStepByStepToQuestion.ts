import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStepByStepToQuestion1700000000010
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "questions" ADD COLUMN "step_by_step" TEXT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "questions" DROP COLUMN "step_by_step"`,
    );
  }
}
