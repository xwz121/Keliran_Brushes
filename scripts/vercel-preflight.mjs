// Runs before every Vercel build. A production build stops with a readable list when required
// settings are missing or unsafe, or when the database has not been migrated; previews only warn.
// Values are never printed. Local: VERCEL_ENV=production node scripts/vercel-preflight.mjs
import { readdirSync } from 'node:fs'
import pg from 'pg'

const env = process.env
const production = env.VERCEL_ENV === 'production' || env.DEPLOYMENT_ENV === 'production'
const problems = []
const warnings = []
const fail = (message) => (production ? problems : warnings).push(message)

// Needed by every build: Payload loads its configuration while Next collects route data.
for (const key of ['DATABASE_URL', 'PAYLOAD_SECRET'])
  if (!env[key]) problems.push(`${key} is not set (Payload cannot load its configuration).`)

// A working production site: storage, private enquiry files, the queue cron and spam protection.
for (const key of [
  'R2_BUCKET',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_ENDPOINT',
  'R2_PUBLIC_URL',
  'R2_PRIVATE_BUCKET',
  'CRON_SECRET',
  'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  'TURNSTILE_SECRET_KEY',
])
  if (!env[key]) fail(`${key} is not set.`)
for (const key of ['POSTMARK_SERVER_TOKEN', 'EMAIL_FROM', 'SALES_EMAIL'])
  if (!env[key])
    warnings.push(`${key} is not set: enquiries are saved but no notification or acknowledgement is sent.`)
// Postmark's test token accepts requests without delivering anything: Preview only.
if (production && env.POSTMARK_SERVER_TOKEN === 'POSTMARK_API_TEST')
  problems.push('POSTMARK_SERVER_TOKEN is the Postmark test token; set the real server token in Production.')

if (env.PAYLOAD_SECRET && env.PAYLOAD_SECRET.length < 32)
  fail('PAYLOAD_SECRET must be at least 32 characters and must differ from keliran.com.')
if (env.CRON_SECRET && env.CRON_SECRET.length < 32)
  fail('CRON_SECRET should be at least 32 random characters.')
if (env.R2_BUCKET && env.R2_PRIVATE_BUCKET && env.R2_BUCKET === env.R2_PRIVATE_BUCKET)
  fail('R2_PRIVATE_BUCKET must be the private bucket, not the public R2_BUCKET.')
if (env.R2_PUBLIC_URL && !/^https:\/\//.test(env.R2_PUBLIC_URL))
  fail('R2_PUBLIC_URL must be an https:// URL.')
if (env.DATABASE_POOL_MAX && !/^([1-9]|1\d|20)$/.test(env.DATABASE_POOL_MAX))
  fail('DATABASE_POOL_MAX must be a whole number from 1 to 20.')
if (env.CONTENT_PREVIEW_MODE === 'true' && production)
  fail('CONTENT_PREVIEW_MODE must be false in production.')

// The schema must already be migrated: builds never migrate (see docs/deployment.md).
const connection = env.DATABASE_URL_UNPOOLED || env.DATABASE_URL
if (connection) {
  const host = new URL(connection).hostname
  if (production && ['localhost', '127.0.0.1', '::1'].includes(host))
    problems.push('DATABASE_URL points at a local database.')
  else {
    const expected = readdirSync('src/migrations')
      .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
      .map((f) => f.replace(/\.ts$/, ''))
      .sort()
    const client = new pg.Client({ connectionString: connection, connectionTimeoutMillis: 10000 })
    try {
      await client.connect()
      const table = await client.query("select to_regclass('public.payload_migrations') as name")
      const applied = table.rows[0].name
        ? (await client.query("select name from payload_migrations where name <> 'dev'")).rows.map(
            (r) => r.name,
          )
        : []
      const missing = expected.filter((name) => !applied.includes(name))
      if (missing.length)
        fail(
          `Database migrations not applied: ${missing.join(', ')}. Run pnpm migrate against this database first.`,
        )
      if (!(await client.query("select to_regclass('public.migration_records') as name")).rows[0].name)
        fail(
          'The database has no migration_records table: this is not the brushes database, or it is not migrated.',
        )
    } catch (error) {
      fail(
        `Could not check database migrations: ${error instanceof Error ? error.message : error}. On Alibaba RDS, check the public endpoint, the IP whitelist for Vercel and the SSL parameters.`,
      )
    } finally {
      await client.end().catch(() => {})
    }
  }
}

const label = production ? 'production' : env.VERCEL_ENV || 'local'
for (const w of warnings) console.warn(`[preflight:${label}] warning: ${w}`)
if (problems.length) {
  for (const p of problems) console.error(`[preflight:${label}] ${p}`)
  console.error(`[preflight:${label}] Fix the settings above in the Vercel project, then redeploy.`)
  process.exit(1)
}
console.log(
  `[preflight:${label}] configuration checks passed${warnings.length ? ` with ${warnings.length} warning(s)` : ''}.`,
)
