import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."_locales" ADD VALUE 'zh-Hant';
  ALTER TYPE "public"."enum__products_v_published_locale" ADD VALUE 'zh-Hant';
  ALTER TYPE "public"."enum__categories_v_published_locale" ADD VALUE 'zh-Hant';
  ALTER TYPE "public"."enum__materials_v_published_locale" ADD VALUE 'zh-Hant';
  ALTER TYPE "public"."enum__applications_v_published_locale" ADD VALUE 'zh-Hant';
  ALTER TYPE "public"."enum__pages_v_published_locale" ADD VALUE 'zh-Hant';
  ALTER TABLE "glossary" ADD COLUMN "translations_zh_hant" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_sections_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "products_specifications_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "products_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_products_v_version_sections_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_products_v_version_specifications_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_products_v_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "categories_sections_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "categories_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_categories_v_version_sections_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_categories_v_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "materials_sections_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "materials_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_materials_v_version_sections_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_materials_v_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "applications_sections_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "applications_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_applications_v_version_sections_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_applications_v_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "pages_sections_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "pages_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_pages_v_version_sections_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_pages_v_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "media_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  DROP TYPE "public"."_locales";
  CREATE TYPE "public"."_locales" AS ENUM('en', 'fr', 'de', 'es', 'it', 'ja', 'ko');
  ALTER TABLE "products_sections_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "products_specifications_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "products_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_products_v_version_sections_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_products_v_version_specifications_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_products_v_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "categories_sections_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "categories_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_categories_v_version_sections_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_categories_v_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "materials_sections_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "materials_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_materials_v_version_sections_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_materials_v_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "applications_sections_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "applications_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_applications_v_version_sections_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_applications_v_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "pages_sections_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "pages_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_pages_v_version_sections_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_pages_v_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "media_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_products_v" ALTER COLUMN "published_locale" SET DATA TYPE text;
  DROP TYPE "public"."enum__products_v_published_locale";
  CREATE TYPE "public"."enum__products_v_published_locale" AS ENUM('en', 'fr', 'de', 'es', 'it', 'ja', 'ko');
  ALTER TABLE "_products_v" ALTER COLUMN "published_locale" SET DATA TYPE "public"."enum__products_v_published_locale" USING "published_locale"::"public"."enum__products_v_published_locale";
  ALTER TABLE "_categories_v" ALTER COLUMN "published_locale" SET DATA TYPE text;
  DROP TYPE "public"."enum__categories_v_published_locale";
  CREATE TYPE "public"."enum__categories_v_published_locale" AS ENUM('en', 'fr', 'de', 'es', 'it', 'ja', 'ko');
  ALTER TABLE "_categories_v" ALTER COLUMN "published_locale" SET DATA TYPE "public"."enum__categories_v_published_locale" USING "published_locale"::"public"."enum__categories_v_published_locale";
  ALTER TABLE "_materials_v" ALTER COLUMN "published_locale" SET DATA TYPE text;
  DROP TYPE "public"."enum__materials_v_published_locale";
  CREATE TYPE "public"."enum__materials_v_published_locale" AS ENUM('en', 'fr', 'de', 'es', 'it', 'ja', 'ko');
  ALTER TABLE "_materials_v" ALTER COLUMN "published_locale" SET DATA TYPE "public"."enum__materials_v_published_locale" USING "published_locale"::"public"."enum__materials_v_published_locale";
  ALTER TABLE "_applications_v" ALTER COLUMN "published_locale" SET DATA TYPE text;
  DROP TYPE "public"."enum__applications_v_published_locale";
  CREATE TYPE "public"."enum__applications_v_published_locale" AS ENUM('en', 'fr', 'de', 'es', 'it', 'ja', 'ko');
  ALTER TABLE "_applications_v" ALTER COLUMN "published_locale" SET DATA TYPE "public"."enum__applications_v_published_locale" USING "published_locale"::"public"."enum__applications_v_published_locale";
  ALTER TABLE "_pages_v" ALTER COLUMN "published_locale" SET DATA TYPE text;
  DROP TYPE "public"."enum__pages_v_published_locale";
  CREATE TYPE "public"."enum__pages_v_published_locale" AS ENUM('en', 'fr', 'de', 'es', 'it', 'ja', 'ko');
  ALTER TABLE "_pages_v" ALTER COLUMN "published_locale" SET DATA TYPE "public"."enum__pages_v_published_locale" USING "published_locale"::"public"."enum__pages_v_published_locale";
  ALTER TABLE "glossary" DROP COLUMN "translations_zh_hant";`)
}
