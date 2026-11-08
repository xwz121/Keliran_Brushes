import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_solutions_line" AS ENUM('sealing', 'brushes', 'both');
  CREATE TYPE "public"."enum_solutions_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__solutions_v_version_line" AS ENUM('sealing', 'brushes', 'both');
  CREATE TYPE "public"."enum__solutions_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__solutions_v_published_locale" AS ENUM('en', 'fr', 'de', 'es', 'it', 'ja', 'ko', 'zh-Hant');
  CREATE TYPE "public"."enum_cases_line" AS ENUM('sealing', 'brushes', 'both');
  CREATE TYPE "public"."enum_cases_scenario_type" AS ENUM('typical', 'real');
  CREATE TYPE "public"."enum_cases_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__cases_v_version_line" AS ENUM('sealing', 'brushes', 'both');
  CREATE TYPE "public"."enum__cases_v_version_scenario_type" AS ENUM('typical', 'real');
  CREATE TYPE "public"."enum__cases_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__cases_v_published_locale" AS ENUM('en', 'fr', 'de', 'es', 'it', 'ja', 'ko', 'zh-Hant');
  CREATE TYPE "public"."enum_guides_line" AS ENUM('sealing', 'brushes', 'both');
  CREATE TYPE "public"."enum_guides_topic" AS ENUM('material-selection', 'standards', 'how-to-measure', 'failure-modes', 'rfq-checklist', 'terminology');
  CREATE TYPE "public"."enum_guides_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__guides_v_version_line" AS ENUM('sealing', 'brushes', 'both');
  CREATE TYPE "public"."enum__guides_v_version_topic" AS ENUM('material-selection', 'standards', 'how-to-measure', 'failure-modes', 'rfq-checklist', 'terminology');
  CREATE TYPE "public"."enum__guides_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__guides_v_published_locale" AS ENUM('en', 'fr', 'de', 'es', 'it', 'ja', 'ko', 'zh-Hant');
  CREATE TYPE "public"."enum_faqs_line" AS ENUM('sealing', 'brushes', 'both');
  CREATE TYPE "public"."enum_faqs_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__faqs_v_version_line" AS ENUM('sealing', 'brushes', 'both');
  CREATE TYPE "public"."enum__faqs_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__faqs_v_published_locale" AS ENUM('en', 'fr', 'de', 'es', 'it', 'ja', 'ko', 'zh-Hant');
  CREATE TYPE "public"."enum_products_channel_material" AS ENUM('Galvanized steel', 'Stainless steel', 'Aluminium');
  CREATE TYPE "public"."enum_products_line" AS ENUM('sealing', 'brushes', 'both');
  CREATE TYPE "public"."enum__products_v_version_channel_material" AS ENUM('Galvanized steel', 'Stainless steel', 'Aluminium');
  CREATE TYPE "public"."enum__products_v_version_line" AS ENUM('sealing', 'brushes', 'both');
  CREATE TYPE "public"."enum_categories_line" AS ENUM('sealing', 'brushes', 'both');
  CREATE TYPE "public"."enum__categories_v_version_line" AS ENUM('sealing', 'brushes', 'both');
  CREATE TYPE "public"."enum_materials_line" AS ENUM('sealing', 'brushes', 'both');
  CREATE TYPE "public"."enum_materials_family" AS ENUM('elastomer', 'foam', 'filament', 'channel');
  CREATE TYPE "public"."enum__materials_v_version_line" AS ENUM('sealing', 'brushes', 'both');
  CREATE TYPE "public"."enum__materials_v_version_family" AS ENUM('elastomer', 'foam', 'filament', 'channel');
  CREATE TYPE "public"."enum_applications_line" AS ENUM('sealing', 'brushes', 'both');
  CREATE TYPE "public"."enum__applications_v_version_line" AS ENUM('sealing', 'brushes', 'both');
  CREATE TYPE "public"."enum_inquiries_line" AS ENUM('sealing', 'brushes', 'both');
  CREATE TYPE "public"."enum_inquiries_safety_critical" AS ENUM('no', 'yes', 'unsure');
  ALTER TYPE "public"."enum_products_materials" ADD VALUE 'CR';
  ALTER TYPE "public"."enum_products_materials" ADD VALUE 'EPDM sponge';
  ALTER TYPE "public"."enum_products_materials" ADD VALUE 'Silicone foam';
  ALTER TYPE "public"."enum_products_materials" ADD VALUE 'PU foam';
  ALTER TYPE "public"."enum_products_materials" ADD VALUE 'PVC/TPE carrier';
  ALTER TYPE "public"."enum_products_materials" ADD VALUE 'PA6';
  ALTER TYPE "public"."enum_products_materials" ADD VALUE 'PA66';
  ALTER TYPE "public"."enum_products_materials" ADD VALUE 'PA612';
  ALTER TYPE "public"."enum_products_materials" ADD VALUE 'PBT';
  ALTER TYPE "public"."enum_products_materials" ADD VALUE 'PP';
  ALTER TYPE "public"."enum_products_materials" ADD VALUE 'PEEK';
  ALTER TYPE "public"."enum_products_materials" ADD VALUE 'SS304';
  ALTER TYPE "public"."enum_products_materials" ADD VALUE 'SS316';
  ALTER TYPE "public"."enum_products_materials" ADD VALUE 'Abrasive nylon';
  ALTER TYPE "public"."enum_products_materials" ADD VALUE 'Conductive nylon';
  ALTER TYPE "public"."enum__products_v_version_materials" ADD VALUE 'CR';
  ALTER TYPE "public"."enum__products_v_version_materials" ADD VALUE 'EPDM sponge';
  ALTER TYPE "public"."enum__products_v_version_materials" ADD VALUE 'Silicone foam';
  ALTER TYPE "public"."enum__products_v_version_materials" ADD VALUE 'PU foam';
  ALTER TYPE "public"."enum__products_v_version_materials" ADD VALUE 'PVC/TPE carrier';
  ALTER TYPE "public"."enum__products_v_version_materials" ADD VALUE 'PA6';
  ALTER TYPE "public"."enum__products_v_version_materials" ADD VALUE 'PA66';
  ALTER TYPE "public"."enum__products_v_version_materials" ADD VALUE 'PA612';
  ALTER TYPE "public"."enum__products_v_version_materials" ADD VALUE 'PBT';
  ALTER TYPE "public"."enum__products_v_version_materials" ADD VALUE 'PP';
  ALTER TYPE "public"."enum__products_v_version_materials" ADD VALUE 'PEEK';
  ALTER TYPE "public"."enum__products_v_version_materials" ADD VALUE 'SS304';
  ALTER TYPE "public"."enum__products_v_version_materials" ADD VALUE 'SS316';
  ALTER TYPE "public"."enum__products_v_version_materials" ADD VALUE 'Abrasive nylon';
  ALTER TYPE "public"."enum__products_v_version_materials" ADD VALUE 'Conductive nylon';
  ALTER TYPE "public"."enum_inquiries_status" ADD VALUE 'review' BEFORE 'in-progress';
  ALTER TYPE "public"."enum_translation_runs_target_collection" ADD VALUE 'solutions';
  ALTER TYPE "public"."enum_translation_runs_target_collection" ADD VALUE 'cases';
  ALTER TYPE "public"."enum_translation_runs_target_collection" ADD VALUE 'guides';
  ALTER TYPE "public"."enum_translation_runs_target_collection" ADD VALUE 'faqs';
  CREATE TABLE "solutions_sections" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "key" varchar
  );

  CREATE TABLE "solutions_sections_locales" (
    "heading" varchar,
    "text" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "solutions" (
    "id" serial PRIMARY KEY NOT NULL,
    "slug" varchar,
    "sort_order" numeric DEFAULT 0,
    "facts_confirmed" boolean DEFAULT false,
    "line" "enum_solutions_line" DEFAULT 'sealing',
    "image_id" integer,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_solutions_status" DEFAULT 'draft'
  );

  CREATE TABLE "solutions_locales" (
    "title" varchar,
    "summary" varchar,
    "description" varchar,
    "seo_title" varchar,
    "seo_description" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "solutions_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "products_id" integer,
    "guides_id" integer,
    "solutions_id" integer,
    "faqs_id" integer
  );

  CREATE TABLE "_solutions_v_version_sections" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_solutions_v_version_sections_locales" (
    "heading" varchar,
    "text" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_solutions_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_slug" varchar,
    "version_sort_order" numeric DEFAULT 0,
    "version_facts_confirmed" boolean DEFAULT false,
    "version_line" "enum__solutions_v_version_line" DEFAULT 'sealing',
    "version_image_id" integer,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__solutions_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "snapshot" boolean,
    "published_locale" "enum__solutions_v_published_locale",
    "latest" boolean
  );

  CREATE TABLE "_solutions_v_locales" (
    "version_title" varchar,
    "version_summary" varchar,
    "version_description" varchar,
    "version_seo_title" varchar,
    "version_seo_description" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_solutions_v_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "products_id" integer,
    "guides_id" integer,
    "solutions_id" integer,
    "faqs_id" integer
  );

  CREATE TABLE "cases_sections" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "key" varchar
  );

  CREATE TABLE "cases_sections_locales" (
    "heading" varchar,
    "text" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "cases" (
    "id" serial PRIMARY KEY NOT NULL,
    "slug" varchar,
    "sort_order" numeric DEFAULT 0,
    "facts_confirmed" boolean DEFAULT false,
    "line" "enum_cases_line" DEFAULT 'sealing',
    "image_id" integer,
    "scenario_type" "enum_cases_scenario_type" DEFAULT 'typical',
    "customer_name" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_cases_status" DEFAULT 'draft'
  );

  CREATE TABLE "cases_locales" (
    "title" varchar,
    "summary" varchar,
    "description" varchar,
    "seo_title" varchar,
    "seo_description" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "cases_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "products_id" integer,
    "guides_id" integer,
    "solutions_id" integer,
    "faqs_id" integer
  );

  CREATE TABLE "_cases_v_version_sections" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_cases_v_version_sections_locales" (
    "heading" varchar,
    "text" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_cases_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_slug" varchar,
    "version_sort_order" numeric DEFAULT 0,
    "version_facts_confirmed" boolean DEFAULT false,
    "version_line" "enum__cases_v_version_line" DEFAULT 'sealing',
    "version_image_id" integer,
    "version_scenario_type" "enum__cases_v_version_scenario_type" DEFAULT 'typical',
    "version_customer_name" varchar,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__cases_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "snapshot" boolean,
    "published_locale" "enum__cases_v_published_locale",
    "latest" boolean
  );

  CREATE TABLE "_cases_v_locales" (
    "version_title" varchar,
    "version_summary" varchar,
    "version_description" varchar,
    "version_seo_title" varchar,
    "version_seo_description" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_cases_v_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "products_id" integer,
    "guides_id" integer,
    "solutions_id" integer,
    "faqs_id" integer
  );

  CREATE TABLE "guides_sections" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "key" varchar
  );

  CREATE TABLE "guides_sections_locales" (
    "heading" varchar,
    "text" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "guides" (
    "id" serial PRIMARY KEY NOT NULL,
    "slug" varchar,
    "sort_order" numeric DEFAULT 0,
    "facts_confirmed" boolean DEFAULT false,
    "line" "enum_guides_line" DEFAULT 'sealing',
    "image_id" integer,
    "topic" "enum_guides_topic",
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_guides_status" DEFAULT 'draft'
  );

  CREATE TABLE "guides_locales" (
    "title" varchar,
    "summary" varchar,
    "description" varchar,
    "seo_title" varchar,
    "seo_description" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "guides_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "products_id" integer,
    "guides_id" integer,
    "solutions_id" integer,
    "faqs_id" integer
  );

  CREATE TABLE "_guides_v_version_sections" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_guides_v_version_sections_locales" (
    "heading" varchar,
    "text" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_guides_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_slug" varchar,
    "version_sort_order" numeric DEFAULT 0,
    "version_facts_confirmed" boolean DEFAULT false,
    "version_line" "enum__guides_v_version_line" DEFAULT 'sealing',
    "version_image_id" integer,
    "version_topic" "enum__guides_v_version_topic",
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__guides_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "snapshot" boolean,
    "published_locale" "enum__guides_v_published_locale",
    "latest" boolean
  );

  CREATE TABLE "_guides_v_locales" (
    "version_title" varchar,
    "version_summary" varchar,
    "version_description" varchar,
    "version_seo_title" varchar,
    "version_seo_description" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_guides_v_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "products_id" integer,
    "guides_id" integer,
    "solutions_id" integer,
    "faqs_id" integer
  );

  CREATE TABLE "faqs_sections" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "key" varchar
  );

  CREATE TABLE "faqs_sections_locales" (
    "heading" varchar,
    "text" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "faqs" (
    "id" serial PRIMARY KEY NOT NULL,
    "slug" varchar,
    "sort_order" numeric DEFAULT 0,
    "facts_confirmed" boolean DEFAULT false,
    "line" "enum_faqs_line" DEFAULT 'sealing',
    "related_guide_id" integer,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_faqs_status" DEFAULT 'draft'
  );

  CREATE TABLE "faqs_locales" (
    "title" varchar,
    "summary" varchar,
    "description" varchar,
    "seo_title" varchar,
    "seo_description" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_faqs_v_version_sections" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_faqs_v_version_sections_locales" (
    "heading" varchar,
    "text" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_faqs_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_slug" varchar,
    "version_sort_order" numeric DEFAULT 0,
    "version_facts_confirmed" boolean DEFAULT false,
    "version_line" "enum__faqs_v_version_line" DEFAULT 'sealing',
    "version_related_guide_id" integer,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__faqs_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "snapshot" boolean,
    "published_locale" "enum__faqs_v_published_locale",
    "latest" boolean
  );

  CREATE TABLE "_faqs_v_locales" (
    "version_title" varchar,
    "version_summary" varchar,
    "version_description" varchar,
    "version_seo_title" varchar,
    "version_seo_description" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "products_channel_material" (
    "order" integer NOT NULL,
    "parent_id" integer NOT NULL,
    "value" "enum_products_channel_material",
    "id" serial PRIMARY KEY NOT NULL
  );

  CREATE TABLE "_products_v_version_channel_material" (
    "order" integer NOT NULL,
    "parent_id" integer NOT NULL,
    "value" "enum__products_v_version_channel_material",
    "id" serial PRIMARY KEY NOT NULL
  );

  CREATE TABLE "applications_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "products_id" integer,
    "guides_id" integer,
    "solutions_id" integer,
    "faqs_id" integer
  );

  CREATE TABLE "_applications_v_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "products_id" integer,
    "guides_id" integer,
    "solutions_id" integer,
    "faqs_id" integer
  );

  CREATE TABLE "inquiries_attachments" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "key" varchar NOT NULL,
    "name" varchar NOT NULL,
    "size" numeric NOT NULL,
    "type" varchar,
    "deleted_at" timestamp(3) with time zone
  );

  CREATE TABLE "site_settings" (
    "id" serial PRIMARY KEY NOT NULL,
    "legal_entity" varchar,
    "registration_no" varchar,
    "vat_no" varchar,
    "address_country" varchar,
    "phone" varchar,
    "hours" varchar,
    "address_lines" varchar,
    "public_email" varchar,
    "whatsapp_number" varchar,
    "whatsapp_enabled" boolean DEFAULT false,
    "whatsapp_floating" boolean DEFAULT true,
    "facebook_url" varchar,
    "linkedin_url" varchar,
    "internal_notes" varchar,
    "updated_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone
  );

  ALTER TABLE "products" ADD COLUMN "line" "enum_products_line" DEFAULT 'sealing';
  ALTER TABLE "products_rels" ADD COLUMN "guides_id" integer;
  ALTER TABLE "products_rels" ADD COLUMN "solutions_id" integer;
  ALTER TABLE "products_rels" ADD COLUMN "faqs_id" integer;
  ALTER TABLE "_products_v" ADD COLUMN "version_line" "enum__products_v_version_line" DEFAULT 'sealing';
  ALTER TABLE "_products_v_rels" ADD COLUMN "guides_id" integer;
  ALTER TABLE "_products_v_rels" ADD COLUMN "solutions_id" integer;
  ALTER TABLE "_products_v_rels" ADD COLUMN "faqs_id" integer;
  ALTER TABLE "categories" ADD COLUMN "line" "enum_categories_line" DEFAULT 'sealing';
  ALTER TABLE "categories" ADD COLUMN "image_id" integer;
  ALTER TABLE "categories" ADD COLUMN "code" varchar;
  ALTER TABLE "categories" ADD COLUMN "featured" boolean;
  ALTER TABLE "_categories_v" ADD COLUMN "version_line" "enum__categories_v_version_line" DEFAULT 'sealing';
  ALTER TABLE "_categories_v" ADD COLUMN "version_image_id" integer;
  ALTER TABLE "_categories_v" ADD COLUMN "version_code" varchar;
  ALTER TABLE "_categories_v" ADD COLUMN "version_featured" boolean;
  ALTER TABLE "materials" ADD COLUMN "line" "enum_materials_line" DEFAULT 'sealing';
  ALTER TABLE "materials" ADD COLUMN "image_id" integer;
  ALTER TABLE "materials" ADD COLUMN "family" "enum_materials_family";
  ALTER TABLE "_materials_v" ADD COLUMN "version_line" "enum__materials_v_version_line" DEFAULT 'sealing';
  ALTER TABLE "_materials_v" ADD COLUMN "version_image_id" integer;
  ALTER TABLE "_materials_v" ADD COLUMN "version_family" "enum__materials_v_version_family";
  ALTER TABLE "applications" ADD COLUMN "line" "enum_applications_line" DEFAULT 'sealing';
  ALTER TABLE "applications" ADD COLUMN "image_id" integer;
  ALTER TABLE "_applications_v" ADD COLUMN "version_line" "enum__applications_v_version_line" DEFAULT 'sealing';
  ALTER TABLE "_applications_v" ADD COLUMN "version_image_id" integer;
  ALTER TABLE "inquiries" ADD COLUMN "line" "enum_inquiries_line";
  ALTER TABLE "inquiries" ADD COLUMN "safety_critical" "enum_inquiries_safety_critical";
  ALTER TABLE "inquiries" ADD COLUMN "rfq" jsonb;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "solutions_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "cases_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "guides_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "faqs_id" integer;
  ALTER TABLE "solutions_sections" ADD CONSTRAINT "solutions_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "solutions_sections_locales" ADD CONSTRAINT "solutions_sections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."solutions_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "solutions" ADD CONSTRAINT "solutions_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "solutions_locales" ADD CONSTRAINT "solutions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "solutions_rels" ADD CONSTRAINT "solutions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "solutions_rels" ADD CONSTRAINT "solutions_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "solutions_rels" ADD CONSTRAINT "solutions_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "solutions_rels" ADD CONSTRAINT "solutions_rels_solutions_fk" FOREIGN KEY ("solutions_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "solutions_rels" ADD CONSTRAINT "solutions_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_solutions_v_version_sections" ADD CONSTRAINT "_solutions_v_version_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_solutions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_solutions_v_version_sections_locales" ADD CONSTRAINT "_solutions_v_version_sections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_solutions_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_solutions_v" ADD CONSTRAINT "_solutions_v_parent_id_solutions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."solutions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_solutions_v" ADD CONSTRAINT "_solutions_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_solutions_v_locales" ADD CONSTRAINT "_solutions_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_solutions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_solutions_v_rels" ADD CONSTRAINT "_solutions_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_solutions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_solutions_v_rels" ADD CONSTRAINT "_solutions_v_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_solutions_v_rels" ADD CONSTRAINT "_solutions_v_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_solutions_v_rels" ADD CONSTRAINT "_solutions_v_rels_solutions_fk" FOREIGN KEY ("solutions_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_solutions_v_rels" ADD CONSTRAINT "_solutions_v_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases_sections" ADD CONSTRAINT "cases_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases_sections_locales" ADD CONSTRAINT "cases_sections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cases_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases" ADD CONSTRAINT "cases_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cases_locales" ADD CONSTRAINT "cases_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases_rels" ADD CONSTRAINT "cases_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases_rels" ADD CONSTRAINT "cases_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases_rels" ADD CONSTRAINT "cases_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases_rels" ADD CONSTRAINT "cases_rels_solutions_fk" FOREIGN KEY ("solutions_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases_rels" ADD CONSTRAINT "cases_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_version_sections" ADD CONSTRAINT "_cases_v_version_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cases_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_version_sections_locales" ADD CONSTRAINT "_cases_v_version_sections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cases_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v" ADD CONSTRAINT "_cases_v_parent_id_cases_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."cases"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cases_v" ADD CONSTRAINT "_cases_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cases_v_locales" ADD CONSTRAINT "_cases_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cases_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_rels" ADD CONSTRAINT "_cases_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_cases_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_rels" ADD CONSTRAINT "_cases_v_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_rels" ADD CONSTRAINT "_cases_v_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_rels" ADD CONSTRAINT "_cases_v_rels_solutions_fk" FOREIGN KEY ("solutions_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_rels" ADD CONSTRAINT "_cases_v_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_sections" ADD CONSTRAINT "guides_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_sections_locales" ADD CONSTRAINT "guides_sections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides" ADD CONSTRAINT "guides_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_locales" ADD CONSTRAINT "guides_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_solutions_fk" FOREIGN KEY ("solutions_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_version_sections" ADD CONSTRAINT "_guides_v_version_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_version_sections_locales" ADD CONSTRAINT "_guides_v_version_sections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v" ADD CONSTRAINT "_guides_v_parent_id_guides_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v" ADD CONSTRAINT "_guides_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v_locales" ADD CONSTRAINT "_guides_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_rels" ADD CONSTRAINT "_guides_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_rels" ADD CONSTRAINT "_guides_v_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_rels" ADD CONSTRAINT "_guides_v_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_rels" ADD CONSTRAINT "_guides_v_rels_solutions_fk" FOREIGN KEY ("solutions_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_rels" ADD CONSTRAINT "_guides_v_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "faqs_sections" ADD CONSTRAINT "faqs_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "faqs_sections_locales" ADD CONSTRAINT "faqs_sections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."faqs_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "faqs" ADD CONSTRAINT "faqs_related_guide_id_guides_id_fk" FOREIGN KEY ("related_guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "faqs_locales" ADD CONSTRAINT "faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_faqs_v_version_sections" ADD CONSTRAINT "_faqs_v_version_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_faqs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_faqs_v_version_sections_locales" ADD CONSTRAINT "_faqs_v_version_sections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_faqs_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_faqs_v" ADD CONSTRAINT "_faqs_v_parent_id_faqs_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."faqs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_faqs_v" ADD CONSTRAINT "_faqs_v_version_related_guide_id_guides_id_fk" FOREIGN KEY ("version_related_guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_faqs_v_locales" ADD CONSTRAINT "_faqs_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_faqs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_channel_material" ADD CONSTRAINT "products_channel_material_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_channel_material" ADD CONSTRAINT "_products_v_version_channel_material_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "applications_rels" ADD CONSTRAINT "applications_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "applications_rels" ADD CONSTRAINT "applications_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "applications_rels" ADD CONSTRAINT "applications_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "applications_rels" ADD CONSTRAINT "applications_rels_solutions_fk" FOREIGN KEY ("solutions_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "applications_rels" ADD CONSTRAINT "applications_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_applications_v_rels" ADD CONSTRAINT "_applications_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_applications_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_applications_v_rels" ADD CONSTRAINT "_applications_v_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_applications_v_rels" ADD CONSTRAINT "_applications_v_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_applications_v_rels" ADD CONSTRAINT "_applications_v_rels_solutions_fk" FOREIGN KEY ("solutions_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_applications_v_rels" ADD CONSTRAINT "_applications_v_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "inquiries_attachments" ADD CONSTRAINT "inquiries_attachments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."inquiries"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "solutions_sections_order_idx" ON "solutions_sections" USING btree ("_order");
  CREATE INDEX "solutions_sections_parent_id_idx" ON "solutions_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "solutions_sections_locales_locale_parent_id_unique" ON "solutions_sections_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "solutions_slug_idx" ON "solutions" USING btree ("slug");
  CREATE INDEX "solutions_image_idx" ON "solutions" USING btree ("image_id");
  CREATE INDEX "solutions_updated_at_idx" ON "solutions" USING btree ("updated_at");
  CREATE INDEX "solutions_created_at_idx" ON "solutions" USING btree ("created_at");
  CREATE INDEX "solutions__status_idx" ON "solutions" USING btree ("_status");
  CREATE UNIQUE INDEX "solutions_locales_locale_parent_id_unique" ON "solutions_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "solutions_rels_order_idx" ON "solutions_rels" USING btree ("order");
  CREATE INDEX "solutions_rels_parent_idx" ON "solutions_rels" USING btree ("parent_id");
  CREATE INDEX "solutions_rels_path_idx" ON "solutions_rels" USING btree ("path");
  CREATE INDEX "solutions_rels_products_id_idx" ON "solutions_rels" USING btree ("products_id");
  CREATE INDEX "solutions_rels_guides_id_idx" ON "solutions_rels" USING btree ("guides_id");
  CREATE INDEX "solutions_rels_solutions_id_idx" ON "solutions_rels" USING btree ("solutions_id");
  CREATE INDEX "solutions_rels_faqs_id_idx" ON "solutions_rels" USING btree ("faqs_id");
  CREATE INDEX "_solutions_v_version_sections_order_idx" ON "_solutions_v_version_sections" USING btree ("_order");
  CREATE INDEX "_solutions_v_version_sections_parent_id_idx" ON "_solutions_v_version_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_solutions_v_version_sections_locales_locale_parent_id_uniqu" ON "_solutions_v_version_sections_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_solutions_v_parent_idx" ON "_solutions_v" USING btree ("parent_id");
  CREATE INDEX "_solutions_v_version_version_slug_idx" ON "_solutions_v" USING btree ("version_slug");
  CREATE INDEX "_solutions_v_version_version_image_idx" ON "_solutions_v" USING btree ("version_image_id");
  CREATE INDEX "_solutions_v_version_version_updated_at_idx" ON "_solutions_v" USING btree ("version_updated_at");
  CREATE INDEX "_solutions_v_version_version_created_at_idx" ON "_solutions_v" USING btree ("version_created_at");
  CREATE INDEX "_solutions_v_version_version__status_idx" ON "_solutions_v" USING btree ("version__status");
  CREATE INDEX "_solutions_v_created_at_idx" ON "_solutions_v" USING btree ("created_at");
  CREATE INDEX "_solutions_v_updated_at_idx" ON "_solutions_v" USING btree ("updated_at");
  CREATE INDEX "_solutions_v_snapshot_idx" ON "_solutions_v" USING btree ("snapshot");
  CREATE INDEX "_solutions_v_published_locale_idx" ON "_solutions_v" USING btree ("published_locale");
  CREATE INDEX "_solutions_v_latest_idx" ON "_solutions_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_solutions_v_locales_locale_parent_id_unique" ON "_solutions_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_solutions_v_rels_order_idx" ON "_solutions_v_rels" USING btree ("order");
  CREATE INDEX "_solutions_v_rels_parent_idx" ON "_solutions_v_rels" USING btree ("parent_id");
  CREATE INDEX "_solutions_v_rels_path_idx" ON "_solutions_v_rels" USING btree ("path");
  CREATE INDEX "_solutions_v_rels_products_id_idx" ON "_solutions_v_rels" USING btree ("products_id");
  CREATE INDEX "_solutions_v_rels_guides_id_idx" ON "_solutions_v_rels" USING btree ("guides_id");
  CREATE INDEX "_solutions_v_rels_solutions_id_idx" ON "_solutions_v_rels" USING btree ("solutions_id");
  CREATE INDEX "_solutions_v_rels_faqs_id_idx" ON "_solutions_v_rels" USING btree ("faqs_id");
  CREATE INDEX "cases_sections_order_idx" ON "cases_sections" USING btree ("_order");
  CREATE INDEX "cases_sections_parent_id_idx" ON "cases_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "cases_sections_locales_locale_parent_id_unique" ON "cases_sections_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "cases_slug_idx" ON "cases" USING btree ("slug");
  CREATE INDEX "cases_image_idx" ON "cases" USING btree ("image_id");
  CREATE INDEX "cases_updated_at_idx" ON "cases" USING btree ("updated_at");
  CREATE INDEX "cases_created_at_idx" ON "cases" USING btree ("created_at");
  CREATE INDEX "cases__status_idx" ON "cases" USING btree ("_status");
  CREATE UNIQUE INDEX "cases_locales_locale_parent_id_unique" ON "cases_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "cases_rels_order_idx" ON "cases_rels" USING btree ("order");
  CREATE INDEX "cases_rels_parent_idx" ON "cases_rels" USING btree ("parent_id");
  CREATE INDEX "cases_rels_path_idx" ON "cases_rels" USING btree ("path");
  CREATE INDEX "cases_rels_products_id_idx" ON "cases_rels" USING btree ("products_id");
  CREATE INDEX "cases_rels_guides_id_idx" ON "cases_rels" USING btree ("guides_id");
  CREATE INDEX "cases_rels_solutions_id_idx" ON "cases_rels" USING btree ("solutions_id");
  CREATE INDEX "cases_rels_faqs_id_idx" ON "cases_rels" USING btree ("faqs_id");
  CREATE INDEX "_cases_v_version_sections_order_idx" ON "_cases_v_version_sections" USING btree ("_order");
  CREATE INDEX "_cases_v_version_sections_parent_id_idx" ON "_cases_v_version_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_cases_v_version_sections_locales_locale_parent_id_unique" ON "_cases_v_version_sections_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_cases_v_parent_idx" ON "_cases_v" USING btree ("parent_id");
  CREATE INDEX "_cases_v_version_version_slug_idx" ON "_cases_v" USING btree ("version_slug");
  CREATE INDEX "_cases_v_version_version_image_idx" ON "_cases_v" USING btree ("version_image_id");
  CREATE INDEX "_cases_v_version_version_updated_at_idx" ON "_cases_v" USING btree ("version_updated_at");
  CREATE INDEX "_cases_v_version_version_created_at_idx" ON "_cases_v" USING btree ("version_created_at");
  CREATE INDEX "_cases_v_version_version__status_idx" ON "_cases_v" USING btree ("version__status");
  CREATE INDEX "_cases_v_created_at_idx" ON "_cases_v" USING btree ("created_at");
  CREATE INDEX "_cases_v_updated_at_idx" ON "_cases_v" USING btree ("updated_at");
  CREATE INDEX "_cases_v_snapshot_idx" ON "_cases_v" USING btree ("snapshot");
  CREATE INDEX "_cases_v_published_locale_idx" ON "_cases_v" USING btree ("published_locale");
  CREATE INDEX "_cases_v_latest_idx" ON "_cases_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_cases_v_locales_locale_parent_id_unique" ON "_cases_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_cases_v_rels_order_idx" ON "_cases_v_rels" USING btree ("order");
  CREATE INDEX "_cases_v_rels_parent_idx" ON "_cases_v_rels" USING btree ("parent_id");
  CREATE INDEX "_cases_v_rels_path_idx" ON "_cases_v_rels" USING btree ("path");
  CREATE INDEX "_cases_v_rels_products_id_idx" ON "_cases_v_rels" USING btree ("products_id");
  CREATE INDEX "_cases_v_rels_guides_id_idx" ON "_cases_v_rels" USING btree ("guides_id");
  CREATE INDEX "_cases_v_rels_solutions_id_idx" ON "_cases_v_rels" USING btree ("solutions_id");
  CREATE INDEX "_cases_v_rels_faqs_id_idx" ON "_cases_v_rels" USING btree ("faqs_id");
  CREATE INDEX "guides_sections_order_idx" ON "guides_sections" USING btree ("_order");
  CREATE INDEX "guides_sections_parent_id_idx" ON "guides_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "guides_sections_locales_locale_parent_id_unique" ON "guides_sections_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "guides_slug_idx" ON "guides" USING btree ("slug");
  CREATE INDEX "guides_image_idx" ON "guides" USING btree ("image_id");
  CREATE INDEX "guides_updated_at_idx" ON "guides" USING btree ("updated_at");
  CREATE INDEX "guides_created_at_idx" ON "guides" USING btree ("created_at");
  CREATE INDEX "guides__status_idx" ON "guides" USING btree ("_status");
  CREATE UNIQUE INDEX "guides_locales_locale_parent_id_unique" ON "guides_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guides_rels_order_idx" ON "guides_rels" USING btree ("order");
  CREATE INDEX "guides_rels_parent_idx" ON "guides_rels" USING btree ("parent_id");
  CREATE INDEX "guides_rels_path_idx" ON "guides_rels" USING btree ("path");
  CREATE INDEX "guides_rels_products_id_idx" ON "guides_rels" USING btree ("products_id");
  CREATE INDEX "guides_rels_guides_id_idx" ON "guides_rels" USING btree ("guides_id");
  CREATE INDEX "guides_rels_solutions_id_idx" ON "guides_rels" USING btree ("solutions_id");
  CREATE INDEX "guides_rels_faqs_id_idx" ON "guides_rels" USING btree ("faqs_id");
  CREATE INDEX "_guides_v_version_sections_order_idx" ON "_guides_v_version_sections" USING btree ("_order");
  CREATE INDEX "_guides_v_version_sections_parent_id_idx" ON "_guides_v_version_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_guides_v_version_sections_locales_locale_parent_id_unique" ON "_guides_v_version_sections_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guides_v_parent_idx" ON "_guides_v" USING btree ("parent_id");
  CREATE INDEX "_guides_v_version_version_slug_idx" ON "_guides_v" USING btree ("version_slug");
  CREATE INDEX "_guides_v_version_version_image_idx" ON "_guides_v" USING btree ("version_image_id");
  CREATE INDEX "_guides_v_version_version_updated_at_idx" ON "_guides_v" USING btree ("version_updated_at");
  CREATE INDEX "_guides_v_version_version_created_at_idx" ON "_guides_v" USING btree ("version_created_at");
  CREATE INDEX "_guides_v_version_version__status_idx" ON "_guides_v" USING btree ("version__status");
  CREATE INDEX "_guides_v_created_at_idx" ON "_guides_v" USING btree ("created_at");
  CREATE INDEX "_guides_v_updated_at_idx" ON "_guides_v" USING btree ("updated_at");
  CREATE INDEX "_guides_v_snapshot_idx" ON "_guides_v" USING btree ("snapshot");
  CREATE INDEX "_guides_v_published_locale_idx" ON "_guides_v" USING btree ("published_locale");
  CREATE INDEX "_guides_v_latest_idx" ON "_guides_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_guides_v_locales_locale_parent_id_unique" ON "_guides_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guides_v_rels_order_idx" ON "_guides_v_rels" USING btree ("order");
  CREATE INDEX "_guides_v_rels_parent_idx" ON "_guides_v_rels" USING btree ("parent_id");
  CREATE INDEX "_guides_v_rels_path_idx" ON "_guides_v_rels" USING btree ("path");
  CREATE INDEX "_guides_v_rels_products_id_idx" ON "_guides_v_rels" USING btree ("products_id");
  CREATE INDEX "_guides_v_rels_guides_id_idx" ON "_guides_v_rels" USING btree ("guides_id");
  CREATE INDEX "_guides_v_rels_solutions_id_idx" ON "_guides_v_rels" USING btree ("solutions_id");
  CREATE INDEX "_guides_v_rels_faqs_id_idx" ON "_guides_v_rels" USING btree ("faqs_id");
  CREATE INDEX "faqs_sections_order_idx" ON "faqs_sections" USING btree ("_order");
  CREATE INDEX "faqs_sections_parent_id_idx" ON "faqs_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "faqs_sections_locales_locale_parent_id_unique" ON "faqs_sections_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "faqs_slug_idx" ON "faqs" USING btree ("slug");
  CREATE INDEX "faqs_related_guide_idx" ON "faqs" USING btree ("related_guide_id");
  CREATE INDEX "faqs_updated_at_idx" ON "faqs" USING btree ("updated_at");
  CREATE INDEX "faqs_created_at_idx" ON "faqs" USING btree ("created_at");
  CREATE INDEX "faqs__status_idx" ON "faqs" USING btree ("_status");
  CREATE UNIQUE INDEX "faqs_locales_locale_parent_id_unique" ON "faqs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_faqs_v_version_sections_order_idx" ON "_faqs_v_version_sections" USING btree ("_order");
  CREATE INDEX "_faqs_v_version_sections_parent_id_idx" ON "_faqs_v_version_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_faqs_v_version_sections_locales_locale_parent_id_unique" ON "_faqs_v_version_sections_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_faqs_v_parent_idx" ON "_faqs_v" USING btree ("parent_id");
  CREATE INDEX "_faqs_v_version_version_slug_idx" ON "_faqs_v" USING btree ("version_slug");
  CREATE INDEX "_faqs_v_version_version_related_guide_idx" ON "_faqs_v" USING btree ("version_related_guide_id");
  CREATE INDEX "_faqs_v_version_version_updated_at_idx" ON "_faqs_v" USING btree ("version_updated_at");
  CREATE INDEX "_faqs_v_version_version_created_at_idx" ON "_faqs_v" USING btree ("version_created_at");
  CREATE INDEX "_faqs_v_version_version__status_idx" ON "_faqs_v" USING btree ("version__status");
  CREATE INDEX "_faqs_v_created_at_idx" ON "_faqs_v" USING btree ("created_at");
  CREATE INDEX "_faqs_v_updated_at_idx" ON "_faqs_v" USING btree ("updated_at");
  CREATE INDEX "_faqs_v_snapshot_idx" ON "_faqs_v" USING btree ("snapshot");
  CREATE INDEX "_faqs_v_published_locale_idx" ON "_faqs_v" USING btree ("published_locale");
  CREATE INDEX "_faqs_v_latest_idx" ON "_faqs_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_faqs_v_locales_locale_parent_id_unique" ON "_faqs_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "products_channel_material_order_idx" ON "products_channel_material" USING btree ("order");
  CREATE INDEX "products_channel_material_parent_idx" ON "products_channel_material" USING btree ("parent_id");
  CREATE INDEX "_products_v_version_channel_material_order_idx" ON "_products_v_version_channel_material" USING btree ("order");
  CREATE INDEX "_products_v_version_channel_material_parent_idx" ON "_products_v_version_channel_material" USING btree ("parent_id");
  CREATE INDEX "applications_rels_order_idx" ON "applications_rels" USING btree ("order");
  CREATE INDEX "applications_rels_parent_idx" ON "applications_rels" USING btree ("parent_id");
  CREATE INDEX "applications_rels_path_idx" ON "applications_rels" USING btree ("path");
  CREATE INDEX "applications_rels_products_id_idx" ON "applications_rels" USING btree ("products_id");
  CREATE INDEX "applications_rels_guides_id_idx" ON "applications_rels" USING btree ("guides_id");
  CREATE INDEX "applications_rels_solutions_id_idx" ON "applications_rels" USING btree ("solutions_id");
  CREATE INDEX "applications_rels_faqs_id_idx" ON "applications_rels" USING btree ("faqs_id");
  CREATE INDEX "_applications_v_rels_order_idx" ON "_applications_v_rels" USING btree ("order");
  CREATE INDEX "_applications_v_rels_parent_idx" ON "_applications_v_rels" USING btree ("parent_id");
  CREATE INDEX "_applications_v_rels_path_idx" ON "_applications_v_rels" USING btree ("path");
  CREATE INDEX "_applications_v_rels_products_id_idx" ON "_applications_v_rels" USING btree ("products_id");
  CREATE INDEX "_applications_v_rels_guides_id_idx" ON "_applications_v_rels" USING btree ("guides_id");
  CREATE INDEX "_applications_v_rels_solutions_id_idx" ON "_applications_v_rels" USING btree ("solutions_id");
  CREATE INDEX "_applications_v_rels_faqs_id_idx" ON "_applications_v_rels" USING btree ("faqs_id");
  CREATE INDEX "inquiries_attachments_order_idx" ON "inquiries_attachments" USING btree ("_order");
  CREATE INDEX "inquiries_attachments_parent_id_idx" ON "inquiries_attachments" USING btree ("_parent_id");
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_solutions_fk" FOREIGN KEY ("solutions_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_solutions_fk" FOREIGN KEY ("solutions_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_categories_v" ADD CONSTRAINT "_categories_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "materials" ADD CONSTRAINT "materials_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_materials_v" ADD CONSTRAINT "_materials_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "applications" ADD CONSTRAINT "applications_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_applications_v" ADD CONSTRAINT "_applications_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_solutions_fk" FOREIGN KEY ("solutions_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cases_fk" FOREIGN KEY ("cases_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_rels_guides_id_idx" ON "products_rels" USING btree ("guides_id");
  CREATE INDEX "products_rels_solutions_id_idx" ON "products_rels" USING btree ("solutions_id");
  CREATE INDEX "products_rels_faqs_id_idx" ON "products_rels" USING btree ("faqs_id");
  CREATE INDEX "_products_v_rels_guides_id_idx" ON "_products_v_rels" USING btree ("guides_id");
  CREATE INDEX "_products_v_rels_solutions_id_idx" ON "_products_v_rels" USING btree ("solutions_id");
  CREATE INDEX "_products_v_rels_faqs_id_idx" ON "_products_v_rels" USING btree ("faqs_id");
  CREATE INDEX "categories_image_idx" ON "categories" USING btree ("image_id");
  CREATE UNIQUE INDEX "categories_code_idx" ON "categories" USING btree ("code");
  CREATE INDEX "_categories_v_version_version_image_idx" ON "_categories_v" USING btree ("version_image_id");
  CREATE INDEX "_categories_v_version_version_code_idx" ON "_categories_v" USING btree ("version_code");
  CREATE INDEX "materials_image_idx" ON "materials" USING btree ("image_id");
  CREATE INDEX "_materials_v_version_version_image_idx" ON "_materials_v" USING btree ("version_image_id");
  CREATE INDEX "applications_image_idx" ON "applications" USING btree ("image_id");
  CREATE INDEX "_applications_v_version_version_image_idx" ON "_applications_v" USING btree ("version_image_id");
  CREATE INDEX "payload_locked_documents_rels_solutions_id_idx" ON "payload_locked_documents_rels" USING btree ("solutions_id");
  CREATE INDEX "payload_locked_documents_rels_cases_id_idx" ON "payload_locked_documents_rels" USING btree ("cases_id");
  CREATE INDEX "payload_locked_documents_rels_guides_id_idx" ON "payload_locked_documents_rels" USING btree ("guides_id");
  CREATE INDEX "payload_locked_documents_rels_faqs_id_idx" ON "payload_locked_documents_rels" USING btree ("faqs_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "solutions_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "solutions_sections_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "solutions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "solutions_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "solutions_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_solutions_v_version_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_solutions_v_version_sections_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_solutions_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_solutions_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_solutions_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cases_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cases_sections_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cases" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cases_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cases_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_cases_v_version_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_cases_v_version_sections_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_cases_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_cases_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_cases_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_sections_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guides_v_version_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guides_v_version_sections_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guides_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guides_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guides_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "faqs_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "faqs_sections_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "faqs_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_faqs_v_version_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_faqs_v_version_sections_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_faqs_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_faqs_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_channel_material" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_products_v_version_channel_material" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "applications_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_applications_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "inquiries_attachments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "solutions_sections" CASCADE;
  DROP TABLE "solutions_sections_locales" CASCADE;
  DROP TABLE "solutions" CASCADE;
  DROP TABLE "solutions_locales" CASCADE;
  DROP TABLE "solutions_rels" CASCADE;
  DROP TABLE "_solutions_v_version_sections" CASCADE;
  DROP TABLE "_solutions_v_version_sections_locales" CASCADE;
  DROP TABLE "_solutions_v" CASCADE;
  DROP TABLE "_solutions_v_locales" CASCADE;
  DROP TABLE "_solutions_v_rels" CASCADE;
  DROP TABLE "cases_sections" CASCADE;
  DROP TABLE "cases_sections_locales" CASCADE;
  DROP TABLE "cases" CASCADE;
  DROP TABLE "cases_locales" CASCADE;
  DROP TABLE "cases_rels" CASCADE;
  DROP TABLE "_cases_v_version_sections" CASCADE;
  DROP TABLE "_cases_v_version_sections_locales" CASCADE;
  DROP TABLE "_cases_v" CASCADE;
  DROP TABLE "_cases_v_locales" CASCADE;
  DROP TABLE "_cases_v_rels" CASCADE;
  DROP TABLE "guides_sections" CASCADE;
  DROP TABLE "guides_sections_locales" CASCADE;
  DROP TABLE "guides" CASCADE;
  DROP TABLE "guides_locales" CASCADE;
  DROP TABLE "guides_rels" CASCADE;
  DROP TABLE "_guides_v_version_sections" CASCADE;
  DROP TABLE "_guides_v_version_sections_locales" CASCADE;
  DROP TABLE "_guides_v" CASCADE;
  DROP TABLE "_guides_v_locales" CASCADE;
  DROP TABLE "_guides_v_rels" CASCADE;
  DROP TABLE "faqs_sections" CASCADE;
  DROP TABLE "faqs_sections_locales" CASCADE;
  DROP TABLE "faqs" CASCADE;
  DROP TABLE "faqs_locales" CASCADE;
  DROP TABLE "_faqs_v_version_sections" CASCADE;
  DROP TABLE "_faqs_v_version_sections_locales" CASCADE;
  DROP TABLE "_faqs_v" CASCADE;
  DROP TABLE "_faqs_v_locales" CASCADE;
  DROP TABLE "products_channel_material" CASCADE;
  DROP TABLE "_products_v_version_channel_material" CASCADE;
  DROP TABLE "applications_rels" CASCADE;
  DROP TABLE "_applications_v_rels" CASCADE;
  DROP TABLE "inquiries_attachments" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  ALTER TABLE "products_rels" DROP CONSTRAINT "products_rels_guides_fk";

  ALTER TABLE "products_rels" DROP CONSTRAINT "products_rels_solutions_fk";

  ALTER TABLE "products_rels" DROP CONSTRAINT "products_rels_faqs_fk";

  ALTER TABLE "_products_v_rels" DROP CONSTRAINT "_products_v_rels_guides_fk";

  ALTER TABLE "_products_v_rels" DROP CONSTRAINT "_products_v_rels_solutions_fk";

  ALTER TABLE "_products_v_rels" DROP CONSTRAINT "_products_v_rels_faqs_fk";

  ALTER TABLE "categories" DROP CONSTRAINT "categories_image_id_media_id_fk";

  ALTER TABLE "_categories_v" DROP CONSTRAINT "_categories_v_version_image_id_media_id_fk";

  ALTER TABLE "materials" DROP CONSTRAINT "materials_image_id_media_id_fk";

  ALTER TABLE "_materials_v" DROP CONSTRAINT "_materials_v_version_image_id_media_id_fk";

  ALTER TABLE "applications" DROP CONSTRAINT "applications_image_id_media_id_fk";

  ALTER TABLE "_applications_v" DROP CONSTRAINT "_applications_v_version_image_id_media_id_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_solutions_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_cases_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_guides_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_faqs_fk";

  ALTER TABLE "products_materials" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_products_materials";
  CREATE TYPE "public"."enum_products_materials" AS ENUM('NBR', 'EPDM', 'FKM', 'Silicone');
  ALTER TABLE "products_materials" ALTER COLUMN "value" SET DATA TYPE "public"."enum_products_materials" USING "value"::"public"."enum_products_materials";
  ALTER TABLE "_products_v_version_materials" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum__products_v_version_materials";
  CREATE TYPE "public"."enum__products_v_version_materials" AS ENUM('NBR', 'EPDM', 'FKM', 'Silicone');
  ALTER TABLE "_products_v_version_materials" ALTER COLUMN "value" SET DATA TYPE "public"."enum__products_v_version_materials" USING "value"::"public"."enum__products_v_version_materials";
  ALTER TABLE "inquiries" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "inquiries" ALTER COLUMN "status" SET DEFAULT 'new'::text;
  DROP TYPE "public"."enum_inquiries_status";
  CREATE TYPE "public"."enum_inquiries_status" AS ENUM('new', 'in-progress', 'closed');
  ALTER TABLE "inquiries" ALTER COLUMN "status" SET DEFAULT 'new'::"public"."enum_inquiries_status";
  ALTER TABLE "inquiries" ALTER COLUMN "status" SET DATA TYPE "public"."enum_inquiries_status" USING "status"::"public"."enum_inquiries_status";
  ALTER TABLE "translation_runs" ALTER COLUMN "target_collection" SET DATA TYPE text;
  DROP TYPE "public"."enum_translation_runs_target_collection";
  CREATE TYPE "public"."enum_translation_runs_target_collection" AS ENUM('products', 'categories', 'materials', 'applications', 'pages');
  ALTER TABLE "translation_runs" ALTER COLUMN "target_collection" SET DATA TYPE "public"."enum_translation_runs_target_collection" USING "target_collection"::"public"."enum_translation_runs_target_collection";
  DROP INDEX "products_rels_guides_id_idx";
  DROP INDEX "products_rels_solutions_id_idx";
  DROP INDEX "products_rels_faqs_id_idx";
  DROP INDEX "_products_v_rels_guides_id_idx";
  DROP INDEX "_products_v_rels_solutions_id_idx";
  DROP INDEX "_products_v_rels_faqs_id_idx";
  DROP INDEX "categories_image_idx";
  DROP INDEX "categories_code_idx";
  DROP INDEX "_categories_v_version_version_image_idx";
  DROP INDEX "_categories_v_version_version_code_idx";
  DROP INDEX "materials_image_idx";
  DROP INDEX "_materials_v_version_version_image_idx";
  DROP INDEX "applications_image_idx";
  DROP INDEX "_applications_v_version_version_image_idx";
  DROP INDEX "payload_locked_documents_rels_solutions_id_idx";
  DROP INDEX "payload_locked_documents_rels_cases_id_idx";
  DROP INDEX "payload_locked_documents_rels_guides_id_idx";
  DROP INDEX "payload_locked_documents_rels_faqs_id_idx";
  ALTER TABLE "products" DROP COLUMN "line";
  ALTER TABLE "products_rels" DROP COLUMN "guides_id";
  ALTER TABLE "products_rels" DROP COLUMN "solutions_id";
  ALTER TABLE "products_rels" DROP COLUMN "faqs_id";
  ALTER TABLE "_products_v" DROP COLUMN "version_line";
  ALTER TABLE "_products_v_rels" DROP COLUMN "guides_id";
  ALTER TABLE "_products_v_rels" DROP COLUMN "solutions_id";
  ALTER TABLE "_products_v_rels" DROP COLUMN "faqs_id";
  ALTER TABLE "categories" DROP COLUMN "line";
  ALTER TABLE "categories" DROP COLUMN "image_id";
  ALTER TABLE "categories" DROP COLUMN "code";
  ALTER TABLE "categories" DROP COLUMN "featured";
  ALTER TABLE "_categories_v" DROP COLUMN "version_line";
  ALTER TABLE "_categories_v" DROP COLUMN "version_image_id";
  ALTER TABLE "_categories_v" DROP COLUMN "version_code";
  ALTER TABLE "_categories_v" DROP COLUMN "version_featured";
  ALTER TABLE "materials" DROP COLUMN "line";
  ALTER TABLE "materials" DROP COLUMN "image_id";
  ALTER TABLE "materials" DROP COLUMN "family";
  ALTER TABLE "_materials_v" DROP COLUMN "version_line";
  ALTER TABLE "_materials_v" DROP COLUMN "version_image_id";
  ALTER TABLE "_materials_v" DROP COLUMN "version_family";
  ALTER TABLE "applications" DROP COLUMN "line";
  ALTER TABLE "applications" DROP COLUMN "image_id";
  ALTER TABLE "_applications_v" DROP COLUMN "version_line";
  ALTER TABLE "_applications_v" DROP COLUMN "version_image_id";
  ALTER TABLE "inquiries" DROP COLUMN "line";
  ALTER TABLE "inquiries" DROP COLUMN "safety_critical";
  ALTER TABLE "inquiries" DROP COLUMN "rfq";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "solutions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "cases_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "guides_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "faqs_id";
  DROP TYPE "public"."enum_solutions_line";
  DROP TYPE "public"."enum_solutions_status";
  DROP TYPE "public"."enum__solutions_v_version_line";
  DROP TYPE "public"."enum__solutions_v_version_status";
  DROP TYPE "public"."enum__solutions_v_published_locale";
  DROP TYPE "public"."enum_cases_line";
  DROP TYPE "public"."enum_cases_scenario_type";
  DROP TYPE "public"."enum_cases_status";
  DROP TYPE "public"."enum__cases_v_version_line";
  DROP TYPE "public"."enum__cases_v_version_scenario_type";
  DROP TYPE "public"."enum__cases_v_version_status";
  DROP TYPE "public"."enum__cases_v_published_locale";
  DROP TYPE "public"."enum_guides_line";
  DROP TYPE "public"."enum_guides_topic";
  DROP TYPE "public"."enum_guides_status";
  DROP TYPE "public"."enum__guides_v_version_line";
  DROP TYPE "public"."enum__guides_v_version_topic";
  DROP TYPE "public"."enum__guides_v_version_status";
  DROP TYPE "public"."enum__guides_v_published_locale";
  DROP TYPE "public"."enum_faqs_line";
  DROP TYPE "public"."enum_faqs_status";
  DROP TYPE "public"."enum__faqs_v_version_line";
  DROP TYPE "public"."enum__faqs_v_version_status";
  DROP TYPE "public"."enum__faqs_v_published_locale";
  DROP TYPE "public"."enum_products_channel_material";
  DROP TYPE "public"."enum_products_line";
  DROP TYPE "public"."enum__products_v_version_channel_material";
  DROP TYPE "public"."enum__products_v_version_line";
  DROP TYPE "public"."enum_categories_line";
  DROP TYPE "public"."enum__categories_v_version_line";
  DROP TYPE "public"."enum_materials_line";
  DROP TYPE "public"."enum_materials_family";
  DROP TYPE "public"."enum__materials_v_version_line";
  DROP TYPE "public"."enum__materials_v_version_family";
  DROP TYPE "public"."enum_applications_line";
  DROP TYPE "public"."enum__applications_v_version_line";
  DROP TYPE "public"."enum_inquiries_line";
  DROP TYPE "public"."enum_inquiries_safety_critical";`)
}
