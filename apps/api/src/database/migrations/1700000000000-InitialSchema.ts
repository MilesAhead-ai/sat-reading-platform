import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "user_role" AS ENUM ('student', 'parent', 'tutor', 'admin')
    `);

    await queryRunner.query(`
      CREATE TYPE "skill_level" AS ENUM ('domain', 'skill', 'subskill')
    `);

    await queryRunner.query(`
      CREATE TYPE "mastery_status" AS ENUM ('novice', 'developing', 'proficient', 'mastered')
    `);

    await queryRunner.query(`
      CREATE TYPE "passage_type" AS ENUM ('literature', 'history', 'science', 'social_science')
    `);

    await queryRunner.query(`
      CREATE TYPE "exercise_type" AS ENUM ('diagnostic', 'practice', 'review', 'drill')
    `);

    await queryRunner.query(`
      CREATE TYPE "diagnostic_session_status" AS ENUM ('in_progress', 'completed', 'abandoned')
    `);

    await queryRunner.query(`
      CREATE TYPE "practice_session_status" AS ENUM ('in_progress', 'completed', 'abandoned')
    `);

    await queryRunner.query(`
      CREATE TYPE "tip_category" AS ENUM ('error_pattern', 'strategy', 'timing', 'encouragement', 'passage_type')
    `);

    // 1. users
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" varchar NOT NULL,
        "password_hash" varchar NOT NULL,
        "role" "user_role" NOT NULL DEFAULT 'student',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    // 2. student_profiles
    await queryRunner.query(`
      CREATE TABLE "student_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "grade" int,
        "target_score" int,
        "target_test_date" date,
        "preferences" jsonb NOT NULL DEFAULT '{}',
        CONSTRAINT "PK_student_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_student_profiles_user_id" UNIQUE ("user_id"),
        CONSTRAINT "FK_student_profiles_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // 3. skills
    await queryRunner.query(`
      CREATE TABLE "skills" (
        "id" varchar NOT NULL,
        "name" varchar NOT NULL,
        "parent_id" varchar,
        "level" "skill_level" NOT NULL,
        "mastery_threshold" decimal NOT NULL DEFAULT 0.7,
        "sort_order" int NOT NULL DEFAULT 0,
        CONSTRAINT "PK_skills" PRIMARY KEY ("id"),
        CONSTRAINT "FK_skills_parent" FOREIGN KEY ("parent_id") REFERENCES "skills"("id") ON DELETE SET NULL
      )
    `);

    // 4. student_skill_estimates
    await queryRunner.query(`
      CREATE TABLE "student_skill_estimates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "student_id" uuid NOT NULL,
        "skill_id" varchar NOT NULL,
        "ability_estimate" float NOT NULL DEFAULT 0,
        "standard_error" float NOT NULL DEFAULT 1,
        "mastery_status" "mastery_status" NOT NULL DEFAULT 'novice',
        "last_practiced" TIMESTAMP,
        "response_count" int NOT NULL DEFAULT 0,
        CONSTRAINT "PK_student_skill_estimates" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_student_skill_estimates_student_skill" UNIQUE ("student_id", "skill_id"),
        CONSTRAINT "FK_student_skill_estimates_student" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_student_skill_estimates_skill" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_student_skill_estimates_student_id" ON "student_skill_estimates" ("student_id")
    `);

    // 5. passages
    await queryRunner.query(`
      CREATE TABLE "passages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" varchar NOT NULL,
        "text" text NOT NULL,
        "type" "passage_type" NOT NULL,
        "difficulty" smallint NOT NULL,
        "word_count" int NOT NULL,
        "source" varchar,
        "review_status" varchar NOT NULL DEFAULT 'approved',
        CONSTRAINT "PK_passages" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_passages_type" ON "passages" ("type")
    `);

    // 6. questions
    await queryRunner.query(`
      CREATE TABLE "questions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "passage_id" uuid NOT NULL,
        "stem" text NOT NULL,
        "choices" jsonb NOT NULL,
        "correct_answer" smallint NOT NULL,
        "explanation" text,
        "hint" text,
        "difficulty" smallint NOT NULL,
        "irt_discrimination" float NOT NULL DEFAULT 1,
        "irt_difficulty" float NOT NULL DEFAULT 0,
        "irt_guessing" float NOT NULL DEFAULT 0.25,
        CONSTRAINT "PK_questions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_questions_passage" FOREIGN KEY ("passage_id") REFERENCES "passages"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_questions_passage_id" ON "questions" ("passage_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_questions_difficulty" ON "questions" ("difficulty")
    `);

    // 7. question_skills (join table)
    await queryRunner.query(`
      CREATE TABLE "question_skills" (
        "question_id" uuid NOT NULL,
        "skill_id" varchar NOT NULL,
        CONSTRAINT "PK_question_skills" PRIMARY KEY ("question_id", "skill_id"),
        CONSTRAINT "FK_question_skills_question" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_question_skills_skill" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_question_skills_question_id" ON "question_skills" ("question_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_question_skills_skill_id" ON "question_skills" ("skill_id")
    `);

    // 8. exercises
    await queryRunner.query(`
      CREATE TABLE "exercises" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" varchar NOT NULL,
        "type" "exercise_type" NOT NULL,
        "passage_id" uuid,
        "question_ids" jsonb NOT NULL,
        "skills_focus" jsonb NOT NULL,
        "difficulty" smallint NOT NULL,
        "estimated_minutes" int NOT NULL DEFAULT 10,
        CONSTRAINT "PK_exercises" PRIMARY KEY ("id"),
        CONSTRAINT "FK_exercises_passage" FOREIGN KEY ("passage_id") REFERENCES "passages"("id") ON DELETE SET NULL
      )
    `);

    // 9. diagnostic_sessions
    await queryRunner.query(`
      CREATE TABLE "diagnostic_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "student_id" uuid NOT NULL,
        "status" "diagnostic_session_status" NOT NULL DEFAULT 'in_progress',
        "started_at" TIMESTAMP NOT NULL DEFAULT now(),
        "completed_at" TIMESTAMP,
        "current_question_index" int NOT NULL DEFAULT 0,
        CONSTRAINT "PK_diagnostic_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_diagnostic_sessions_student" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_diagnostic_sessions_student_id" ON "diagnostic_sessions" ("student_id")
    `);

    // 10. diagnostic_responses
    await queryRunner.query(`
      CREATE TABLE "diagnostic_responses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "session_id" uuid NOT NULL,
        "question_id" uuid NOT NULL,
        "chosen_answer" smallint NOT NULL,
        "is_correct" boolean NOT NULL,
        "time_spent_seconds" int,
        "order_index" int NOT NULL,
        CONSTRAINT "PK_diagnostic_responses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_diagnostic_responses_session" FOREIGN KEY ("session_id") REFERENCES "diagnostic_sessions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_diagnostic_responses_question" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_diagnostic_responses_session_id" ON "diagnostic_responses" ("session_id")
    `);

    // 11. practice_sessions
    await queryRunner.query(`
      CREATE TABLE "practice_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "student_id" uuid NOT NULL,
        "exercise_id" uuid NOT NULL,
        "status" "practice_session_status" NOT NULL DEFAULT 'in_progress',
        "started_at" TIMESTAMP NOT NULL DEFAULT now(),
        "completed_at" TIMESTAMP,
        "score" decimal,
        CONSTRAINT "PK_practice_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_practice_sessions_student" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_practice_sessions_exercise" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_practice_sessions_student_id" ON "practice_sessions" ("student_id")
    `);

    // 12. student_responses
    await queryRunner.query(`
      CREATE TABLE "student_responses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "student_id" uuid NOT NULL,
        "question_id" uuid NOT NULL,
        "session_id" uuid NOT NULL,
        "session_type" varchar NOT NULL,
        "chosen_answer" smallint NOT NULL,
        "is_correct" boolean NOT NULL,
        "time_spent_seconds" int,
        "hints_used" int NOT NULL DEFAULT 0,
        CONSTRAINT "PK_student_responses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_student_responses_student" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_student_responses_question" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_student_responses_student_id" ON "student_responses" ("student_id")
    `);

    // 13. tips
    await queryRunner.query(`
      CREATE TABLE "tips" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "student_id" uuid NOT NULL,
        "category" "tip_category" NOT NULL,
        "content" text NOT NULL,
        "related_skill_id" varchar,
        "student_rating" smallint,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tips" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tips_student" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tips_student_id" ON "tips" ("student_id")
    `);

    // 14. study_sessions
    await queryRunner.query(`
      CREATE TABLE "study_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "student_id" uuid NOT NULL,
        "start_time" TIMESTAMP NOT NULL,
        "end_time" TIMESTAMP,
        "exercises_completed" int NOT NULL DEFAULT 0,
        "total_questions" int NOT NULL DEFAULT 0,
        "correct_count" int NOT NULL DEFAULT 0,
        CONSTRAINT "PK_study_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_study_sessions_student" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_study_sessions_student_id" ON "study_sessions" ("student_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse dependency order
    await queryRunner.query(`DROP TABLE IF EXISTS "study_sessions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tips" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "student_responses" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "practice_sessions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "diagnostic_responses" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "diagnostic_sessions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "exercises" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "question_skills" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "questions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "passages" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "student_skill_estimates" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "skills" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "student_profiles" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS "tip_category"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "practice_session_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "diagnostic_session_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "exercise_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "passage_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "mastery_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "skill_level"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role"`);
  }
}
