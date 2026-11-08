import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Removes the AI translation records and adds Postmark / visitor-acknowledgement state.
// Hand-edited after generation: leftover translation jobs and document locks are deleted first
// (the job enums cannot be rebuilt while rows use 'translation-step'), the foreign key is dropped
// before its table, and existing enquiries keep an empty acknowledgement status (no default).
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DELETE FROM "payload_jobs_log" WHERE "task_slug" = 'translation-step';
  DELETE FROM "payload_jobs" WHERE "task_slug" = 'translation-step';
  DELETE FROM "payload_locked_documents" WHERE "id" IN (
    SELECT "parent_id" FROM "payload_locked_documents_rels" WHERE "translation_runs_id" IS NOT NULL
  );
  DELETE FROM "payload_locked_documents_rels" WHERE "translation_runs_id" IS NOT NULL;
  CREATE TYPE "public"."enum_inquiries_auto_reply_status" AS ENUM('pending', 'sending', 'sent', 'failed', 'skipped', 'unknown', 'not-configured');
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_translation_runs_fk";
  DROP TABLE "translation_runs" CASCADE;
  
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'inquiry-email', 'inquiry-auto-reply');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'inquiry-email', 'inquiry-auto-reply');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_translation_runs_id_idx";
  ALTER TABLE "inquiries" ADD COLUMN "notification_message_id" varchar;
  ALTER TABLE "inquiries" ADD COLUMN "auto_reply_status" "enum_inquiries_auto_reply_status";
  ALTER TABLE "inquiries" ADD COLUMN "auto_reply_error" varchar;
  ALTER TABLE "inquiries" ADD COLUMN "auto_reply_message_id" varchar;
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "translation_runs_id";
  DROP TYPE "public"."enum_translation_runs_target_collection";
  DROP TYPE "public"."enum_translation_runs_status";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DELETE FROM "payload_jobs_log" WHERE "task_slug" = 'inquiry-auto-reply';
  DELETE FROM "payload_jobs" WHERE "task_slug" = 'inquiry-auto-reply';
   CREATE TYPE "public"."enum_translation_runs_target_collection" AS ENUM('products', 'categories', 'materials', 'applications', 'pages', 'solutions', 'cases', 'guides', 'faqs');
  CREATE TYPE "public"."enum_translation_runs_status" AS ENUM('queued', 'running', 'passed', 'failed', 'stale', 'published');
  CREATE TABLE "translation_runs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"target_collection" "enum_translation_runs_target_collection" NOT NULL,
  	"target_id" numeric NOT NULL,
  	"source_hash" varchar NOT NULL,
  	"source" jsonb NOT NULL,
  	"status" "enum_translation_runs_status" DEFAULT 'queued',
  	"results" jsonb,
  	"glossary_hash" varchar,
  	"pipeline_version" varchar,
  	"usage" jsonb,
  	"error" varchar,
  	"released_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'translation-step', 'inquiry-email');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'translation-step', 'inquiry-email');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "translation_runs_id" integer;
  CREATE INDEX "translation_runs_source_hash_idx" ON "translation_runs" USING btree ("source_hash");
  CREATE INDEX "translation_runs_updated_at_idx" ON "translation_runs" USING btree ("updated_at");
  CREATE INDEX "translation_runs_created_at_idx" ON "translation_runs" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_translation_runs_fk" FOREIGN KEY ("translation_runs_id") REFERENCES "public"."translation_runs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_translation_runs_id_idx" ON "payload_locked_documents_rels" USING btree ("translation_runs_id");
  ALTER TABLE "inquiries" DROP COLUMN "notification_message_id";
  ALTER TABLE "inquiries" DROP COLUMN "auto_reply_status";
  ALTER TABLE "inquiries" DROP COLUMN "auto_reply_error";
  ALTER TABLE "inquiries" DROP COLUMN "auto_reply_message_id";
  DROP TYPE "public"."enum_inquiries_auto_reply_status";`)
}
