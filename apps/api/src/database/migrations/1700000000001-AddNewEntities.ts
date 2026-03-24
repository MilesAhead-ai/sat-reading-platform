import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewEntities1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create new enum types
    await queryRunner.query(`
      CREATE TYPE "learning_path_status" AS ENUM ('active', 'completed', 'paused')
    `);

    await queryRunner.query(`
      CREATE TYPE "knowledge_base_type" AS ENUM ('strategy', 'guide', 'vocabulary', 'tip_template')
    `);

    await queryRunner.query(`
      CREATE TYPE "badge_type" AS ENUM (
        'first_session', 'streak_3', 'streak_7', 'streak_30',
        'skill_mastered', 'all_domains_practiced', 'perfect_exercise',
        'hundred_questions', 'five_hundred_questions', 'diagnostic_complete',
        'first_tip_rated', 'level_5', 'level_10'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "coaching_session_status" AS ENUM ('active', 'ended')
    `);

    // 15. learning_paths
    await queryRunner.query(`
      CREATE TABLE "learning_paths" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "student_id" uuid NOT NULL,
        "ordered_units" jsonb NOT NULL DEFAULT '[]',
        "current_index" int NOT NULL DEFAULT 0,
        "focus_skills" jsonb NOT NULL DEFAULT '[]',
        "status" "learning_path_status" NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_learning_paths" PRIMARY KEY ("id"),
        CONSTRAINT "FK_learning_paths_student" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_learning_paths_student_id" ON "learning_paths" ("student_id")
    `);

    // 16. knowledge_base_entries
    await queryRunner.query(`
      CREATE TABLE "knowledge_base_entries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "knowledge_base_type" NOT NULL,
        "title" varchar NOT NULL,
        "content" text NOT NULL,
        "tags" jsonb NOT NULL DEFAULT '[]',
        "skills" jsonb NOT NULL DEFAULT '[]',
        "passage_types" jsonb NOT NULL DEFAULT '[]',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_knowledge_base_entries" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_knowledge_base_entries_type" ON "knowledge_base_entries" ("type")
    `);

    // 17. review_queue_items
    await queryRunner.query(`
      CREATE TABLE "review_queue_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "student_id" uuid NOT NULL,
        "question_id" uuid NOT NULL,
        "next_review_date" TIMESTAMP NOT NULL,
        "interval" int NOT NULL DEFAULT 1,
        "ease_factor" float NOT NULL DEFAULT 2.5,
        "repetitions" int NOT NULL DEFAULT 0,
        CONSTRAINT "PK_review_queue_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_review_queue_items_student" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_review_queue_items_question" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_review_queue_items_student_id" ON "review_queue_items" ("student_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_review_queue_items_next_review_date" ON "review_queue_items" ("next_review_date")
    `);

    // 18. badges
    await queryRunner.query(`
      CREATE TABLE "badges" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "student_id" uuid NOT NULL,
        "type" "badge_type" NOT NULL,
        "metadata" varchar,
        "earned_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_badges" PRIMARY KEY ("id"),
        CONSTRAINT "FK_badges_student" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_badges_student_id" ON "badges" ("student_id")
    `);

    // 19. coaching_sessions
    await queryRunner.query(`
      CREATE TABLE "coaching_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "student_id" uuid NOT NULL,
        "status" "coaching_session_status" NOT NULL DEFAULT 'active',
        "messages" jsonb NOT NULL DEFAULT '[]',
        "focus_skill_id" varchar,
        "started_at" TIMESTAMP NOT NULL DEFAULT now(),
        "ended_at" TIMESTAMP,
        CONSTRAINT "PK_coaching_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_coaching_sessions_student" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_coaching_sessions_student_id" ON "coaching_sessions" ("student_id")
    `);

    // 20. bookmarks
    await queryRunner.query(`
      CREATE TABLE "bookmarks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "student_id" uuid NOT NULL,
        "entry_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bookmarks" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_bookmarks_student_entry" UNIQUE ("student_id", "entry_id"),
        CONSTRAINT "FK_bookmarks_student" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_bookmarks_entry" FOREIGN KEY ("entry_id") REFERENCES "knowledge_base_entries"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_bookmarks_student_id" ON "bookmarks" ("student_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "bookmarks" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "coaching_sessions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "badges" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "review_queue_items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "knowledge_base_entries" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "learning_paths" CASCADE`);

    await queryRunner.query(`DROP TYPE IF EXISTS "coaching_session_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "badge_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "knowledge_base_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "learning_path_status"`);
  }
}
