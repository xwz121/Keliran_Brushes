import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "phone_secondary" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "secondary_legal_entity" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "secondary_registration_no" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "secondary_address_country" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "registration_jurisdiction" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "secondary_registration_jurisdiction" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "secondary_address_lines" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "whatsapp_number_secondary" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "phone_secondary";
  ALTER TABLE "site_settings" DROP COLUMN "secondary_legal_entity";
  ALTER TABLE "site_settings" DROP COLUMN "secondary_registration_no";
  ALTER TABLE "site_settings" DROP COLUMN "secondary_address_country";
  ALTER TABLE "site_settings" DROP COLUMN "registration_jurisdiction";
  ALTER TABLE "site_settings" DROP COLUMN "secondary_registration_jurisdiction";
  ALTER TABLE "site_settings" DROP COLUMN "secondary_address_lines";
  ALTER TABLE "site_settings" DROP COLUMN "whatsapp_number_secondary";`)
}
