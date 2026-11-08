import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { Client } from 'pg'
import { approvedRelease } from './lib/approved-release'
import { migrations } from '../src/migrations'
import { cloudDatabase, ensureDataSnapshot, releaseHash, releaseState } from './lib/vercel-release'

// This file deliberately does not load dotenv. Preview builds never open a DB.
if (process.env.VERCEL_ENV !== 'production') {
  console.log('Content release skipped: not a Vercel production build.')
  process.exit(0)
}
const { manifestHash } = await approvedRelease()
const connection = cloudDatabase(process.env, manifestHash)
const db = new Client({ connectionString: connection, connectionTimeoutMillis: 30000 })
const lockDB = new Client({ connectionString: connection, connectionTimeoutMillis: 30000 })
let stage = 'connection'
const run = (args: string[]) =>
  new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        DATABASE_URL: connection,
        DATABASE_URL_UNPOOLED: connection,
      },
    })
    child.on('error', reject)
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`Release step failed (${code})`))))
  })
try {
  await db.connect()
  await lockDB.connect()
  // An explicit transaction pins the lock even through a transaction-mode pooler.
  await lockDB.query('BEGIN')
  const lock = await lockDB.query('SELECT pg_try_advisory_xact_lock(hashtextextended($1, 0)) AS locked', [
    releaseHash,
  ])
  assert.equal(lock.rows[0].locked, true, 'Another release is running; retry after it finishes')
  const applied = await db.query('SELECT name, batch FROM public.payload_migrations ORDER BY id')
  console.log(JSON.stringify({ release: 'migration-preflight', applied: applied.rows.map((r) => r.name) }))
  assert.ok(applied.rows.length > 0, 'Existing migration history required')
  assert.ok(
    applied.rows.every((r) => r.batch >= 0 && migrations.some((m) => m.name === r.name)),
    'Unrecognised migration baseline; inspect before continuing',
  )
  stage = 'data-snapshot'
  const state = await ensureDataSnapshot(db, connection)
  if (state.completed_at) console.log('Approved content already published; preserving subsequent CMS edits.')
  else {
    stage = 'migrations'
    await run(['scripts/migrate.mjs'])
    stage = 'content-import'
    await run(['--import', 'tsx', 'scripts/publish-approved-release.ts', '--apply', '--vercel-release'])
    assert.ok((await releaseState(db))?.completed_at, 'Missing committed release receipt')
    console.log('VERCEL PRODUCTION RELEASE COMPLETE: 118 records, 8 locales, 20 approved images.')
  }
  if (!(await releaseState(db))?.result?.legacyRetiredAt) {
    stage = 'retire-superseded-content'
    const { retireLegacyContent } = await import('./retire-legacy-content')
    await retireLegacyContent()
  }
} catch (error) {
  // Connection errors can include secrets. Do not emit the connection or raw query parameters.
  console.error(
    'Vercel release failed; deployment must not be promoted. Inspect the preceding safe step logs.',
  )
  const code = (error as { code?: string })?.code
  console.error(
    JSON.stringify({
      stage,
      code,
      message:
        typeof code === 'string' && code.startsWith('42') && error instanceof Error
          ? error.message
          : undefined,
    }),
  )
  if (error instanceof assert.AssertionError) console.error(error.message)
  process.exitCode = 1
} finally {
  await lockDB.query('ROLLBACK').catch(() => {})
  await lockDB.end()
  await db.end()
}
// Payload's PostgreSQL adapter retains its initial connection after destroy.
// Match Payload's CLI: exit only after all transactions and our lock are closed.
process.exit(process.exitCode || 0)
