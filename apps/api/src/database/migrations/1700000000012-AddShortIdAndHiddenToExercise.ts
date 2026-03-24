import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShortIdAndHiddenToExercise1700000000012
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add short_id column (nullable first, then populate, then set NOT NULL)
    await queryRunner.query(
      `ALTER TABLE "exercises" ADD COLUMN "short_id" VARCHAR(12) UNIQUE`,
    );

    // Add is_hidden column
    await queryRunner.query(
      `ALTER TABLE "exercises" ADD COLUMN "is_hidden" BOOLEAN NOT NULL DEFAULT false`,
    );

    // Generate short_ids for existing exercises (8-char hex from md5)
    await queryRunner.query(
      `UPDATE "exercises" SET "short_id" = substr(md5(id::text), 1, 8)`,
    );

    // Make short_id NOT NULL
    await queryRunner.query(
      `ALTER TABLE "exercises" ALTER COLUMN "short_id" SET NOT NULL`,
    );

    // Convert drill → practice
    await queryRunner.query(
      `UPDATE "exercises" SET "type" = 'practice' WHERE "type" = 'drill'`,
    );

    // Hide old-format exercises (shared long passage)
    await queryRunner.query(
      `UPDATE "exercises" SET "is_hidden" = true WHERE "passage_id" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Unhide
    await queryRunner.query(
      `UPDATE "exercises" SET "is_hidden" = false WHERE "is_hidden" = true`,
    );

    // Revert practice → drill for the original drill exercises
    await queryRunner.query(
      `UPDATE "exercises" SET "type" = 'drill' WHERE "title" LIKE 'Drill:%'`,
    );

    await queryRunner.query(
      `ALTER TABLE "exercises" DROP COLUMN "is_hidden"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercises" DROP COLUMN "short_id"`,
    );
  }
}
